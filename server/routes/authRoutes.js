const express = require("express");
const router = express.Router();
const {
  register,
  login,
  logout,
  refresh,
  getMe,
} = require("../controllers/authController");
const {
  validate,
  registerSchema,
  loginSchema,
} = require("../middleware/validate");
const { protect } = require("../middleware/auth");

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/logout", logout);

router.post("/refresh", refresh);
router.get("/me", protect, getMe);

module.exports = router;
