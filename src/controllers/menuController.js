const { Menu } = require("../models");

// Helper function to get week number and dates
const getWeekInfo = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);

  // Get start of week (Monday)
  const startOfWeek = new Date(d);
  startOfWeek.setDate(d.getDate() - d.getDay() + 1);
  startOfWeek.setHours(0, 0, 0, 0);

  // Get end of week (Sunday)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return {
    weekNumber,
    year: d.getFullYear(),
    weekStartDate: startOfWeek,
    weekEndDate: endOfWeek,
  };
};

// @desc    Get current week menu (Parent view)
// @route   GET /api/menus/current
// @access  Private (Parent)
exports.getCurrentMenu = async (req, res) => {
  try {
    const menu = await Menu.getCurrentWeekMenu();

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: "No menu published for current week",
      });
    }

    res.json({
      success: true,
      data: { menu },
    });
  } catch (error) {
    console.error("Get current menu error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get current menu",
    });
  }
};

// @desc    Get menu for specific date
// @route   GET /api/menus/date/:date
// @access  Private
exports.getMenuForDate = async (req, res) => {
  try {
    const { date } = req.params;

    const menu = await Menu.getMenuForDate(date);

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: "No menu found for this date",
      });
    }

    // Get specific day's menu
    const dayMenu = menu.getDayMenu(date);

    res.json({
      success: true,
      data: {
        date,
        menu: dayMenu,
        weekInfo: {
          weekStartDate: menu.weekStartDate,
          weekEndDate: menu.weekEndDate,
        },
      },
    });
  } catch (error) {
    console.error("Get menu for date error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get menu",
    });
  }
};

// @desc    Get all menus (Admin)
// @route   GET /api/menus/admin/all
// @access  Private (Admin)
exports.getAllMenus = async (req, res) => {
  try {
    const { page = 1, limit = 10, isPublished } = req.query;

    const query = {};

    if (isPublished !== undefined) {
      query.isPublished = isPublished === "true";
    }

    const skip = (page - 1) * limit;

    const menus = await Menu.find(query)
      .populate("publishedBy", "name email")
      .sort({ weekStartDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Menu.countDocuments(query);

    res.json({
      success: true,
      count: menus.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: { menus },
    });
  } catch (error) {
    console.error("Get all menus error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get menus",
    });
  }
};

// @desc    Get single menu by ID
// @route   GET /api/menus/:id
// @access  Private (Admin)
exports.getMenu = async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id).populate(
      "publishedBy",
      "name email"
    );

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: "Menu not found",
      });
    }

    res.json({
      success: true,
      data: { menu },
    });
  } catch (error) {
    console.error("Get menu error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get menu",
    });
  }
};

// @desc    Create new menu
// @route   POST /api/menus
// @access  Private (Admin)
exports.createMenu = async (req, res) => {
  try {
    const { weekStartDate, days, notes } = req.body;

    if (!weekStartDate || !days) {
      return res.status(400).json({
        success: false,
        message: "Please provide weekStartDate and days",
      });
    }

    // Get week info
    const weekInfo = getWeekInfo(weekStartDate);

    // Check if menu already exists for this week
    const existingMenu = await Menu.findOne({
      year: weekInfo.year,
      weekNumber: weekInfo.weekNumber,
    });

    if (existingMenu) {
      return res.status(400).json({
        success: false,
        message: "Menu already exists for this week",
      });
    }

    // Create menu
    const menu = await Menu.create({
      weekStartDate: weekInfo.weekStartDate,
      weekEndDate: weekInfo.weekEndDate,
      weekNumber: weekInfo.weekNumber,
      year: weekInfo.year,
      days,
      notes,
      isPublished: false,
    });

    res.status(201).json({
      success: true,
      message: "Menu created successfully",
      data: { menu },
    });
  } catch (error) {
    console.error("Create menu error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Menu already exists for this week",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to create menu",
    });
  }
};

// @desc    Update menu
// @route   PUT /api/menus/:id
// @access  Private (Admin)
exports.updateMenu = async (req, res) => {
  try {
    const { days, notes } = req.body;

    const menu = await Menu.findById(req.params.id);

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: "Menu not found",
      });
    }

    // Update fields
    if (days) menu.days = days;
    if (notes !== undefined) menu.notes = notes;

    await menu.save();

    res.json({
      success: true,
      message: "Menu updated successfully",
      data: { menu },
    });
  } catch (error) {
    console.error("Update menu error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update menu",
    });
  }
};

// @desc    Publish menu
// @route   PUT /api/menus/:id/publish
// @access  Private (Admin)
exports.publishMenu = async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id);

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: "Menu not found",
      });
    }

    if (menu.isPublished) {
      return res.status(400).json({
        success: false,
        message: "Menu is already published",
      });
    }

    await menu.publish(req.user.id);

    res.json({
      success: true,
      message: "Menu published successfully",
      data: { menu },
    });
  } catch (error) {
    console.error("Publish menu error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to publish menu",
    });
  }
};

// @desc    Unpublish menu
// @route   PUT /api/menus/:id/unpublish
// @access  Private (Admin)
exports.unpublishMenu = async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id);

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: "Menu not found",
      });
    }

    if (!menu.isPublished) {
      return res.status(400).json({
        success: false,
        message: "Menu is not published",
      });
    }

    await menu.unpublish();

    res.json({
      success: true,
      message: "Menu unpublished successfully",
      data: { menu },
    });
  } catch (error) {
    console.error("Unpublish menu error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to unpublish menu",
    });
  }
};

// @desc    Delete menu
// @route   DELETE /api/menus/:id
// @access  Private (Admin)
exports.deleteMenu = async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id);

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: "Menu not found",
      });
    }

    if (menu.isPublished) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete published menu. Unpublish it first.",
      });
    }

    await menu.deleteOne();

    res.json({
      success: true,
      message: "Menu deleted successfully",
    });
  } catch (error) {
    console.error("Delete menu error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete menu",
    });
  }
};

// @desc    Get upcoming weeks (for creating menus)
// @route   GET /api/menus/admin/upcoming-weeks
// @access  Private (Admin)
exports.getUpcomingWeeks = async (req, res) => {
  try {
    const weeks = [];
    const today = new Date();

    // Get next 8 weeks
    for (let i = 0; i < 8; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i * 7);

      const weekInfo = getWeekInfo(date);

      // Check if menu exists
      const existingMenu = await Menu.findOne({
        year: weekInfo.year,
        weekNumber: weekInfo.weekNumber,
      });

      weeks.push({
        ...weekInfo,
        hasMenu: !!existingMenu,
        menuId: existingMenu?._id,
        isPublished: existingMenu?.isPublished || false,
      });
    }

    res.json({
      success: true,
      data: { weeks },
    });
  } catch (error) {
    console.error("Get upcoming weeks error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get upcoming weeks",
    });
  }
};
