const express = require("express");
const router = express.Router();
const shareController = require("../controllers/shareController");
const { protect } = require("../middleware/auth");
const { checkPermission } = require("../middleware/permission");

router.post("/internal", protect, shareController.shareInternal);

router.post(
  "/public",
  protect,
  checkPermission("editor"),
  shareController.generatePublicLink,
);

router.get("/public/:token", shareController.getPublicResource);
router.get("/public/download/:token", shareController.getPublicDownloadUrl);

router.get("/:resourceType/:resourceId", protect, shareController.getShares);

router.delete("/:id", protect, shareController.revokeShare);

module.exports = router;
