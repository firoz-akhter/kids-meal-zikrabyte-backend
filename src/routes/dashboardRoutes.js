const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const auth = require("../middleware/auth");
const { isParent, isAdmin } = require("../middleware/roleCheck");
const { dateRangeValidator } = require("../middleware/validator");

// @route   GET /api/dashboard/parent
// Get parent dashboard statistics
// @access  Private (Parent)
router.get("/parent", auth, isParent, dashboardController.getParentDashboard);

// @route   GET /api/dashboard/admin
// Get admin dashboard statistics
// @access  Private (Admin)
router.get("/admin", auth, isAdmin, dashboardController.getAdminDashboard);

// @route   GET /api/dashboard/admin/stats
// Get quick stats for any date range (Admin)
// @access  Private (Admin)
router.get(
  "/admin/stats",
  auth,
  isAdmin,
  dateRangeValidator,
  dashboardController.getDateRangeStats
);

module.exports = router;
