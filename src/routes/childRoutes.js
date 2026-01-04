const express = require("express");
const router = express.Router();
const { childController } = require("../controllers");
const auth = require("../middleware/auth");
const { isParent, isAdmin } = require("../middleware/roleCheck");
const {
  addChildValidator,
  updateChildValidator,
  mongoIdValidator,
  paginationValidator,
} = require("../middleware/validator");

// Parent Routes

//  GET /api/children
// Get all children for logged in parent
// @access  Private (Parent)
router.get("/", auth, isParent, childController.getChildren);

// @route   POST /api/children/addChild
// Add a new child
// @access  Private (Parent)
router.post(
  "/addChild",
  auth,
  isParent,
  addChildValidator,
  childController.addChild
);

// @route   GET /api/children/:id
// Get single child by ID
// @access  Private (Parent)
router.get(
  "/:id",
  auth,
  isParent,
  mongoIdValidator("id"),
  childController.getChild
);

// @route   PUT /api/children/:id
// Update child details
// @access  Private (Parent)
router.put(
  "/:id",
  auth,
  isParent,
  mongoIdValidator("id"),
  updateChildValidator,
  childController.updateChild
);

// @route   DELETE /api/children/:id
// Delete child (soft delete)
// @access  Private (Parent)
router.delete(
  "/delete/:id",
  auth,
  isParent,
  mongoIdValidator("id"),
  childController.deleteChild
);

// @route   GET /api/children/:id/qr-code
// Get child's QR code
// @access  Private (Parent)
router.get(
  "/qrCode/:id",
  auth,
  isParent,
  mongoIdValidator("id"),
  childController.getQRCode
);

// Admin Routes

// @route   POST /api/children/verify-qr
// Verify QR code (for admin during delivery)
// @access  Private (Admin)
router.post("/verify-qr", auth, isAdmin, childController.verifyQRCode);

// @route   GET /api/children/admin/all
// Get all children (Admin only)
// @access  Private (Admin)
router.get(
  "/admin/all",
  auth,
  isAdmin,
  paginationValidator,
  childController.getAllChildren
);

module.exports = router;
