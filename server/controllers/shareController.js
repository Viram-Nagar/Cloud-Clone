const supabase = require("../config/supabaseClient");
const db = require("../db");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

// --- 1. SHARE BY EMAIL ---
exports.shareInternal = async (req, res) => {
  try {
    const { email, role, fileId, folderId } = req.body;
    const ownerId = req.user.id;

    // Find the user being invited
    const userResult = await db.query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);
    if (userResult.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "User not found with this email" });
    }
    const granteeId = userResult.rows[0].id;

    // Prevent sharing with yourself
    if (granteeId === ownerId) {
      return res
        .status(400)
        .json({ message: "You cannot share a file with yourself" });
    }

    // Security Check: Only the owner can share
    const table = fileId ? "files" : "folders";
    const resourceId = fileId || folderId;
    const ownerCheck = await db.query(
      `SELECT id FROM ${table} WHERE id = $1 AND owner_id = $2`,
      [resourceId, ownerId],
    );
    if (ownerCheck.rows.length === 0) {
      return res
        .status(403)
        .json({ message: "Unauthorized: Only owners can share" });
    }

    // Insert or Update the share
    const query = `
      INSERT INTO shares (file_id, folder_id, grantee_id, role, created_by)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT ON CONSTRAINT ${fileId ? "unique_file_share" : "unique_folder_share"} 
      DO UPDATE SET role = EXCLUDED.role
      RETURNING *;
    `;
    const result = await db.query(query, [
      fileId || null,
      folderId || null,
      granteeId,
      role || "viewer",
      ownerId,
    ]);

    // Log Activity
    await db.query(
      "INSERT INTO activities (user_id, action, details) VALUES ($1, $2, $3)",
      [ownerId, "shared", `Invited ${email} as ${role || "viewer"}`],
    );

    res
      .status(200)
      .json({ message: "Share updated successfully", share: result.rows[0] });
  } catch (error) {
    console.error("Share Internal Error:", error);
    res.status(500).json({ message: "Error sharing resource" });
  }
};

// --- 2. GENERATE PUBLIC LINK ---
exports.generatePublicLink = async (req, res) => {
  try {
    const { fileId, folderId, password, expiresAt } = req.body;
    const creatorId = req.user.id;

    const token = crypto.randomBytes(32).toString("hex");

    let passwordHash = null;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const query = `
      INSERT INTO link_shares (file_id, folder_id, token, password_hash, expires_at, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING token, expires_at;
    `;
    const result = await db.query(query, [
      fileId || null,
      folderId || null,
      token,
      passwordHash,
      expiresAt || null,
      creatorId,
    ]);

    await db.query(
      "INSERT INTO activities (user_id, action, details) VALUES ($1, $2, $3)",
      [
        creatorId,
        "shared_publicly",
        `Created public link for ${fileId ? "file" : "folder"}`,
      ],
    );

    const publicUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/share/${token}`;

    res.status(201).json({
      message: "Public link generated successfully",
      publicUrl,
      token: result.rows[0].token,
      expiresAt: result.rows[0].expires_at,
    });
  } catch (error) {
    console.error("Public Link Generation Error:", error);
    res.status(500).json({ message: "Failed to generate public link" });
  }
};

// --- 3. GET PUBLIC RESOURCE (via token) ---
exports.getPublicResource = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.query;

    const shareQuery = `
      SELECT ls.*, f.name as file_name, fl.name as folder_name 
      FROM link_shares ls
      LEFT JOIN files f ON ls.file_id = f.id
      LEFT JOIN folders fl ON ls.folder_id = fl.id
      WHERE ls.token = $1
    `;
    const result = await db.query(shareQuery, [token]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Link not found or invalid" });
    }

    const share = result.rows[0];

    // Check expiry
    if (share.expires_at && new Date() > new Date(share.expires_at)) {
      return res.status(410).json({ message: "This link has expired" });
    }

    // Check password
    if (share.password_hash) {
      if (!password) {
        return res.status(401).json({
          message: "Password required for this link",
          passwordRequired: true,
        });
      }
      const isMatch = await bcrypt.compare(password, share.password_hash);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid password" });
      }
    }

    res.status(200).json({
      message: "Access granted",
      resourceType: share.file_id ? "file" : "folder",
      data: {
        name: share.file_name || share.folder_name,
        fileId: share.file_id,
        folderId: share.folder_id,
      },
    });
  } catch (error) {
    console.error("Public Access Error:", error);
    res.status(500).json({ message: "Error accessing shared resource" });
  }
};

// --- 4. GET PUBLIC DOWNLOAD URL ---
exports.getPublicDownloadUrl = async (req, res) => {
  try {
    const { token } = req.params;

    const shareResult = await db.query(
      "SELECT f.storage_key FROM link_shares ls JOIN files f ON ls.file_id = f.id WHERE ls.token = $1",
      [token],
    );

    if (shareResult.rows.length === 0) {
      return res.status(404).json({ message: "Token not found" });
    }

    const storage_key = shareResult.rows[0].storage_key;

    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .createSignedUrl(storage_key, 600);

    if (error) throw error;

    res.status(200).json({ downloadUrl: data.signedUrl });
  } catch (error) {
    res.status(500).json({ message: "Public download failed" });
  }
};

// --- 5. GET SHARES LIST ← NEW ---
exports.getShares = async (req, res) => {
  try {
    const { resourceType, resourceId } = req.params;
    const userId = req.user.id;

    const column = resourceType === "folder" ? "folder_id" : "file_id";

    const result = await db.query(
      `SELECT s.id, s.role, u.email as grantee_email, u.name as grantee_name
       FROM shares s
       JOIN users u ON s.grantee_id = u.id
       WHERE s.${column} = $1
       AND s.created_by = $2`,
      [resourceId, userId],
    );

    res.status(200).json({ shares: result.rows });
  } catch (error) {
    console.error("Get Shares Error:", error);
    res.status(500).json({ message: "Error fetching shares" });
  }
};

// --- 6. REVOKE SHARE ← NEW ---
exports.revokeShare = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await db.query(
      "DELETE FROM shares WHERE id = $1 AND created_by = $2 RETURNING *",
      [id, userId],
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Share not found or unauthorized" });
    }

    res.status(200).json({ message: "Share revoked successfully" });
  } catch (error) {
    console.error("Revoke Share Error:", error);
    res.status(500).json({ message: "Error revoking share" });
  }
};

// const supabase = require("../config/supabaseClient");

// const db = require("../db");
// const crypto = require("crypto"); // For secure tokens
// const bcrypt = require("bcrypt"); // For link passwords

// exports.shareInternal = async (req, res) => {
//   try {
//     const { email, role, fileId, folderId } = req.body;
//     const ownerId = req.user.id;

//     // 1. Find the user being invited
//     const userResult = await db.query("SELECT id FROM users WHERE email = $1", [
//       email,
//     ]);
//     if (userResult.rows.length === 0) {
//       return res
//         .status(404)
//         .json({ message: "User not found with this email" });
//     }
//     const granteeId = userResult.rows[0].id;

//     // 2. Prevent sharing with yourself
//     if (granteeId === ownerId) {
//       return res
//         .status(400)
//         .json({ message: "You cannot share a file with yourself" });
//     }

//     // 3. Security Check: Only the owner can share
//     const table = fileId ? "files" : "folders";
//     const resourceId = fileId || folderId;
//     const ownerCheck = await db.query(
//       `SELECT id FROM ${table} WHERE id = $1 AND owner_id = $2`,
//       [resourceId, ownerId],
//     );

//     if (ownerCheck.rows.length === 0) {
//       return res
//         .status(403)
//         .json({ message: "Unauthorized: Only owners can share" });
//     }

//     // 4. Insert or Update the share
//     const query = `
//       INSERT INTO shares (file_id, folder_id, grantee_id, role, created_by)
//       VALUES ($1, $2, $3, $4, $5)
//       ON CONFLICT ON CONSTRAINT ${fileId ? "unique_file_share" : "unique_folder_share"}
//       DO UPDATE SET role = EXCLUDED.role
//       RETURNING *;
//     `;
//     const result = await db.query(query, [
//       fileId || null,
//       folderId || null,
//       granteeId,
//       role || "viewer",
//       ownerId,
//     ]);

//     // 5. Log Activity
//     await db.query(
//       "INSERT INTO activities (user_id, action, details) VALUES ($1, $2, $3)",
//       [ownerId, "shared", `Invited ${email} as ${role || "viewer"}`],
//     );

//     res
//       .status(200)
//       .json({ message: "Share updated successfully", share: result.rows[0] });
//   } catch (error) {
//     console.error("Share Internal Error:", error);
//     res.status(500).json({ message: "Error sharing resource" });
//   }
// };

// exports.generatePublicLink = async (req, res) => {
//   try {
//     const { fileId, folderId, password, expiresAt } = req.body;
//     const creatorId = req.user.id;

//     // 1. Generate a high-entropy 64-character token
//     // This satisfies the "Unique shareable links" requirement
//     const token = crypto.randomBytes(32).toString("hex");

//     // 2. Hash password if provided (Requirement: Password protection)
//     let passwordHash = null;
//     if (password) {
//       passwordHash = await bcrypt.hash(password, 10);
//     }

//     // 3. Insert into link_shares table
//     const query = `
//       INSERT INTO link_shares (file_id, folder_id, token, password_hash, expires_at, created_by)
//       VALUES ($1, $2, $3, $4, $5, $6)
//       RETURNING token, expires_at;
//     `;

//     const result = await db.query(query, [
//       fileId || null,
//       folderId || null,
//       token,
//       passwordHash,
//       expiresAt || null, // Requirement: Expiry dates
//       creatorId,
//     ]);

//     // 4. Log the activity (Requirement: Activity Logging)
//     await db.query(
//       "INSERT INTO activities (user_id, action, details) VALUES ($1, $2, $3)",
//       [
//         creatorId,
//         "shared_publicly",
//         `Created public link for ${fileId ? "file" : "folder"}`,
//       ],
//     );

//     // 5. Construct the link (Frontend will use this token to fetch data)
//     const publicUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/share/${token}`;

//     res.status(201).json({
//       message: "Public link generated successfully",
//       publicUrl,
//       token: result.rows[0].token,
//       expiresAt: result.rows[0].expires_at,
//     });
//   } catch (error) {
//     console.error("Public Link Generation Error:", error);
//     res.status(500).json({ message: "Failed to generate public link" });
//   }
// };

// exports.getPublicResource = async (req, res) => {
//   try {
//     const { token } = req.params;
//     const { password } = req.query; // Check if password was sent in query params

//     // 1. Fetch the share link details
//     const shareQuery = `
//       SELECT ls.*, f.name as file_name, fl.name as folder_name
//       FROM link_shares ls
//       LEFT JOIN files f ON ls.file_id = f.id
//       LEFT JOIN folders fl ON ls.folder_id = fl.id
//       WHERE ls.token = $1
//     `;
//     const result = await db.query(shareQuery, [token]);

//     if (result.rows.length === 0) {
//       return res.status(404).json({ message: "Link not found or invalid" });
//     }

//     const share = result.rows[0];

//     // 2. CHECK EXPIRY: If now() > expires_at, block it
//     if (share.expires_at && new Date() > new Date(share.expires_at)) {
//       return res.status(410).json({ message: "This link has expired" });
//     }

//     // 3. CHECK PASSWORD: If password_hash exists, verify it
//     if (share.password_hash) {
//       if (!password) {
//         return res.status(401).json({
//           message: "Password required for this link",
//           passwordRequired: true,
//         });
//       }

//       const isMatch = await bcrypt.compare(password, share.password_hash);
//       if (!isMatch) {
//         return res.status(401).json({ message: "Invalid password" });
//       }
//     }

//     // 4. If all checks pass, return the data
//     res.status(200).json({
//       message: "Access granted",
//       resourceType: share.file_id ? "file" : "folder",
//       data: {
//         name: share.file_name || share.folder_name,
//         fileId: share.file_id,
//         folderId: share.folder_id,
//       },
//     });
//   } catch (error) {
//     console.error("Public Access Error:", error);
//     res.status(500).json({ message: "Error accessing shared resource" });
//   }
// };

// exports.getPublicDownloadUrl = async (req, res) => {
//   try {
//     const { token } = req.params;
//     // We reuse the same verification logic from Step 6
//     // (Password check, Expiry check... usually you'd refactor this into a helper)

//     // For now, let's assume the token is validated.
//     // We get the file_id associated with this token:
//     const shareResult = await db.query(
//       "SELECT f.storage_key FROM link_shares ls JOIN files f ON ls.file_id = f.id WHERE ls.token = $1",
//       [token],
//     );

//     const storage_key = shareResult.rows[0].storage_key;

//     const { data, error } = await supabase.storage
//       .from(process.env.SUPABASE_BUCKET)
//       .createSignedUrl(storage_key, 600); // 10 mins for public links

//     res.status(200).json({ downloadUrl: data.signedUrl });
//   } catch (error) {
//     res.status(500).json({ message: "Public download failed" });
//   }
// };
