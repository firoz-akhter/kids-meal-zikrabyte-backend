const express = require("express");
const router = express.Router();
// const { authController } = require("../controllers");
const authController = require("../controllers/authController");
const auth = require("../middleware/auth");
const {
  registerValidator,
  loginValidator,
  changePasswordValidator,
} = require("../middleware/validator");

// POST /api/auth/register
// @access  Public
router.post("/register", registerValidator, authController.register);

// @route   POST /api/auth/login
// @access  Public
router.post("/login", loginValidator, authController.login);

// @route   GET /api/auth/me
// Get current logged in user
// @access  Private
router.get("/me", auth, authController.getMe);

// @route   PUT /api/auth/profile
// @access  Private
router.put("/profile", auth, authController.updateProfile);

// @route   PUT /api/auth/change-password
// @access  Private
router.put(
  "/change-password",
  auth,
  changePasswordValidator,
  authController.changePassword
);

// @route   POST /api/auth/logout
// router.post("/logout", auth, authController.logout);

module.exports = router;
