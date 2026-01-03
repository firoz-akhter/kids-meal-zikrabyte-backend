const express = require("express");
const router = express.Router();
const { subscriptionController } = require("../controllers");
const auth = require("../middleware/auth");
const { isParent, isAdmin } = require("../middleware/roleCheck");
const {
  createSubscriptionValidator,
  calculatePriceValidator,
  mongoIdValidator,
  paginationValidator,
} = require("../middleware/validator");

// Parent Routes

// @route   GET /api/subscriptions
// Get all subscriptions for logged in parent
// @access  Private (Parent)
router.get("/", auth, isParent, subscriptionController.getSubscriptions);

// @route   POST /api/subscriptions/calculate-price
// Calculate subscription price
// @access  Private (Parent)
router.post(
  "/calculate-price",
  auth,
  isParent,
  calculatePriceValidator,
  subscriptionController.calculatePrice
);

// @route   POST /api/subscriptions
// Create new subscription
// @access  Private (Parent)
router.post(
  "/",
  auth,
  isParent,
  createSubscriptionValidator,
  subscriptionController.createSubscription
);

// @route   GET /api/subscriptions/:id
// Get single subscription
// @access  Private (Parent)
router.get(
  "/:id",
  auth,
  isParent,
  mongoIdValidator("id"),
  subscriptionController.getSubscription
);

// @route   PUT /api/subscriptions/:id/pause
// Pause subscription
// @access  Private (Parent)
router.put(
  "/:id/pause",
  auth,
  isParent,
  mongoIdValidator("id"),
  subscriptionController.pauseSubscription
);

// @route   PUT /api/subscriptions/:id/resume
// Resume subscription
// @access  Private (Parent)
router.put(
  "/:id/resume",
  auth,
  isParent,
  mongoIdValidator("id"),
  subscriptionController.resumeSubscription
);

// @route   PUT /api/subscriptions/:id/cancel
// Cancel subscription
// @access  Private (Parent)
router.put(
  "/:id/cancel",
  auth,
  isParent,
  mongoIdValidator("id"),
  subscriptionController.cancelSubscription
);

// @route   GET /api/subscriptions/child/:childId/history
// Get subscription history for child
// @access  Private (Parent)
router.get(
  "/child/:childId/history",
  auth,
  isParent,
  mongoIdValidator("childId"),
  subscriptionController.getChildSubscriptionHistory
);

// Admin Routes

// @route   GET /api/subscriptions/admin/all
// Get all subscriptions (Admin)
// @access  Private (Admin)
router.get(
  "/admin/all",
  auth,
  isAdmin,
  paginationValidator,
  subscriptionController.getAllSubscriptions
);

// @route   PUT /api/subscriptions/admin/:id/status
// Admin pause/resume subscription
// @access  Private (Admin)
router.put(
  "/admin/:id/status",
  auth,
  isAdmin,
  mongoIdValidator("id"),
  subscriptionController.adminUpdateSubscriptionStatus
);

module.exports = router;
