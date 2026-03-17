const express = require("express");
const router = express.Router();
const shareController = require("../controllers/shareController");
const { protect } = require("../middleware/auth");
const { checkPermission } = require("../middleware/permission"); // Ensure this is imported

// Internal Sharing (Invite by Email)
router.post("/internal", protect, shareController.shareInternal);

// Step 5.3: Generate Public Link
// Requires login and 'editor' permissions on the resource
router.post(
  "/public",
  protect,
  checkPermission("editor"),
  shareController.generatePublicLink,
);

// Step 6.2: Public Access (No 'protect' middleware here!)
// Visitors use the token to view the resource
router.get("/public/:token", shareController.getPublicResource);
router.get("/public/download/:token", shareController.getPublicDownloadUrl);

module.exports = router;
