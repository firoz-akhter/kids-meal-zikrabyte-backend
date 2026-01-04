const express = require("express");
const router = express.Router();
const { menuController } = require("../controllers");
const auth = require("../middleware/auth");
const {
  isParent,
  isAdmin,
  isParentOrAdmin,
} = require("../middleware/roleCheck");
const {
  createMenuValidator,
  mongoIdValidator,
  paginationValidator,
} = require("../middleware/validator");

// Parent Routes (Read Only)

// @route   GET /api/menus/current
// Get current week menu
// @access  Private (Parent)
router.get("/current", auth, isParent, menuController.getCurrentMenu);

// @route   GET /api/menus/date/:date
// Get menu for specific date
// @access  Private
router.get("/date/:date", auth, isParentOrAdmin, menuController.getMenuForDate);

// Admin Routes

// @route   GET /api/menus/admin/all
// Get all menus (Admin)
// @access  Private (Admin)
router.get(
  "/admin/all",
  auth,
  isAdmin,
  paginationValidator,
  menuController.getAllMenus
);

router.get(
  "/parent/all",
  auth,
  isParent,
  paginationValidator,
  menuController.getAllMenus
);

// @route   GET /api/menus/admin/upcoming-weeks
// Get upcoming weeks (for creating menus)
// @access  Private (Admin)
router.get(
  "/admin/upcoming-weeks",
  auth,
  isAdmin,
  menuController.getUpcomingWeeks
);

// @route   GET /api/menus/:id
// Get single menu by ID
// @access  Private (Admin)
router.get(
  "/:id",
  auth,
  isAdmin,
  mongoIdValidator("id"),
  menuController.getMenu
);

// @route   POST /api/menus
// Create new menu
// @access  Private (Admin)
router.post("/", auth, isAdmin, createMenuValidator, menuController.createMenu);

// @route   PUT /api/menus/:id
// Update menu
// @access  Private (Admin)
router.put(
  "/:id",
  auth,
  isAdmin,
  mongoIdValidator("id"),
  menuController.updateMenu
);

// @route   PUT /api/menus/:id/publish
// Publish menu
// @access  Private (Admin)
router.put(
  "/:id/publish",
  auth,
  isAdmin,
  mongoIdValidator("id"),
  menuController.publishMenu
);

// @route   PUT /api/menus/:id/unpublish
// @desc    Unpublish menu
// @access  Private (Admin)
router.put(
  "/:id/unpublish",
  auth,
  isAdmin,
  mongoIdValidator("id"),
  menuController.unpublishMenu
);

// @route   DELETE /api/menus/:id
// @desc    Delete menu
// @access  Private (Admin)
router.delete(
  "/:id",
  auth,
  isAdmin,
  mongoIdValidator("id"),
  menuController.deleteMenu
);

module.exports = router;
