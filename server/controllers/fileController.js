const db = require("../db");
const supabase = require("../config/supabaseClient");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",

      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
      "text/csv",

      "video/mp4",
      "video/webm",
      "audio/mpeg",
      "audio/wav",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Allowed: JPG, PNG, GIF, WEBP, SVG, PDF, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV, MP4, WEBM, MP3, WAV",
        ),
        false,
      );
    }
  },
}).single("file");
exports.getFiles = async (req, res) => {
  try {
    const { folderId } = req.query;
    const userId = req.user.id;

    let queryText;
    let queryParams;

    if (folderId && folderId !== "null") {
      queryText = `
  SELECT f.*,
    CASE WHEN s.file_id IS NOT NULL THEN true ELSE false END as is_starred
  FROM files f
  LEFT JOIN stars s ON s.file_id = f.id AND s.user_id = $1
  WHERE f.owner_id = $1
  AND f.folder_id = $2
  AND f.is_deleted = false
  ORDER BY f.created_at DESC
`;
      queryParams = [userId, folderId];
    } else {
      queryText = `
  SELECT f.*,
    CASE WHEN s.file_id IS NOT NULL THEN true ELSE false END as is_starred
  FROM files f
  LEFT JOIN stars s ON s.file_id = f.id AND s.user_id = $1
  WHERE f.owner_id = $1
  AND f.folder_id IS NULL
  AND f.is_deleted = false
  ORDER BY f.created_at DESC
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

exports.getFolders = async (req, res) => {
  try {
    const { parentId } = req.query;
    const userId = req.user.id;

    let queryText;
    let queryParams;

    if (parentId && parentId !== "null") {
      queryText = `
  SELECT f.*,
    CASE WHEN s.folder_id IS NOT NULL THEN true ELSE false END as is_starred
  FROM folders f
  LEFT JOIN stars s ON s.folder_id = f.id AND s.user_id = $1
  WHERE f.owner_id = $1
  AND f.parent_id = $2
  AND f.is_deleted = false
  ORDER BY f.name ASC
`;

      queryParams = [userId, parentId]; // ← ADD THIS LINE
    } else {
      queryText = `
  SELECT f.*,
    CASE WHEN s.folder_id IS NOT NULL THEN true ELSE false END as is_starred
  FROM folders f
  LEFT JOIN stars s ON s.folder_id = f.id AND s.user_id = $1
  WHERE f.owner_id = $1
  AND f.parent_id IS NULL
  AND f.is_deleted = false
  ORDER BY f.name ASC
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

exports.initializeUpload = async (req, res) => {
  try {
    const { fileName, mimeType, folderId = null } = req.body;
    const ownerId = req.user.id;

    if (!fileName) {
      return res.status(400).json({ message: "File name is required" });
    }

    const duplicate = await db.query(
      `SELECT id FROM files 
       WHERE owner_id = $1 
       AND name = $2 
       AND is_deleted = false
       AND folder_id IS NOT DISTINCT FROM $3`,
      [ownerId, fileName.trim(), folderId],
    );

    if (duplicate.rows.length > 0) {
      return res.status(409).json({
        message: `A file named "${fileName}" already exists here.`,
      });
    }

    const totalLimit = 100 * 1024 * 1024;
    const usageResult = await db.query(
      "SELECT SUM(size_bytes) as used_bytes FROM files WHERE owner_id = $1 AND is_deleted = false",
      [ownerId],
    );
    const usedBytes = parseInt(usageResult.rows[0].used_bytes) || 0;

    if (usedBytes >= totalLimit) {
      return res.status(403).json({
        message:
          "Storage limit reached. You have used 100MB of your 100MB quota. Please delete files to free up space.",
        storageExceeded: true,
      });
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

      if (size_bytes > 0) {
        await db.query(
          "INSERT INTO file_versions (file_id, storage_key, size_bytes, version_number) VALUES ($1, $2, $3, $4)",
          [fileId, storage_key, size_bytes, version_number],
        );
      }

      const newStorageKey = `tenants/${userId}/files/${uuidv4()}-v${version_number + 1}-${req.file.originalname}`;

      const { error } = await supabase.storage
        .from(process.env.SUPABASE_BUCKET)
        .upload(newStorageKey, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false,
        });

      if (error) throw error;

      await db.query(
        "UPDATE files SET status = 'available', size_bytes = $1, version_number = version_number + 1, storage_key = $2, updated_at = NOW() WHERE id = $3",
        [req.file.size, newStorageKey, fileId],
      );

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

exports.createFolder = async (req, res) => {
  try {
    const { name, parentId = null } = req.body;
    const userId = req.user.id;

    const duplicate = await db.query(
      `SELECT id FROM folders 
       WHERE owner_id = $1 
       AND name = $2 
       AND is_deleted = false
       AND parent_id IS NOT DISTINCT FROM $3`,
      [userId, name.trim(), parentId],
    );

    if (duplicate.rows.length > 0) {
      return res.status(409).json({
        message: `A folder named "${name}" already exists here.`,
      });
    }

    const query = `
      INSERT INTO folders (name, parent_id, owner_id)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const result = await db.query(query, [name, parentId, userId]);

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

exports.getFolderContents = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const folderId = id === "root" ? null : id;

    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

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

exports.renameFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const { newName, parentId } = req.body;
    const userId = req.user.id;

    if (parentId === id) {
      return res
        .status(400)
        .json({ message: "Cannot move folder into itself" });
    }

    let query;
    let values;

    if (newName && parentId !== undefined) {
      const duplicate = await db.query(
        `SELECT id FROM folders 
         WHERE owner_id = $1 AND name = $2 AND is_deleted = false
         AND parent_id IS NOT DISTINCT FROM $3 AND id != $4`,
        [userId, newName.trim(), parentId, id],
      );
      if (duplicate.rows.length > 0) {
        return res.status(409).json({
          message: `"${newName}" already exists in this location.`,
        });
      }
      query = `
        UPDATE folders SET name = $1, parent_id = $2, updated_at = now()
        WHERE id = $3 AND owner_id = $4 RETURNING *
      `;
      values = [newName, parentId, id, userId];
    } else if (newName) {
      const currentFolder = await db.query(
        "SELECT parent_id FROM folders WHERE id = $1 AND owner_id = $2",
        [id, userId],
      );
      const currentParentId = currentFolder.rows[0]?.parent_id ?? null;

      const duplicate = await db.query(
        `SELECT id FROM folders 
         WHERE owner_id = $1 AND name = $2 AND is_deleted = false
         AND parent_id IS NOT DISTINCT FROM $3 AND id != $4`,
        [userId, newName.trim(), currentParentId, id],
      );
      if (duplicate.rows.length > 0) {
        return res.status(409).json({
          message: `"${newName}" already exists in this location.`,
        });
      }
      query = `
        UPDATE folders SET name = $1, updated_at = now()
        WHERE id = $2 AND owner_id = $3 RETURNING *
      `;
      values = [newName, id, userId];
    } else if (parentId !== undefined) {
      query = `
        UPDATE folders SET parent_id = $1, updated_at = now()
        WHERE id = $2 AND owner_id = $3 RETURNING *
      `;
      values = [parentId, id, userId];
    } else {
      return res.status(400).json({ message: "Nothing to update" });
    }

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Folder not found or unauthorized" });
    }

    if (newName) {
      await db.query(
        "INSERT INTO activities (user_id, folder_id, action, details) VALUES ($1, $2, $3, $4)",
        [userId, id, "renamed", `Folder renamed to '${newName}'`],
      );
    }
    if (parentId !== undefined) {
      await db.query(
        "INSERT INTO activities (user_id, folder_id, action, details) VALUES ($1, $2, $3, $4)",
        [userId, id, "move", `Moved folder to '${parentId ?? "root"}'`],
      );
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Update Folder Error:", error);
    res.status(500).json({ message: "Error updating folder" });
  }
};

exports.deleteFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

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

exports.renameFile = async (req, res) => {
  try {
    const { id } = req.params;
    const { newName, folderId } = req.body;
    const userId = req.user.id;

    let query;
    let values;

    if (newName && folderId !== undefined) {
      const duplicate = await db.query(
        `SELECT id FROM files 
         WHERE owner_id = $1 AND name = $2 AND is_deleted = false
         AND folder_id IS NOT DISTINCT FROM $3 AND id != $4`,
        [userId, newName.trim(), folderId, id],
      );
      if (duplicate.rows.length > 0) {
        return res.status(409).json({
          message: `"${newName}" already exists in this location.`,
        });
      }
      query = `
        UPDATE files SET name = $1, folder_id = $2, updated_at = now()
        WHERE id = $3 AND owner_id = $4 RETURNING *
      `;
      values = [newName, folderId, id, userId];
    } else if (newName) {
      const currentFile = await db.query(
        "SELECT folder_id FROM files WHERE id = $1 AND owner_id = $2",
        [id, userId],
      );
      const currentFolderId = currentFile.rows[0]?.folder_id ?? null;

      const duplicate = await db.query(
        `SELECT id FROM files 
         WHERE owner_id = $1 AND name = $2 AND is_deleted = false
         AND folder_id IS NOT DISTINCT FROM $3 AND id != $4`,
        [userId, newName.trim(), currentFolderId, id],
      );
      if (duplicate.rows.length > 0) {
        return res.status(409).json({
          message: `"${newName}" already exists in this location.`,
        });
      }
      query = `
        UPDATE files SET name = $1, updated_at = now()
        WHERE id = $2 AND owner_id = $3 RETURNING *
      `;
      values = [newName, id, userId];
    } else if (folderId !== undefined) {
      query = `
        UPDATE files SET folder_id = $1, updated_at = now()
        WHERE id = $2 AND owner_id = $3 RETURNING *
      `;
      values = [folderId, id, userId];
    } else {
      return res.status(400).json({ message: "Nothing to update" });
    }

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "File not found" });
    }

    if (newName) {
      await db.query(
        "INSERT INTO activities (user_id, file_id, action, details) VALUES ($1, $2, $3, $4)",
        [userId, id, "renamed", `Renamed file to '${newName}'`],
      );
    }
    if (folderId !== undefined) {
      await db.query(
        "INSERT INTO activities (user_id, file_id, action, details) VALUES ($1, $2, $3, $4)",
        [userId, id, "move", `Moved file to folder '${folderId ?? "root"}'`],
      );
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Update File Error:", error);
    res.status(500).json({ message: "Error updating file" });
  }
};

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

    await db.query(
      "INSERT INTO activities (user_id, file_id, action, details) VALUES ($1, $2, $3, $4)",
      [userId, id, "deleted", `Moved '${result.rows[0].name}' to trash`],
    );

    res.status(200).json({ message: "File moved to trash" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting file" });
  }
};

exports.searchFiles = async (req, res) => {
  try {
    const userId = req.user.id;

    const { query, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const formattedQuery = query.trim().split(/\s+/).join(" & ") + ":*";

    const sqlQuery = `
  SELECT f.id, f.name, f.mime_type, f.size_bytes, f.folder_id, f.updated_at,
         ts_rank(f.search_vector, to_tsquery('english', $2)) as rank,
         CASE WHEN s.file_id IS NOT NULL THEN true ELSE false END as is_starred
  FROM files f
  LEFT JOIN stars s ON s.file_id = f.id AND s.user_id = $1
  WHERE f.owner_id = $1 
  AND f.is_deleted = false
  AND f.search_vector @@ to_tsquery('english', $2)
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

exports.getDownloadUrl = async (req, res) => {
  try {
    const { id } = req.params;
    const isActualDownload = req.query.download === "true"; // ← check param

    const fileResult = await db.query(
      "SELECT storage_key, name FROM files WHERE id = $1",
      [id],
    );

    if (fileResult.rows.length === 0) {
      return res.status(404).json({ message: "File not found" });
    }

    const { storage_key, name } = fileResult.rows[0];

    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .createSignedUrl(storage_key, 900);

    if (error) throw error;

    if (isActualDownload) {
      await db.query(
        "INSERT INTO activities (user_id, action, details) VALUES ($1, $2, $3)",
        [req.user.id, "download", `Downloaded ${name}`],
      );
    }

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

    const versions = await db.query(
      "SELECT storage_key FROM file_versions WHERE file_id = $1",
      [id],
    );

    const allKeys = [storage_key, ...versions.rows.map((v) => v.storage_key)];

    const { error: storageError } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .remove(allKeys);

    if (storageError) throw storageError;

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

exports.getTrash = async (req, res) => {
  try {
    const userId = req.user.id;

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

exports.restoreItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body;
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

exports.getStorageStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const totalLimit = 100 * 1024 * 1024;

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

exports.getActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50 } = req.query;

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

exports.toggleStar = async (req, res) => {
  try {
    const { fileId, folderId } = req.body;
    const userId = req.user.id;

    const existingStar = await db.query(
      "SELECT id FROM stars WHERE user_id = $1 AND (file_id = $2 OR folder_id = $3)",
      [userId, fileId || null, folderId || null],
    );

    if (existingStar.rows.length > 0) {
      await db.query("DELETE FROM stars WHERE id = $1", [
        existingStar.rows[0].id,
      ]);

      await db.query(
        "INSERT INTO activities (user_id, file_id, folder_id, action) VALUES ($1, $2, $3, $4)",
        [userId, fileId || null, folderId || null, "unstarred"],
      );

      return res
        .status(200)
        .json({ isStarred: false, message: "Removed from Starred" });
    } else {
      await db.query(
        "INSERT INTO stars (user_id, file_id, folder_id) VALUES ($1, $2, $3)",
        [userId, fileId || null, folderId || null],
      );

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
      SELECT f.id, f.name, 'file' as type, f.size_bytes, f.mime_type, 
             f.updated_at, f.folder_id, true as is_starred,
             sh.role
      FROM files f 
      JOIN stars s ON f.id = s.file_id 
      LEFT JOIN shares sh ON sh.file_id = f.id AND sh.grantee_id = $1
      WHERE s.user_id = $1 AND f.is_deleted = false
      UNION ALL
      SELECT fo.id, fo.name, 'folder' as type, 0 as size_bytes, 
             'folder' as mime_type, fo.updated_at, fo.parent_id as folder_id,
             true as is_starred, sh.role
      FROM folders fo 
      JOIN stars s ON fo.id = s.folder_id 
      LEFT JOIN shares sh ON sh.folder_id = fo.id AND sh.grantee_id = $1
      WHERE s.user_id = $1 AND fo.is_deleted = false
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
        'file' as type,
        CASE WHEN st.file_id IS NOT NULL THEN true ELSE false END as is_starred
       FROM shares s
       JOIN files f ON s.file_id = f.id
       JOIN users u ON s.created_by = u.id
       LEFT JOIN stars st ON st.file_id = f.id AND st.user_id = $1
       WHERE s.grantee_id = $1
       AND f.is_deleted = false

       UNION ALL

       SELECT 
        fo.id, fo.name, 'folder' as mime_type, 0 as size_bytes, fo.updated_at,
        s.role,
        u.name as shared_by_name,
        u.email as shared_by_email,
        'folder' as type,
        CASE WHEN st.folder_id IS NOT NULL THEN true ELSE false END as is_starred
       FROM shares s
       JOIN folders fo ON s.folder_id = fo.id
       JOIN users u ON s.created_by = u.id
       LEFT JOIN stars st ON st.folder_id = fo.id AND st.user_id = $1
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

exports.renameSharedFile = async (req, res) => {
  try {
    const { id } = req.params;
    const { newName } = req.body;
    const userId = req.user.id;

    const permCheck = await db.query(
      `SELECT s.role FROM shares s 
       WHERE s.file_id = $1 AND s.grantee_id = $2 AND s.role = 'editor'`,
      [id, userId],
    );

    if (permCheck.rows.length === 0) {
      return res.status(403).json({ message: "No editor permission" });
    }

    const result = await db.query(
      "UPDATE files SET name = $1, updated_at = now() WHERE id = $2 RETURNING *",
      [newName.trim(), id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "File not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Rename Shared File Error:", error);
    res.status(500).json({ message: "Error renaming file" });
  }
};

exports.trackFileOpen = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await db.query(
      "INSERT INTO file_opens (user_id, file_id) VALUES ($1, $2)",
      [userId, id],
    );

    res.status(200).json({ message: "File open tracked" });
  } catch (error) {
    console.error("Track File Open Error:", error);
    res.status(500).json({ message: "Error tracking file open" });
  }
};

exports.getRecentFiles = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20 } = req.query;

    const result = await db.query(
      `SELECT DISTINCT ON (f.id)
        f.id, f.name, f.mime_type, f.size_bytes, f.folder_id,
        fo.opened_at as last_opened,
        CASE WHEN s.file_id IS NOT NULL THEN true ELSE false END as is_starred
       FROM file_opens fo
       JOIN files f ON fo.file_id = f.id
       LEFT JOIN stars s ON s.file_id = f.id AND s.user_id = $1
       WHERE fo.user_id = $1
       AND f.is_deleted = false
       ORDER BY f.id, fo.opened_at DESC
       LIMIT $2`,
      [userId, parseInt(limit)],
    );

    const sorted = result.rows.sort(
      (a, b) => new Date(b.last_opened) - new Date(a.last_opened),
    );

    res.status(200).json({ files: sorted });
  } catch (error) {
    console.error("Get Recent Files Error:", error);
    res.status(500).json({ message: "Error fetching recent files" });
  }
};

exports.getFolderPath = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await db.query(
      `WITH RECURSIVE folder_path AS (
        SELECT id, name, parent_id
        FROM folders
        WHERE id = $1 AND owner_id = $2 AND is_deleted = false
        UNION ALL
        SELECT f.id, f.name, f.parent_id
        FROM folders f
        JOIN folder_path fp ON f.id = fp.parent_id
        WHERE f.owner_id = $2 AND f.is_deleted = false
      )
      SELECT * FROM folder_path`,
      [id, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Folder not found" });
    }

    const path = result.rows.reverse().map((f) => ({
      id: f.id,
      name: f.name,
    }));

    const fullPath = [{ id: null, name: "My Drive" }, ...path];

    res.status(200).json({ path: fullPath });
  } catch (error) {
    console.error("Get Folder Path Error:", error);
    res.status(500).json({ message: "Error fetching folder path" });
  }
};
