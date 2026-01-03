const { Delivery, Subscription, Child } = require("../models");

// @desc    Get today's meal status for parent
// @route   GET /api/deliveries/today
// @access  Private (Parent)
exports.getTodaysMeals = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all children of parent
    const children = await Child_profile.find({
      parent: req.user.id,
      isActive: true,
    });

    const childIds = children.map((child) => child._id);

    // Get today's deliveries for parent's children
    const deliveries = await Delivery.find({
      child: { $in: childIds },
      deliveryDate: {
        $gte: today,
        $lt: tomorrow,
      },
    })
      .populate("child", "name age grade deliveryLocation qrCode")
      .populate("subscription", "mealType planType")
      .sort({ mealType: 1 });

    res.json({
      success: true,
      date: today,
      count: deliveries.length,
      data: { deliveries },
    });
  } catch (error) {
    console.error("Get today's meals error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get today's meals",
    });
  }
};

// @desc    Get delivery history for child
// @route   GET /api/deliveries/child/:childId
// @access  Private (Parent)
exports.getChildDeliveries = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    // Verify child belongs to parent
    const child = await Child_profile.findOne({
      _id: req.params.childId,
      parent: req.user.id,
    });

    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child_profile not found",
      });
    }

    const query = { child: req.params.childId };

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const deliveries = await Delivery.find(query)
      .populate("subscription", "mealType planType")
      .sort({ deliveryDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Delivery.countDocuments(query);

    res.json({
      success: true,
      count: deliveries.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: {
        child: {
          id: child._id,
          name: child.name,
        },
        deliveries,
      },
    });
  } catch (error) {
    console.error("Get child deliveries error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get deliveries",
    });
  }
};

// @desc    Get upcoming meals for child
// @route   GET /api/deliveries/child/:childId/upcoming
// @access  Private (Parent)
exports.getUpcomingMeals = async (req, res) => {
  try {
    // Verify child belongs to parent
    const child = await Child_profile.findOne({
      _id: req.params.childId,
      parent: req.user.id,
    });

    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child_profile not found",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const deliveries = await Delivery.find({
      child: req.params.childId,
      deliveryDate: {
        $gte: today,
        $lt: nextWeek,
      },
      status: "pending",
    })
      .populate("subscription", "mealType planType")
      .sort({ deliveryDate: 1, mealType: 1 });

    res.json({
      success: true,
      count: deliveries.length,
      data: {
        child: {
          id: child._id,
          name: child.name,
        },
        deliveries,
      },
    });
  } catch (error) {
    console.error("Get upcoming meals error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get upcoming meals",
    });
  }
};

// @desc    Get all deliveries for today (Admin)
// @route   GET /api/deliveries/admin/today
// @access  Private (Admin)
exports.getTodaysDeliveries = async (req, res) => {
  try {
    const { status, search } = req.query;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const query = {
      deliveryDate: {
        $gte: today,
        $lt: tomorrow,
      },
    };

    if (status) {
      query.status = status;
    }

    let deliveries = await Delivery.find(query)
      .populate("child", "name age grade deliveryLocation qrCodeData")
      .populate("subscription", "mealType planType")
      .populate({
        path: "child",
        populate: {
          path: "parent",
          select: "name mobile",
        },
      })
      .sort({ status: 1, deliveryLocation: 1 });

    // Apply search filter
    if (search) {
      deliveries = deliveries.filter(
        (delivery) =>
          delivery.child?.name.toLowerCase().includes(search.toLowerCase()) ||
          delivery.child?.deliveryLocation
            .toLowerCase()
            .includes(search.toLowerCase())
      );
    }

    res.json({
      success: true,
      date: today,
      count: deliveries.length,
      data: { deliveries },
    });
  } catch (error) {
    console.error("Get today's deliveries error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get deliveries",
    });
  }
};

// @desc    Get delivery statistics (Admin Dashboard)
// @route   GET /api/deliveries/admin/stats
// @access  Private (Admin)
exports.getDeliveryStats = async (req, res) => {
  try {
    const { date } = req.query;

    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    // Get delivery stats for the date
    const stats = await Delivery.getDeliveryStats(targetDate);

    // Get meal type breakdown
    const mealTypeStats = await Delivery.aggregate([
      {
        $match: {
          deliveryDate: {
            $gte: targetDate,
            $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000),
          },
        },
      },
      {
        $group: {
          _id: {
            mealType: "$mealType",
            status: "$status",
          },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      date: targetDate,
      data: {
        overall: stats,
        byMealType: mealTypeStats,
      },
    });
  } catch (error) {
    console.error("Get delivery stats error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get delivery stats",
    });
  }
};

// @desc    Mark delivery as delivered
// @route   PUT /api/deliveries/:id/delivered
// @access  Private (Admin)
exports.markDelivered = async (req, res) => {
  try {
    const { comment, qrScanned } = req.body;

    const delivery = await Delivery.findById(req.params.id).populate(
      "child",
      "name age grade deliveryLocation"
    );

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: "Delivery not found",
      });
    }

    if (delivery.status === "delivered") {
      return res.status(400).json({
        success: false,
        message: "Delivery already marked as delivered",
      });
    }

    await delivery.markDelivered(req.user.id, comment, qrScanned);

    res.json({
      success: true,
      message: "Delivery marked as delivered",
      data: { delivery },
    });
  } catch (error) {
    console.error("Mark delivered error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to mark delivery",
    });
  }
};

// @desc    Mark delivery as missed
// @route   PUT /api/deliveries/:id/missed
// @access  Private (Admin)
exports.markMissed = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Please provide a reason for marking as missed",
      });
    }

    const delivery = await Delivery.findById(req.params.id).populate(
      "child",
      "name age grade deliveryLocation"
    );

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: "Delivery not found",
      });
    }

    if (delivery.status === "missed") {
      return res.status(400).json({
        success: false,
        message: "Delivery already marked as missed",
      });
    }

    await delivery.markMissed(req.user.id, reason);

    res.json({
      success: true,
      message: "Delivery marked as missed",
      data: { delivery },
    });
  } catch (error) {
    console.error("Mark missed error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to mark delivery",
    });
  }
};

// @desc    Verify QR and mark delivered
// @route   POST /api/deliveries/verify-and-deliver
// @access  Private (Admin)
exports.verifyAndDeliver = async (req, res) => {
  try {
    const { qrCodeData, mealType, comment } = req.body;

    if (!qrCodeData || !mealType) {
      return res.status(400).json({
        success: false,
        message: "Please provide qrCodeData and mealType",
      });
    }

    // Find child by QR code
    const child = await Child_profile.findOne({ qrCodeData });

    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Invalid QR code",
      });
    }

    // Get today's delivery for this child and meal type
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const delivery = await Delivery.findOne({
      child: child._id,
      deliveryDate: {
        $gte: today,
        $lt: tomorrow,
      },
      mealType,
      status: "pending",
    }).populate("child", "name age grade deliveryLocation");

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: "No pending delivery found for this child and meal type today",
      });
    }

    // Mark as delivered with QR scanned
    await delivery.markDelivered(req.user.id, comment, true);

    res.json({
      success: true,
      message: "Delivery verified and marked as delivered",
      data: { delivery },
    });
  } catch (error) {
    console.error("Verify and deliver error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to verify and deliver",
    });
  }
};

// @desc    Create deliveries for a date (Manual trigger)
// @route   POST /api/deliveries/admin/create
// @access  Private (Admin)
exports.createDeliveries = async (req, res) => {
  try {
    const { date } = req.body;

    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const deliveries = await Delivery.createDeliveriesForDate(targetDate);

    res.json({
      success: true,
      message: `Created ${
        deliveries.length
      } deliveries for ${targetDate.toDateString()}`,
      data: {
        date: targetDate,
        count: deliveries.length,
        deliveries,
      },
    });
  } catch (error) {
    console.error("Create deliveries error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create deliveries",
    });
  }
};

// @desc    Get delivery history (Admin)
// @route   GET /api/deliveries/admin/history
// @access  Private (Admin)
exports.getDeliveryHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, startDate, endDate, status } = req.query;

    const query = {};

    // Date range filter
    if (startDate || endDate) {
      query.deliveryDate = {};
      if (startDate) {
        query.deliveryDate.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.deliveryDate.$lte = end;
      }
    }

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const deliveries = await Delivery.find(query)
      .populate("child", "name age grade deliveryLocation")
      .populate({
        path: "child",
        populate: {
          path: "parent",
          select: "name mobile",
        },
      })
      .sort({ deliveryDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Delivery.countDocuments(query);

    res.json({
      success: true,
      count: deliveries.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: { deliveries },
    });
  } catch (error) {
    console.error("Get delivery history error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get delivery history",
    });
  }
};
