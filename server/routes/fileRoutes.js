const express = require("express");
const router = express.Router();
const fileController = require("../controllers/fileController");
const { protect } = require("../middleware/auth");
// Import the new permission gatekeeper
const { checkPermission } = require("../middleware/permission");

// --- List Operations ---

// 1. Get all files (optionally filtered by folderId)
router.get("/", protect, fileController.getFiles);

// 2. Get all folders (optionally filtered by parentId)
router.get("/folders", protect, fileController.getFolders);

// Specific routes PEHLE
router.get("/trash", protect, fileController.getTrash);
router.get("/storage-stats", protect, fileController.getStorageStats);
router.get("/search", protect, fileController.searchFiles);
router.get("/activity", protect, fileController.getActivity);
router.get("/stars", protect, fileController.getStarredItems);
router.post("/stars/toggle", protect, fileController.toggleStar);
router.post("/init", protect, fileController.initializeUpload);
router.post("/upload/:fileId", protect, fileController.uploadFile);

// Folder routes
router.post("/folders", protect, fileController.createFolder);
router.get(
  "/folders/:id",
  protect,
  checkPermission("viewer"),
  fileController.getFolderContents,
);
router.patch(
  "/folders/:id",
  protect,
  checkPermission("editor"),
  fileController.renameFolder,
);
router.delete(
  "/folders/:id",
  protect,
  checkPermission("editor"),
  fileController.deleteFolder,
);

// Generic /:id routes BAAD MEIN
router.get(
  "/:id/download",
  protect,
  checkPermission("viewer"),
  fileController.getDownloadUrl,
);
router.patch(
  "/:id",
  protect,
  checkPermission("editor"),
  fileController.renameFile,
);
router.delete("/:id/permanent", protect, fileController.permanentDelete);
router.post("/:id/restore", protect, fileController.restoreItem);
router.delete(
  "/:id",
  protect,
  checkPermission("editor"),
  fileController.deleteFile,
);

module.exports = router;
// // --- File Operations ---
// // Initialization and Upload (Owner only logic is usually inside controller,
// // but for an existing file update, you'd use checkPermission('editor'))
// router.post("/init", protect, fileController.initializeUpload);
// router.post("/upload/:fileId", protect, fileController.uploadFile);

// // Rename and Delete (Requires 'editor' role)
// router.patch(
//   "/:id",
//   protect,
//   checkPermission("editor"),
//   fileController.renameFile,
// );
// router.delete(
//   "/:id",
//   protect,
//   checkPermission("editor"),
//   fileController.deleteFile,
// );

// // --- ADD THIS NEW ROUTE HERE ---

// // --- Trash Operations ---
// // View items in trash
// router.get("/trash", protect, fileController.getTrash);

// router.get("/storage-stats", protect, fileController.getStorageStats);

// // Restore item from trash
// router.post("/:id/restore", protect, fileController.restoreItem);

// // Permanent Delete (Hard Delete)
// // Note: We don't use checkPermission here because the controller
// // logic specifically checks for 'owner_id' for extra security.
// router.delete("/:id/permanent", protect, fileController.permanentDelete);

// // --- Folder Operations ---

// // Create folder (Usually happens inside another folder, you need 'editor' access to the parent)
// router.post("/folders", protect, fileController.createFolder);

// // Read Folder Contents (Requires at least 'viewer' role)
// router.get(
//   "/folders/:id",
//   protect,
//   checkPermission("viewer"),
//   fileController.getFolderContents,
// );

// // Rename and Delete Folder (Requires 'editor' role)
// router.patch(
//   "/folders/:id",
//   protect,
//   checkPermission("editor"),
//   fileController.renameFolder,
// );
// router.delete(
//   "/folders/:id",
//   protect,
//   checkPermission("editor"),
//   fileController.deleteFolder,
// );

// // Add this with your other file routes
// router.get(
//   "/:id/download",
//   protect,
//   checkPermission("viewer"),
//   fileController.getDownloadUrl,
// );

// // --- Star / Favorites Routes ---

// // Toggle star (Add/Remove)
// router.post("/stars/toggle", protect, fileController.toggleStar);

// // Get all starred items for the sidebar
// router.get("/stars", protect, fileController.getStarredItems);

// // --- Search and Discovery ---
// router.get("/search", protect, fileController.searchFiles);

// // Get activity feed
// router.get("/activity", protect, fileController.getActivity);

// const express = require("express");
// const router = express.Router();
// const fileController = require("../controllers/fileController");
// const { protect } = require("../middleware/auth"); // Your Auth guard

// // File CRUD Extensions
// router.post("/init", protect, fileController.initializeUpload);
// router.post("/upload/:fileId", protect, fileController.uploadFile);
// router.patch("/:id", protect, fileController.renameFile); // Rename file
// router.delete("/:id", protect, fileController.deleteFile); // Soft delete file

// // Folder Routes
// // Folder CRUD
// router.post("/folders", protect, fileController.createFolder); // Create
// router.get("/folders/:id", protect, fileController.getFolderContents); // Read (with Breadcrumbs)
// router.patch("/folders/:id", protect, fileController.renameFolder); // Update
// router.delete("/folders/:id", protect, fileController.deleteFolder); // Delete (Soft)

// // Search and List
// router.get("/search", protect, fileController.searchFiles);

// module.exports = router;
