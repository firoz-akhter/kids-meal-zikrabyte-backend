const express = require("express");
const router = express.Router();
const { paymentController } = require("../controllers");
const auth = require("../middleware/auth");
const { isParent, isAdmin } = require("../middleware/roleCheck");
const {
  processPaymentValidator,
  mongoIdValidator,
  paginationValidator,
  dateRangeValidator,
} = require("../middleware/validator");

// Parent Routes

// @route   GET /api/payments
// Get payment history for parent
// @access  Private (Parent)
router.get(
  "/",
  auth,
  isParent,
  paginationValidator,
  paymentController.getPayments
);

// @route   GET /api/payments/summary
// Get payment summary for parent
// @access  Private (Parent)
router.get("/summary", auth, isParent, paymentController.getPaymentSummary);

// @route   GET /api/payments/:id
// Get single payment
// @access  Private (Parent)
router.get(
  "/:id",
  auth,
  isParent,
  mongoIdValidator("id"),
  paymentController.getPayment
);

// @route   POST /api/payments/process
// Process payment
// @access  Private (Parent)
router.post(
  "/process",
  auth,
  isParent,
  processPaymentValidator,
  paymentController.processPayment
);

// @route   POST /api/payments/:id/refund-request
// Request refund (Note: No refund policy)
// @access  Private (Parent)
// router.post(
//   "/:id/refund-request",
//   auth,
//   isParent,
//   mongoIdValidator("id"),
//   paymentController.requestRefund
// );

// Admin Routes

// @route   GET /api/payments/admin/all
// Get all payments (Admin)
// @access  Private (Admin)
router.get(
  "/admin/all",
  auth,
  isAdmin,
  paginationValidator,
  dateRangeValidator,
  paymentController.getAllPayments
);

// @route   GET /api/payments/admin/stats
// Get payment statistics (Admin Dashboard)
// @access  Private (Admin)
router.get(
  "/admin/stats",
  auth,
  isAdmin,
  dateRangeValidator,
  paymentController.getPaymentStats
);

// @route   GET /api/payments/admin/revenue
// Get revenue report (Admin)
// @access  Private (Admin)
router.get("/admin/revenue", auth, isAdmin, paymentController.getRevenueReport);

module.exports = router;
