const express = require("express");
const router = express.Router();
const fileController = require("../controllers/fileController");
const { protect } = require("../middleware/auth");

const { checkPermission } = require("../middleware/permission");

router.get("/shared-with-me", protect, fileController.getSharedWithMe);
router.patch("/shared/:id/rename", protect, fileController.renameSharedFile);

router.get("/", protect, fileController.getFiles);

router.get("/folders", protect, fileController.getFolders);

router.get("/trash", protect, fileController.getTrash);
router.get("/storage-stats", protect, fileController.getStorageStats);
router.get("/search", protect, fileController.searchFiles);
router.get("/activity", protect, fileController.getActivity);
router.get("/recent-files", protect, fileController.getRecentFiles);
router.get("/folder-path/:id", protect, fileController.getFolderPath);
router.get("/stars", protect, fileController.getStarredItems);
router.post("/stars/toggle", protect, fileController.toggleStar);
router.post("/init", protect, fileController.initializeUpload);
router.post("/upload/:fileId", protect, fileController.uploadFile);

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

router.delete(
  "/folders/:id/permanent",
  protect,
  fileController.permanentDeleteFolder,
);

router.post("/:id/open", protect, fileController.trackFileOpen);

router.get(
  "/:id/versions",
  protect,
  checkPermission("viewer"),
  fileController.getVersions,
);

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
