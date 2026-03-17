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
const { protect } = require("../middleware/auth"); // We will update this in Step 5

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/logout", logout);

// New Routes
router.post("/refresh", refresh);
router.get("/me", protect, getMe);

module.exports = router;

// const express = require("express");
// const router = express.Router();
// const { protect } = require("../middleware/auth");
// const { register, login, logout } = require("../controllers/authController");
// const {
//   validate,
//   registerSchema,
//   loginSchema,
// } = require("../middleware/validate");

// router.get("/me", protect, getMe); // Only logged-in users can access this
// router.post("/register", validate(registerSchema), register);
// router.post("/login", validate(loginSchema), login);
// router.post("/logout", logout);

// module.exports = router;
