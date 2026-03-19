const db = require("../db");
const supabase = require("../config/supabaseClient");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");

// --- MULTER CONFIGURATION (Security & Validation) ---
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB Max
  fileFilter: (req, file, cb) => {
    // Allowed Mime-Types: Images, PDF, and DOCX
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only JPEG, PNG, PDF, and DOCX are allowed.",
        ),
        false,
      );
    }
  },
}).single("file"); // Key name must be "file" in Postman

// 1. Fetch all files for a user (optionally inside a folder)
// server/controllers/fileController.js

// 1. Fetch all files using raw SQL (db.js)
exports.getFiles = async (req, res) => {
  try {
    const { folderId } = req.query;
    const userId = req.user.id;

    let queryText;
    let queryParams;

    if (folderId && folderId !== "null") {
      // Fetch files within a specific folder
      queryText = `
        SELECT * FROM files 
        WHERE owner_id = $1 
        AND folder_id = $2 
        AND is_deleted = false 
        ORDER BY created_at DESC
      `;
      queryParams = [userId, folderId];
    } else {
      // Fetch files in the root directory (folder_id is NULL)
      queryText = `
        SELECT * FROM files 
        WHERE owner_id = $1 
        AND folder_id IS NULL 
        AND is_deleted = false 
        ORDER BY created_at DESC
      `;
      queryParams = [userId];
    }

    const result = await db.query(queryText, queryParams);

    res.status(200).json({ files: result.rows });
  } catch (err) {
    console.error("Fetch Files Error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// 2. Fetch all folders using raw SQL (db.js)
exports.getFolders = async (req, res) => {
  try {
    const { parentId } = req.query;
    const userId = req.user.id;

    let queryText;
    let queryParams;

    if (parentId && parentId !== "null") {
      // Fetch sub-folders
      queryText = `
        SELECT * FROM folders 
        WHERE owner_id = $1 
        AND parent_id = $2 
        AND is_deleted = false 
        ORDER BY name ASC
      `;
      queryParams = [userId, parentId];
    } else {
      // Fetch root folders
      queryText = `
        SELECT * FROM folders 
        WHERE owner_id = $1 
        AND parent_id IS NULL 
        AND is_deleted = false 
        ORDER BY name ASC
      `;
      queryParams = [userId];
    }

    const result = await db.query(queryText, queryParams);

    res.status(200).json({ folders: result.rows });
  } catch (err) {
    console.error("Fetch Folders Error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// --- 1. INITIALIZE UPLOAD ---
exports.initializeUpload = async (req, res) => {
  try {
    const { fileName, mimeType, folderId = null } = req.body;
    const ownerId = req.user.id; // From authMiddleware

    if (!fileName) {
      return res.status(400).json({ message: "File name is required" });
    }

    const fileUuid = uuidv4();
    const storageKey = `tenants/${ownerId}/files/${fileUuid}-${fileName}`;

    const query = `
      INSERT INTO files (name, storage_key, mime_type, owner_id, folder_id, status)
      VALUES ($1, $2, $3, $4, $5, 'pending')
      RETURNING id, storage_key;
    `;

    const values = [fileName, storageKey, mimeType, ownerId, folderId];
    const result = await db.query(query, values);

    res.status(201).json({
      message: "Upload initialized",
      fileId: result.rows[0].id,
      storageKey: result.rows[0].storage_key,
    });
  } catch (error) {
    console.error("Init Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// --- 2. EXECUTE UPLOAD ---

exports.uploadFile = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });
    if (!req.file) return res.status(400).json({ message: "No file provided" });

    const { fileId } = req.params;
    const userId = req.user.id;

    try {
      const currentFile = await db.query(
        "SELECT storage_key, size_bytes, version_number FROM files WHERE id = $1 AND owner_id = $2",
        [fileId, userId],
      );

      if (currentFile.rows.length === 0) {
        return res
          .status(404)
          .json({ message: "File not found or access denied" });
      }

      const { storage_key, size_bytes, version_number } = currentFile.rows[0];

      // 1. ARCHIVE OLD VERSION FIRST (before touching storage)
      if (size_bytes > 0) {
        await db.query(
          "INSERT INTO file_versions (file_id, storage_key, size_bytes, version_number) VALUES ($1, $2, $3, $4)",
          [fileId, storage_key, size_bytes, version_number],
        );
      }

      // 2. GENERATE NEW STORAGE KEY for new version
      // This prevents overwriting — old file stays safe in storage
      const newStorageKey = `tenants/${userId}/files/${uuidv4()}-v${version_number + 1}-${req.file.originalname}`;

      // 3. UPLOAD NEW FILE to new storage key
      const { error } = await supabase.storage
        .from(process.env.SUPABASE_BUCKET)
        .upload(newStorageKey, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false, // Never overwrite
        });

      if (error) throw error;

      // 4. UPDATE DB with new storage key + increment version
      await db.query(
        "UPDATE files SET status = 'available', size_bytes = $1, version_number = version_number + 1, storage_key = $2, updated_at = NOW() WHERE id = $3",
        [req.file.size, newStorageKey, fileId],
      );

      // 5. LOG ACTIVITY
      await db.query(
        "INSERT INTO activities (user_id, file_id, action) VALUES ($1, $2, $3)",
        [userId, fileId, "updated_version"],
      );

      res.status(200).json({
        message: "File updated successfully",
        newVersion: version_number + 1,
      });
    } catch (error) {
      console.error("Upload Error:", error);
      res.status(500).json({ error: error.message });
    }
  });
};

// exports.uploadFile = async (req, res) => {
//   // 1. Trigger Multer to handle the file buffer
//   upload(req, res, async (err) => {
//     if (err) return res.status(400).json({ message: err.message });
//     if (!req.file) return res.status(400).json({ message: "No file provided" });

//     const { fileId } = req.params;
//     const userId = req.user.id;

//     try {
//       // 2. Get current file details and check ownership
//       const currentFile = await db.query(
//         "SELECT storage_key, size_bytes, version_number FROM files WHERE id = $1 AND owner_id = $2",
//         [fileId, userId],
//       );

//       if (currentFile.rows.length === 0) {
//         return res
//           .status(404)
//           .json({ message: "File not found or access denied" });
//       }

//       const { storage_key, size_bytes, version_number } = currentFile.rows[0];

//       // 3. ARCHIVE THE OLD VERSION (The Snapshot)
//       // We only save a version if the file actually had data (size > 0)
//       if (size_bytes > 0) {
//         await db.query(
//           "INSERT INTO file_versions (file_id, storage_key, size_bytes, version_number) VALUES ($1, $2, $3, $4)",
//           [fileId, storage_key, size_bytes, version_number],
//         );
//       }

//       // 4. UPLOAD NEW FILE TO SUPABASE
//       const { error } = await supabase.storage
//         .from(process.env.SUPABASE_BUCKET)
//         .upload(storage_key, req.file.buffer, {
//           contentType: req.file.mimetype,
//           upsert: true, // Overwrites the physical file at that key
//         });

//       if (error) throw error;

//       // 5. UPDATE MAIN FILE RECORD
//       // Increment the version number and update the size
//       await db.query(
//         "UPDATE files SET status = 'available', size_bytes = $1, version_number = version_number + 1, updated_at = NOW() WHERE id = $2",
//         [req.file.size, fileId],
//       );

//       // 6. LOG ACTIVITY
//       await db.query(
//         "INSERT INTO activities (user_id, file_id, action) VALUES ($1, $2, $3)",
//         [userId, fileId, "updated_version"],
//       );

//       res.status(200).json({
//         message: "File updated successfully",
//         newVersion: version_number + 1,
//       });
//     } catch (error) {
//       console.error("Upload Error:", error);
//       res.status(500).json({ error: error.message });
//     }
//   });
// };

// exports.uploadFile = async (req, res) => {
//   upload(req, res, async (err) => {
//     if (err) return res.status(400).json({ message: err.message });
//     if (!req.file) return res.status(400).json({ message: "No file provided" });

//     const { fileId } = req.params;
//     const userId = req.user.id;

//     try {
//       // 1. Get current file details
//       const fileCheck = await db.query(
//         "SELECT name, storage_key, folder_id, size_bytes, version_id FROM files WHERE id = $1 AND owner_id = $2",
//         [fileId, userId],
//       );

//       if (fileCheck.rows.length === 0)
//         return res.status(404).json({ message: "File not found" });
//       const oldFile = fileCheck.rows[0];

//       // 2. VERSIONING LOGIC: If file was already 'available', move old data to file_versions
//       // This happens if the user is re-uploading to the same record
//       if (oldFile.size_bytes > 0) {
//         await db.query(
//           `INSERT INTO file_versions (file_id, storage_key, size_bytes, version_number)
//            VALUES ($1, $2, $3, (SELECT COALESCE(MAX(version_number), 0) + 1 FROM file_versions WHERE file_id = $1))`,
//           [fileId, oldFile.storage_key, oldFile.size_bytes],
//         );
//       }

//       // 3. Upload NEW buffer to Supabase
//       const { data, error: storageError } = await supabase.storage
//         .from(process.env.SUPABASE_BUCKET)
//         .upload(oldFile.storage_key, req.file.buffer, {
//           contentType: req.file.mimetype,
//           upsert: true, // Overwrite the physical file in storage
//         });

//       if (storageError) throw storageError;

//       // 4. Update Main File Record & Activity Log
//       await db.query(
//         "UPDATE files SET status = 'available', size_bytes = $1, updated_at = now() WHERE id = $2",
//         [req.file.size, fileId],
//       );

//       await db.query(
//         "INSERT INTO activities (user_id, file_id, action, details) VALUES ($1, $2, $3, $4)",
//         [userId, fileId, "uploaded", `Uploaded new version of ${oldFile.name}`],
//       );

//       res.status(200).json({ message: "File uploaded successfully" });
//     } catch (error) {
//       console.error("Upload Error:", error);
//       await db.query("UPDATE files SET status = 'failed' WHERE id = $1", [
//         fileId,
//       ]);
//       res.status(500).json({ message: "Upload failed" });
//     }
//   });
// };

// exports.uploadFile = async (req, res) => {
//   upload(req, res, async (err) => {
//     // Handle Multer errors (Size/Type)
//     if (err) return res.status(400).json({ message: err.message });
//     if (!req.file) return res.status(400).json({ message: "No file provided" });

//     const { fileId } = req.params;
//     const userId = req.user.id;

//     try {
//       // Step A: Fetch record and Verify Ownership
//       const result = await db.query(
//         "SELECT storage_key, owner_id FROM files WHERE id = $1",
//         [fileId],
//       );

//       if (result.rows.length === 0) {
//         return res.status(404).json({ message: "File record not found" });
//       }

//       const fileRecord = result.rows[0];

//       // Security Check: Does the user own this record?
//       if (fileRecord.owner_id !== userId) {
//         return res
//           .status(403)
//           .json({ message: "Unauthorized: Ownership mismatch" });
//       }

//       // Step B: Upload Buffer to Supabase
//       const { data, error: storageError } = await supabase.storage
//         .from(process.env.SUPABASE_BUCKET)
//         .upload(fileRecord.storage_key, req.file.buffer, {
//           contentType: req.file.mimetype,
//           upsert: true,
//         });

//       if (storageError) throw storageError;

//       // Step C: Update Status to Available
//       await db.query(
//         "UPDATE files SET status = 'available', size_bytes = $1 WHERE id = $2",
//         [req.file.size, fileId],
//       );

//       res.status(200).json({
//         message: "File uploaded and verified successfully",
//         storagePath: data.path,
//       });
//     } catch (error) {
//       console.error("Upload Error:", error);
//       // Mark as failed in DB so user knows it didn't work
//       await db.query("UPDATE files SET status = 'failed' WHERE id = $1", [
//         fileId,
//       ]);
//       res.status(500).json({ message: "Upload to cloud failed" });
//     }
//   });
// };

// --- 3. CREATE FOLDER ---
exports.createFolder = async (req, res) => {
  try {
    const { name, parentId = null } = req.body;
    const userId = req.user.id;

    const query = `
      INSERT INTO folders (name, parent_id, owner_id)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const result = await db.query(query, [name, parentId, userId]);

    // LOG ACTIVITY
    await db.query(
      "INSERT INTO activities (user_id, folder_id, action, details) VALUES ($1, $2, $3, $4)",
      [userId, result.rows[0].id, "created", `Folder '${name}' created`],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create Folder Error:", error);
    res.status(500).json({ message: "Error creating folder" });
  }
};

// --- 4. GET FOLDER CONTENTS & BREADCRUMBS ---

exports.getFolderContents = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const folderId = id === "root" ? null : id;

    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // 1. Breadcrumbs (Keep this exactly as it was)
    let breadcrumbs = [];
    if (folderId) {
      const bcResult = await db.query(
        `WITH RECURSIVE folder_path AS (
          SELECT id, name, parent_id FROM folders WHERE id = $1 AND owner_id = $2
          UNION ALL
          SELECT f.id, f.name, f.parent_id FROM folders f
          JOIN folder_path fp ON f.id = fp.parent_id
        ) SELECT * FROM folder_path;`,
        [folderId, userId],
      );
      breadcrumbs = bcResult.rows.reverse();
    }

    // 2. Paginated Folders (REPLACED WITH NEW VERSION)
    const folders = await db.query(
      `
      SELECT f.id, f.name, f.updated_at, 
             (CASE WHEN s.id IS NOT NULL THEN true ELSE false END) as is_starred
      FROM folders f
      LEFT JOIN stars s ON f.id = s.folder_id AND s.user_id = $1
      WHERE f.owner_id = $1 AND f.parent_id IS NOT DISTINCT FROM $2 AND f.is_deleted = false
      ORDER BY f.name ASC LIMIT $3 OFFSET $4
    `,
      [userId, folderId, limit, offset],
    );

    // 3. Paginated Files (REPLACED WITH NEW VERSION)
    const files = await db.query(
      `
      SELECT f.id, f.name, f.size_bytes, f.mime_type, f.status, f.updated_at,
             (CASE WHEN s.id IS NOT NULL THEN true ELSE false END) as is_starred
      FROM files f
      LEFT JOIN stars s ON f.id = s.file_id AND s.user_id = $1
      WHERE f.owner_id = $1 AND f.folder_id IS NOT DISTINCT FROM $2 AND f.is_deleted = false
      ORDER BY f.name ASC LIMIT $3 OFFSET $4
    `,
      [userId, folderId, limit, offset],
    );

    res.status(200).json({
      folderId,
      breadcrumbs,
      folders: folders.rows,
      files: files.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        folderCount: folders.rowCount,
        fileCount: files.rowCount,
      },
    });
  } catch (error) {
    console.error("Folder Contents Error:", error);
    res.status(500).json({ message: "Error fetching folder contents" });
  }
};

// exports.getFolderContents = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const userId = req.user.id;

//     // Support for 'root' keyword
//     const folderId = id === "root" ? null : id;

//     // Pagination parameters
//     const { page = 1, limit = 50 } = req.query;
//     const offset = (page - 1) * limit;

//     // 1. Breadcrumbs (Recursive CTE)
//     let breadcrumbs = [];
//     if (folderId) {
//       const bcResult = await db.query(
//         `
//         WITH RECURSIVE folder_path AS (
//           SELECT id, name, parent_id FROM folders WHERE id = $1 AND owner_id = $2
//           UNION ALL
//           SELECT f.id, f.name, f.parent_id FROM folders f
//           JOIN folder_path fp ON f.id = fp.parent_id
//         )
//         SELECT * FROM folder_path;
//       `,
//         [folderId, userId],
//       );
//       breadcrumbs = bcResult.rows.reverse();
//     }

//     // 2. Paginated Folders
//     const folders = await db.query(
//       `
//       SELECT id, name, updated_at FROM folders
//       WHERE owner_id = $1 AND parent_id IS NOT DISTINCT FROM $2 AND is_deleted = false
//       ORDER BY name ASC LIMIT $3 OFFSET $4
//     `,
//       [userId, folderId, limit, offset],
//     );

//     // 3. Paginated Files
//     const files = await db.query(
//       `
//       SELECT id, name, size_bytes, mime_type, status, updated_at FROM files
//       WHERE owner_id = $1 AND folder_id IS NOT DISTINCT FROM $2 AND is_deleted = false
//       ORDER BY name ASC LIMIT $3 OFFSET $4
//     `,
//       [userId, folderId, limit, offset],
//     );

//     res.status(200).json({
//       folderId,
//       breadcrumbs,
//       folders: folders.rows,
//       files: files.rows,
//       pagination: {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         folderCount: folders.rowCount,
//         fileCount: files.rowCount,
//       },
//     });
//   } catch (error) {
//     console.error("Folder Contents Error:", error);
//     res.status(500).json({ message: "Error fetching folder contents" });
//   }
// };

// exports.getFolderContents = async (req, res) => {
//   try {
//     const { id } = req.params; // Folder ID
//     const userId = req.user.id;
//     const { page = 1, limit = 50 } = req.query; // Larger limit for folder browsing
//     const offset = (page - 1) * limit;

//     // 1. Get Folder Hierarchy (Breadcrumbs) - Keep your existing CTE logic here
//     const breadcrumbQuery = `
//       WITH RECURSIVE parents AS (
//         SELECT id, name, parent_id FROM folders WHERE id = $1 AND owner_id = $2
//         UNION ALL
//         SELECT f.id, f.name, f.parent_id FROM folders f
//         JOIN parents p ON f.id = p.parent_id
//       )
//       SELECT * FROM parents;
//     `;
//     const breadcrumbs = await db.query(breadcrumbQuery, [id, userId]);

//     // 2. Fetch Sub-folders (Paginated)
//     const folderQuery = `
//       SELECT id, name, updated_at FROM folders
//       WHERE parent_id = $1 AND owner_id = $2 AND is_deleted = false
//       ORDER BY name ASC LIMIT $3 OFFSET $4;
//     `;
//     const folders = await db.query(folderQuery, [id, userId, limit, offset]);

//     // 3. Fetch Files (Paginated)
//     const fileQuery = `
//       SELECT id, name, size_bytes, mime_type, updated_at FROM files
//       WHERE folder_id = $1 AND owner_id = $2 AND is_deleted = false
//       ORDER BY name ASC LIMIT $3 OFFSET $4;
//     `;
//     const files = await db.query(fileQuery, [id, userId, limit, offset]);

//     res.status(200).json({
//       breadcrumbs: breadcrumbs.rows.reverse(),
//       folders: folders.rows,
//       files: files.rows,
//       pagination: {
//         page: parseInt(page),
//         limit: parseInt(limit),
//       },
//     });
//   } catch (error) {
//     console.error("Folder Contents Error:", error);
//     res.status(500).json({ message: "Error fetching folder contents" });
//   }
// };

// exports.getFolderContents = async (req, res) => {
//   try {
//     const { id } = req.params; // Folder ID (or 'root')
//     const userId = req.user.id;
//     const folderId = id === "root" ? null : id;

//     // A. Fetch Sub-folders
//     const foldersQuery = `SELECT id, name, created_at FROM folders WHERE owner_id = $1 AND parent_id IS NOT DISTINCT FROM $2 AND is_deleted = false`;
//     const foldersResult = await db.query(foldersQuery, [userId, folderId]);

//     // B. Fetch Files
//     const filesQuery = `SELECT id, name, mime_type, size_bytes, status, created_at FROM files WHERE owner_id = $1 AND folder_id IS NOT DISTINCT FROM $2 AND is_deleted = false`;
//     const filesResult = await db.query(filesQuery, [userId, folderId]);

//     // C. Fetch Breadcrumbs (Recursive SQL)
//     let breadcrumbs = [];
//     if (folderId) {
//       const breadcrumbQuery = `
//         WITH RECURSIVE folder_path AS (
//           SELECT id, name, parent_id FROM folders WHERE id = $1
//           UNION ALL
//           SELECT f.id, f.name, f.parent_id FROM folders f
//           JOIN folder_path fp ON f.id = fp.parent_id
//         )
//         SELECT * FROM folder_path;
//       `;
//       const bcResult = await db.query(breadcrumbQuery, [folderId]);
//       breadcrumbs = bcResult.rows.reverse(); // Reverse to get Root -> Current order
//     }

//     res.status(200).json({
//       folderId,
//       breadcrumbs,
//       folders: foldersResult.rows,
//       files: filesResult.rows,
//     });
//   } catch (error) {
//     console.error("Get Folder Error:", error);
//     res.status(500).json({ message: "Error fetching contents" });
//   }
// };

// --- 5. RENAME FOLDER (The "Update" in CRUD) ---
exports.renameFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const { newName } = req.body;
    const userId = req.user.id;

    const query = `
      UPDATE folders 
      SET name = $1, updated_at = now() 
      WHERE id = $2 AND owner_id = $3 
      RETURNING *;
    `;
    const result = await db.query(query, [newName, id, userId]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Folder not found or unauthorized" });
    }

    // LOG ACTIVITY
    await db.query(
      "INSERT INTO activities (user_id, folder_id, action, details) VALUES ($1, $2, $3, $4)",
      [userId, id, "renamed", `Folder renamed to '${newName}'`],
    );

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Rename Folder Error:", error);
    res.status(500).json({ message: "Error renaming folder" });
  }
};

// --- 6. SOFT DELETE FOLDER (The "Delete" in CRUD) ---
exports.deleteFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Soft delete: set is_deleted to true
    const query = `
      UPDATE folders 
      SET is_deleted = true, updated_at = now() 
      WHERE id = $1 AND owner_id = $2 
      RETURNING *;
    `;
    const result = await db.query(query, [id, userId]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Folder not found or unauthorized" });
    }

    // LOG ACTIVITY
    await db.query(
      "INSERT INTO activities (user_id, folder_id, action, details) VALUES ($1, $2, $3, $4)",
      [userId, id, "deleted", `Folder '${result.rows[0].name}' moved to trash`],
    );

    res.status(200).json({ message: "Folder moved to trash" });
  } catch (error) {
    console.error("Delete Folder Error:", error);
    res.status(500).json({ message: "Error deleting folder" });
  }
};

exports.permanentDeleteFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await db.query(
      "DELETE FROM folders WHERE id = $1 AND owner_id = $2 RETURNING name",
      [id, userId],
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Folder not found or unauthorized" });
    }

    res.status(200).json({ message: "Folder permanently deleted" });
  } catch (error) {
    console.error("Permanent Delete Folder Error:", error);
    res.status(500).json({ message: "Failed to permanently delete folder" });
  }
};

// --- 7. RENAME FILE ---
exports.renameFile = async (req, res) => {
  try {
    const { id } = req.params;
    const { newName } = req.body;
    const userId = req.user.id;

    const result = await db.query(
      "UPDATE files SET name = $1, updated_at = now() WHERE id = $2 AND owner_id = $3 RETURNING *",
      [newName, id, userId],
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "File not found" });

    // LOG ACTIVITY
    await db.query(
      "INSERT INTO activities (user_id, file_id, action, details) VALUES ($1, $2, $3, $4)",
      [userId, id, "renamed", `Renamed file to '${newName}'`],
    );

    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Error renaming file" });
  }
};

// --- 8. SOFT DELETE FILE (Move to Trash) ---
exports.deleteFile = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await db.query(
      "UPDATE files SET is_deleted = true, updated_at = now() WHERE id = $1 AND owner_id = $2 RETURNING name",
      [id, userId],
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "File not found" });

    // LOG ACTIVITY
    await db.query(
      "INSERT INTO activities (user_id, file_id, action, details) VALUES ($1, $2, $3, $4)",
      [userId, id, "deleted", `Moved '${result.rows[0].name}' to trash`],
    );

    res.status(200).json({ message: "File moved to trash" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting file" });
  }
};

// --- 9. LIST & SEARCH FILES (The "My Drive" Dashboard) ---

exports.searchFiles = async (req, res) => {
  try {
    const userId = req.user.id;
    // q is the search text, page/limit handle the chunks of data
    const { query, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    // Your logic for partial word matching
    const formattedQuery = query.trim().split(/\s+/).join(" & ") + ":*";

    const sqlQuery = `
      SELECT id, name, mime_type, size_bytes, folder_id, updated_at,
             ts_rank(search_vector, to_tsquery('english', $2)) as rank
      FROM files
      WHERE owner_id = $1 
      AND is_deleted = false
      AND search_vector @@ to_tsquery('english', $2)
      ORDER BY rank DESC
      LIMIT $3 OFFSET $4;
    `;

    const result = await db.query(sqlQuery, [
      userId,
      formattedQuery,
      limit,
      offset,
    ]);

    res.status(200).json({
      files: result.rows,
      pagination: {
        currentPage: parseInt(page),
        pageSize: result.rows.length,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Search Error:", error);
    res.status(500).json({ message: "Error searching files" });
  }
};

// exports.searchFiles = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const { q, page = 1, limit = 20 } = req.query; // Default to page 1, 20 items
//     const offset = (page - 1) * limit;

//     const query = `
//       SELECT id, name, size_bytes, updated_at,
//              ts_rank(search_vector, to_tsquery('english', $2)) as rank
//       FROM files
//       WHERE owner_id = $1
//       AND search_vector @@ to_tsquery('english', $2)
//       AND is_deleted = false
//       ORDER BY rank DESC
//       LIMIT $3 OFFSET $4;
//     `;

//     const result = await db.query(query, [userId, q, limit, offset]);

//     // To be truly senior level, we also return the pagination metadata
//     res.status(200).json({
//       results: result.rows,
//       pagination: {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         count: result.rows.length,
//       },
//     });
//   } catch (error) {
//     console.error("Search Error:", error);
//     res.status(500).json({ message: "Search failed" });
//   }
// };

// exports.searchFiles = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const { folderId, query } = req.query;

//     let sqlQuery;
//     let params = [userId];

//     if (query) {
//       // FULL-TEXT SEARCH LOGIC
//       // to_tsquery('phrase:*') allows for partial word matching (e.g., 'res' finds 'resume')
//       sqlQuery = `
//         SELECT id, name, mime_type, size_bytes, folder_id, created_at
//         FROM files
//         WHERE owner_id = $1
//         AND is_deleted = false
//         AND search_vector @@ to_tsquery('english', $2)
//         ORDER BY ts_rank(search_vector, to_tsquery('english', $2)) DESC;
//       `;
//       // We format the query for partial matching: "word" becomes "word:*"
//       const formattedQuery = query.trim().split(/\s+/).join(" & ") + ":*";
//       params.push(formattedQuery);
//     } else {
//       // STANDARD FOLDER LISTING
//       sqlQuery = `
//         SELECT id, name, mime_type, size_bytes, folder_id, created_at
//         FROM files
//         WHERE owner_id = $1
//         AND is_deleted = false
//         AND folder_id IS NOT DISTINCT FROM $2
//         ORDER BY created_at DESC;
//       `;
//       params.push(folderId || null);
//     }

//     const result = await db.query(sqlQuery, params);

//     res.status(200).json({
//       count: result.rowCount,
//       files: result.rows,
//     });
//   } catch (error) {
//     console.error("Search Error:", error);
//     res.status(500).json({ message: "Error searching files" });
//   }
// };

exports.getDownloadUrl = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Fetch the storage_key from the database
    const fileResult = await db.query(
      "SELECT storage_key, name FROM files WHERE id = $1",
      [id],
    );

    if (fileResult.rows.length === 0) {
      return res.status(404).json({ message: "File not found" });
    }

    const { storage_key, name } = fileResult.rows[0];

    // 2. Generate the Signed URL from Supabase
    // expires_in is in seconds (15 minutes = 900 seconds)
    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .createSignedUrl(storage_key, 900);

    if (error) throw error;

    // 3. Log the download activity
    await db.query(
      "INSERT INTO activities (user_id, action, details) VALUES ($1, $2, $3)",
      [req.user.id, "download", `Generated download link for ${name}`],
    );

    res.status(200).json({
      message: "Secure URL generated",
      downloadUrl: data.signedUrl,
      expiresIn: "15 minutes",
    });
  } catch (error) {
    console.error("Signed URL Error:", error);
    res.status(500).json({ message: "Error generating download link" });
  }
};

exports.permanentDelete = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const fileCheck = await db.query(
      "SELECT storage_key, name FROM files WHERE id = $1 AND owner_id = $2",
      [id, userId],
    );

    if (fileCheck.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "File not found or unauthorized" });
    }

    const { storage_key, name } = fileCheck.rows[0];

    // Get all version storage keys too
    const versions = await db.query(
      "SELECT storage_key FROM file_versions WHERE file_id = $1",
      [id],
    );

    // Delete ALL storage keys (current + all versions)
    const allKeys = [storage_key, ...versions.rows.map((v) => v.storage_key)];

    const { error: storageError } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .remove(allKeys);

    if (storageError) throw storageError;

    // Delete from DB (cascade handles versions)
    await db.query("DELETE FROM files WHERE id = $1", [id]);

    await db.query(
      "INSERT INTO activities (user_id, action, details) VALUES ($1, $2, $3)",
      [userId, "permanent_delete", `Permanently deleted ${name}`],
    );

    res
      .status(200)
      .json({ message: "File permanently deleted and storage freed" });
  } catch (error) {
    console.error("Hard Delete Error:", error);
    res.status(500).json({ message: "Failed to permanently delete file" });
  }
};

// exports.permanentDelete = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const userId = req.user.id;

//     // 1. Verify ownership and get the storage_key
//     const fileCheck = await db.query(
//       "SELECT storage_key, name FROM files WHERE id = $1 AND owner_id = $2",
//       [id, userId],
//     );

//     if (fileCheck.rows.length === 0) {
//       return res
//         .status(404)
//         .json({ message: "File not found or unauthorized" });
//     }

//     const { storage_key, name } = fileCheck.rows[0];

//     // 2. Delete from Supabase Storage
//     const { error: storageError } = await supabase.storage
//       .from(process.env.SUPABASE_BUCKET)
//       .remove([storage_key]);

//     if (storageError) throw storageError;

//     // 3. Delete from Database (Cascading will handle versions and shares)
//     await db.query("DELETE FROM files WHERE id = $1", [id]);

//     // 4. Log the permanent deletion
//     await db.query(
//       "INSERT INTO activities (user_id, action, details) VALUES ($1, $2, $3)",
//       [userId, "permanent_delete", `Permanently deleted ${name}`],
//     );

//     res
//       .status(200)
//       .json({ message: "File permanently deleted and storage freed" });
//   } catch (error) {
//     console.error("Hard Delete Error:", error);
//     res.status(500).json({ message: "Failed to permanently delete file" });
//   }
// };

// 1. Get all soft-deleted items
exports.getTrash = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch files and folders where is_deleted is true
    const query = `
      SELECT id, name, 'file' as type, size_bytes, updated_at FROM files 
      WHERE owner_id = $1 AND is_deleted = true
      UNION ALL
      SELECT id, name, 'folder' as type, 0 as size_bytes, updated_at FROM folders 
      WHERE owner_id = $1 AND is_deleted = true
      ORDER BY updated_at DESC;
    `;

    const result = await db.query(query, [userId]);
    res.status(200).json({ trash: result.rows });
  } catch (error) {
    res.status(500).json({ message: "Error fetching trash" });
  }
};

// 2. Restore an item from trash
exports.restoreItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body; // 'file' or 'folder'
    const userId = req.user.id;

    const table = type === "folder" ? "folders" : "files";

    const result = await db.query(
      `UPDATE ${table} SET is_deleted = false WHERE id = $1 AND owner_id = $2 RETURNING *`,
      [id, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Item not found in trash" });
    }

    res
      .status(200)
      .json({ message: "Item restored successfully", item: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: "Restore failed" });
  }
};

// --- 1. Real Storage Stats ---
exports.getStorageStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const totalLimit = 100 * 1024 * 1024; // 5GB in bytes

    // Sum all file sizes for this user
    const result = await db.query(
      "SELECT SUM(size_bytes) as used_bytes FROM files WHERE owner_id = $1 AND is_deleted = false",
      [userId],
    );

    const usedBytes = parseInt(result.rows[0].used_bytes) || 0;

    res.status(200).json({
      usedBytes,
      totalLimit,
      percentage: ((usedBytes / totalLimit) * 100).toFixed(2),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- 2. Recent Activity Feed ---

exports.getActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50 } = req.query; // default 50, frontend can pass more

    const query = `
      SELECT a.id, a.action, a.created_at, 
             COALESCE(f.name, 'Deleted File') as file_name, 
             COALESCE(fo.name, 'Deleted Folder') as folder_name,
             a.file_id, a.folder_id
      FROM activities a
      LEFT JOIN files f ON a.file_id = f.id
      LEFT JOIN folders fo ON a.folder_id = fo.id
      WHERE a.user_id = $1
      ORDER BY a.created_at DESC
      LIMIT $2
    `;
    const result = await db.query(query, [userId, parseInt(limit)]);
    res.status(200).json({ activities: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// exports.getActivity = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     // Get last 20 activities joined with file/folder names
//     const query = `
//       SELECT a.id, a.action, a.created_at,
//              f.name as file_name, fo.name as folder_name
//       FROM activities a
//       LEFT JOIN files f ON a.file_id = f.id
//       LEFT JOIN folders fo ON a.folder_id = fo.id
//       WHERE a.user_id = $1
//       ORDER BY a.created_at DESC
//       LIMIT 20
//     `;

//     const result = await db.query(query, [userId]);
//     res.status(200).json({ activities: result.rows });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// exports.getStorageStats = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     // Sum the size of all files belonging to the user that are NOT in trash
//     const query = `
//       SELECT
//         SUM(size_bytes) as total_size,
//         COUNT(id) as total_files
//       FROM files
//       WHERE owner_id = $1 AND is_deleted = false;
//     `;

//     const result = await db.query(query, [userId]);

//     // You can set a hard limit here, e.g., 5GB (5 * 1024 * 1024 * 1024 bytes)
//     const limitBytes = 5368709120;
//     const usedBytes = parseInt(result.rows[0].total_size) || 0;

//     res.status(200).json({
//       usedBytes,
//       limitBytes,
//       percentage: ((usedBytes / limitBytes) * 100).toFixed(2),
//       totalFiles: result.rows[0].total_files,
//     });
//   } catch (error) {
//     console.error("Storage Stats Error:", error);
//     res.status(500).json({ message: "Error calculating storage usage" });
//   }
// };

// --- STAR / FAVORITE LOGIC ---
// --- STAR / FAVORITE LOGIC ---
exports.toggleStar = async (req, res) => {
  try {
    const { fileId, folderId } = req.body;
    const userId = req.user.id;

    // 1. Check if star already exists
    const existingStar = await db.query(
      "SELECT id FROM stars WHERE user_id = $1 AND (file_id = $2 OR folder_id = $3)",
      [userId, fileId || null, folderId || null],
    );

    if (existingStar.rows.length > 0) {
      // 2. If exists, Unstar (Delete)
      await db.query("DELETE FROM stars WHERE id = $1", [
        existingStar.rows[0].id,
      ]);

      // Log activity
      await db.query(
        "INSERT INTO activities (user_id, file_id, folder_id, action) VALUES ($1, $2, $3, $4)",
        [userId, fileId || null, folderId || null, "unstarred"],
      );

      return res
        .status(200)
        .json({ isStarred: false, message: "Removed from Starred" });
    } else {
      // 3. If not exists, Star (Insert)
      await db.query(
        "INSERT INTO stars (user_id, file_id, folder_id) VALUES ($1, $2, $3)",
        [userId, fileId || null, folderId || null],
      );

      // Log activity
      await db.query(
        "INSERT INTO activities (user_id, file_id, folder_id, action) VALUES ($1, $2, $3, $4)",
        [userId, fileId || null, folderId || null, "starred"],
      );

      return res
        .status(201)
        .json({ isStarred: true, message: "Added to Starred" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getStarredItems = async (req, res) => {
  try {
    const userId = req.user.id;
    const query = `
      SELECT f.id, f.name, 'file' as type, f.size_bytes, f.mime_type, f.updated_at, true as is_starred 
      FROM files f JOIN stars s ON f.id = s.file_id WHERE s.user_id = $1 AND f.is_deleted = false
      UNION ALL
      SELECT fo.id, fo.name, 'folder' as type, 0 as size_bytes, 'folder' as mime_type, fo.updated_at, true as is_starred 
      FROM folders fo JOIN stars s ON fo.id = s.folder_id WHERE s.user_id = $1 AND fo.is_deleted = false
    `;
    const result = await db.query(query, [userId]);
    res.status(200).json({ starredItems: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSharedWithMe = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT 
        f.id, f.name, f.mime_type, f.size_bytes, f.updated_at,
        s.role,
        u.name as shared_by_name,
        u.email as shared_by_email,
        'file' as type
       FROM shares s
       JOIN files f ON s.file_id = f.id
       JOIN users u ON s.created_by = u.id
       WHERE s.grantee_id = $1
       AND f.is_deleted = false

       UNION ALL

       SELECT 
        fo.id, fo.name, 'folder' as mime_type, 0 as size_bytes, fo.updated_at,
        s.role,
        u.name as shared_by_name,
        u.email as shared_by_email,
        'folder' as type
       FROM shares s
       JOIN folders fo ON s.folder_id = fo.id
       JOIN users u ON s.created_by = u.id
       WHERE s.grantee_id = $1
       AND fo.is_deleted = false

       ORDER BY updated_at DESC`,
      [userId],
    );

    res.status(200).json({ sharedItems: result.rows });
  } catch (error) {
    console.error("Shared With Me Error:", error);
    res.status(500).json({ message: "Error fetching shared items" });
  }
};

exports.getVersions = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Security: verify ownership first
    const ownerCheck = await db.query(
      "SELECT id FROM files WHERE id = $1 AND owner_id = $2",
      [id, userId],
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const result = await db.query(
      `SELECT id, version_number, size_bytes, created_at
       FROM file_versions
       WHERE file_id = $1
       ORDER BY version_number DESC`,
      [id],
    );

    res.status(200).json({ versions: result.rows });
  } catch (error) {
    console.error("Get Versions Error:", error);
    res.status(500).json({ message: "Error fetching versions" });
  }
};

// const db = require("../db"); // Your high-performance PostgreSQL pool
// const { v4: uuidv4 } = require("uuid"); // Install this: npm install uuid
// const supabase = require("../config/supabaseClient");
// const multer = require("multer");

// // Configure Multer
// const storage = multer.memoryStorage();
// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
// }).single("file"); // The field name in Postman must be "file"

// exports.initializeUpload = async (req, res) => {
//   try {
//     const { fileName, mimeType, folderId = null } = req.body;
//     const ownerId = req.user.id; // From your 'protect' middleware

//     if (!fileName) {
//       return res.status(400).json({ message: "File name is required" });
//     }

//     // 1. Generate the Professional Storage Key
//     // Format: tenants/{owner_id}/files/{uuid}-{filename}
//     const fileUuid = uuidv4();
//     const storageKey = `tenants/${ownerId}/files/${fileUuid}-${fileName}`;

//     // 2. Insert record into PostgreSQL with status 'pending'
//     const query = `
//       INSERT INTO files (name, storage_key, mime_type, owner_id, folder_id, status)
//       VALUES ($1, $2, $3, $4, $5, 'pending')
//       RETURNING id, storage_key;
//     `;

//     const values = [fileName, storageKey, mimeType, ownerId, folderId];
//     const result = await db.query(query, values);

//     // 3. Return the info to the frontend
//     res.status(201).json({
//       message: "Upload initialized",
//       fileId: result.rows[0].id,
//       storageKey: result.rows[0].storage_key,
//     });
//   } catch (error) {
//     console.error("Init Upload Error:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

// exports.uploadFile = async (req, res) => {
//   upload(req, res, async (err) => {
//     if (err)
//       return res
//         .status(400)
//         .json({ message: "Multer error", error: err.message });
//     if (!req.file) return res.status(400).json({ message: "No file uploaded" });

//     const { fileId } = req.params;

//     try {
//       // 1. Get the storageKey from the DB (the one we made in the Init step)
//       const fileRecord = await db.query(
//         "SELECT storage_key FROM files WHERE id = $1",
//         [fileId],
//       );

//       if (fileRecord.rows.length === 0) {
//         return res
//           .status(404)
//           .json({ message: "File record not found. Did you run /init?" });
//       }

//       const storagePath = fileRecord.rows[0].storage_key;

//       // 2. Upload Buffer to Supabase Storage
//       const { data, error } = await supabase.storage
//         .from(process.env.SUPABASE_BUCKET)
//         .upload(storagePath, req.file.buffer, {
//           contentType: req.file.mimetype,
//           upsert: true,
//         });

//       if (error) throw error;

//       // 3. Update DB status to 'available' and save size
//       await db.query(
//         "UPDATE files SET status = 'available', size_bytes = $1 WHERE id = $2",
//         [req.file.size, fileId],
//       );

//       res.status(200).json({ message: "Upload successful", data });
//     } catch (error) {
//       console.error("Upload Error:", error);
//       // Optional: Set status to 'failed' in DB
//       await db.query("UPDATE files SET status = 'failed' WHERE id = $1", [
//         fileId,
//       ]);
//       res.status(500).json({ message: "Upload failed" });
//     }
//   });
// };
