const express = require("express");
const router = express.Router();
const { deliveryController } = require("../controllers");
const auth = require("../middleware/auth");
const { isParent, isAdmin } = require("../middleware/roleCheck");
const {
  markDeliveredValidator,
  markMissedValidator,
  verifyAndDeliverValidator,
  mongoIdValidator,
  paginationValidator,
  dateRangeValidator,
} = require("../middleware/validator");

// Parent Routes

// @route   GET /api/deliveries/today
// Get today's meal status for parent
// @access  Private (Parent)
router.get("/today", auth, isParent, deliveryController.getTodaysMeals);

// @route   GET /api/deliveries/child/:childId
// Get delivery history for child
// @access  Private (Parent)
router.get(
  "/child/:childId",
  auth,
  isParent,
  mongoIdValidator("childId"),
  paginationValidator,
  deliveryController.getChildDeliveries
);

// @route   GET /api/deliveries/child/:childId/upcoming
// Get upcoming meals for child
// @access  Private (Parent)
router.get(
  "/child/:childId/upcoming",
  auth,
  isParent,
  mongoIdValidator("childId"),
  deliveryController.getUpcomingMeals
);

// Admin Routes

// @route   GET /api/deliveries/admin/today
// Get all deliveries for today (Admin)
// @access  Private (Admin)
router.get(
  "/admin/today",
  auth,
  isAdmin,
  deliveryController.getTodaysDeliveries
);

// @route   GET /api/deliveries/admin/stats
// Get delivery statistics (Admin Dashboard)
// @access  Private (Admin)
router.get("/admin/stats", auth, isAdmin, deliveryController.getDeliveryStats);

// @route   GET /api/deliveries/admin/history
// Get delivery history (Admin)
// @access  Private (Admin)
router.get(
  "/admin/history",
  auth,
  isAdmin,
  paginationValidator,
  dateRangeValidator,
  deliveryController.getDeliveryHistory
);

// @route   POST /api/deliveries/admin/create
// Create deliveries for a date (Manual trigger)
// @access  Private (Admin)
router.post(
  "/admin/create",
  auth,
  isAdmin,
  deliveryController.createDeliveries
);

// @route   PUT /api/deliveries/:id/delivered
// Mark delivery as delivered
// @access  Private (Admin)
router.put(
  "/:id/delivered",
  auth,
  isAdmin,
  mongoIdValidator("id"),
  markDeliveredValidator,
  deliveryController.markDelivered
);

// @route   PUT /api/deliveries/:id/missed
// Mark delivery as missed
// @access  Private (Admin)
router.put(
  "/:id/missed",
  auth,
  isAdmin,
  mongoIdValidator("id"),
  markMissedValidator,
  deliveryController.markMissed
);

// @route   POST /api/deliveries/verify-and-deliver
// Verify QR and mark delivered
// @access  Private (Admin)
router.post(
  "/verify-and-deliver",
  auth,
  isAdmin,
  verifyAndDeliverValidator,
  deliveryController.verifyAndDeliver
);

module.exports = router;
