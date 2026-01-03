const { Subscription, Payment, Delivery, Child_profile } = require("../models");

// Pricing configuration
const PRICING = {
  weekly: {
    lunch: 500,
    snacks: 300,
    both: 750,
  },
  monthly: {
    lunch: 2000,
    snacks: 1200,
    both: 3000,
  },
};

// @desc    Get all subscriptions for logged in parent
// GET /api/subscriptions
// @access  Private (Parent)
exports.getSubscriptions = async (req, res) => {
  try {
    const { status, childId } = req.query;

    const query = { parent: req.user.id };

    if (status) {
      query.status = status;
    }

    if (childId) {
      query.child = childId;
    }

    const subscriptions = await Subscription.find(query)
      .populate("child", "name age grade deliveryLocation")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: subscriptions.length,
      data: { subscriptions },
    });
  } catch (error) {
    console.error("Get subscriptions error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get subscriptions",
    });
  }
};

// @desc    Get single subscription
// GET /api/subscriptions/:id
// @access  Private (Parent)
exports.getSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      _id: req.params.id,
      parent: req.user.id,
    }).populate("child", "name age grade deliveryLocation qrCode");

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    // Get delivery stats
    const deliveryStats = await Delivery.aggregate([
      {
        $match: { subscription: subscription._id },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const stats = {
      total: 0,
      pending: 0,
      delivered: 0,
      missed: 0,
    };

    deliveryStats.forEach((stat) => {
      stats[stat._id] = stat.count;
      stats.total += stat.count;
    });

    res.json({
      success: true,
      data: {
        subscription,
        deliveryStats: stats,
      },
    });
  } catch (error) {
    console.error("Get subscription error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get subscription",
    });
  }
};

// @desc    Calculate subscription price
// POST /api/subscriptions/calculate-price
// @access  Private (Parent)
exports.calculatePrice = async (req, res) => {
  try {
    const { planType, mealType } = req.body;

    if (!planType || !mealType) {
      return res.status(400).json({
        success: false,
        message: "Please provide planType and mealType",
      });
    }

    if (!PRICING[planType] || !PRICING[planType][mealType]) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan type or meal type",
      });
    }

    const basePrice = PRICING[planType][mealType];
    const tax = basePrice * 0.05; // 5% tax
    const totalPrice = basePrice + tax;

    res.json({
      success: true,
      data: {
        planType,
        mealType,
        basePrice,
        tax,
        discount: 0,
        totalPrice,
        breakdown: {
          description: `${planType} plan with ${mealType}`,
          duration: planType === "weekly" ? "7 days" : "30 days",
        },
      },
    });
  } catch (error) {
    console.error("Calculate price error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to calculate price",
    });
  }
};

// @desc    Create new subscription
// POST /api/subscriptions
// @access  Private (Parent)
exports.createSubscription = async (req, res) => {
  try {
    const { childId, planType, mealType, paymentMethod } = req.body;

    // Validate required fields
    if (!childId || !planType || !mealType || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide childId, planType, mealType, and paymentMethod",
      });
    }

    // Verify child belongs to parent
    const child = await Child_profile.findOne({
      _id: childId,
      parent: req.user.id,
      isActive: true,
    });

    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child_profile not found",
      });
    }

    // Check for existing active subscription
    const existingSubscription = await Subscription.findOne({
      child: childId,
      status: "active",
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: "Child_profile already has an active subscription",
      });
    }

    // Calculate dates
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    if (planType === "weekly") {
      endDate.setDate(endDate.getDate() + 7);
    } else {
      endDate.setDate(endDate.getDate() + 30);
    }

    // Calculate price
    const basePrice = PRICING[planType][mealType];
    const tax = basePrice * 0.05;
    const totalPrice = basePrice + tax;

    // Create subscription
    const subscription = await Subscription.create({
      parent: req.user.id,
      child: childId,
      planType,
      mealType,
      startDate,
      endDate,
      price: totalPrice,
      status: "active",
      deliveryDays: [1, 2, 3, 4, 5], // Monday to Friday
      statusHistory: [
        {
          status: "active",
          reason: "Subscription created",
        },
      ],
    });

    // Create payment record
    const payment = await Payment.create({
      parent: req.user.id,
      subscription: subscription._id,
      child: childId,
      amount: totalPrice,
      status: "completed", // Simplified - in real app, integrate payment gateway
      paymentMethod,
      paymentDate: new Date(),
      transactionId: `TXN${Date.now()}`,
      breakdown: {
        planType,
        mealType,
        duration: planType === "weekly" ? "7 days" : "30 days",
        basePrice,
        tax,
        discount: 0,
        totalPrice,
      },
    });

    // Create initial deliveries for the next 7 days
    await Delivery.createDeliveriesForDate(new Date());

    res.status(201).json({
      success: true,
      message: "Subscription created successfully",
      data: {
        subscription,
        payment,
      },
    });
  } catch (error) {
    console.error("Create subscription error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create subscription",
    });
  }
};

// @desc    Pause subscription
// PUT /api/subscriptions/:id/pause
// @access  Private (Parent)
exports.pauseSubscription = async (req, res) => {
  try {
    const { reason } = req.body;

    const subscription = await Subscription.findOne({
      _id: req.params.id,
      parent: req.user.id,
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    if (subscription.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Can only pause active subscriptions",
      });
    }

    await subscription.pause(reason || "Paused by user");

    res.json({
      success: true,
      message: "Subscription paused successfully",
      data: { subscription },
    });
  } catch (error) {
    console.error("Pause subscription error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to pause subscription",
    });
  }
};

// @desc    Resume subscription
// PUT /api/subscriptions/:id/resume
// @access  Private (Parent)
exports.resumeSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      _id: req.params.id,
      parent: req.user.id,
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    if (subscription.status !== "paused") {
      return res.status(400).json({
        success: false,
        message: "Can only resume paused subscriptions",
      });
    }

    await subscription.resume();

    res.json({
      success: true,
      message: "Subscription resumed successfully",
      data: { subscription },
    });
  } catch (error) {
    console.error("Resume subscription error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to resume subscription",
    });
  }
};

// @desc    Cancel subscription
// PUT /api/subscriptions/:id/cancel
// @access  Private (Parent)
exports.cancelSubscription = async (req, res) => {
  try {
    const { reason } = req.body;

    const subscription = await Subscription.findOne({
      _id: req.params.id,
      parent: req.user.id,
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    if (
      subscription.status === "cancelled" ||
      subscription.status === "expired"
    ) {
      return res.status(400).json({
        success: false,
        message: "Subscription is already cancelled or expired",
      });
    }

    await subscription.cancel(reason || "Cancelled by user");

    res.json({
      success: true,
      message:
        "Subscription cancelled successfully. No refund will be processed.",
      data: { subscription },
    });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to cancel subscription",
    });
  }
};

// @desc    Get subscription history for child
// GET /api/subscriptions/child/:childId/history
// @access  Private (Parent)
exports.getChildSubscriptionHistory = async (req, res) => {
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

    const subscriptions = await Subscription.find({
      child: req.params.childId,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: subscriptions.length,
      data: {
        child: {
          id: child._id,
          name: child.name,
        },
        subscriptions,
      },
    });
  } catch (error) {
    console.error("Get child subscription history error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get subscription history",
    });
  }
};

// @desc    Get all subscriptions (Admin)
// GET /api/subscriptions/admin/all
// @access  Private (Admin)
exports.getAllSubscriptions = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    let subscriptions = await Subscription.find(query)
      .populate("parent", "name email mobile")
      .populate("child", "name age grade deliveryLocation")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Apply search filter if provided
    if (search) {
      subscriptions = subscriptions.filter(
        (sub) =>
          sub.parent?.name.toLowerCase().includes(search.toLowerCase()) ||
          sub.child?.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    const total = await Subscription.countDocuments(query);

    res.json({
      success: true,
      count: subscriptions.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: { subscriptions },
    });
  } catch (error) {
    console.error("Get all subscriptions error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get subscriptions",
    });
  }
};

// @desc    Admin pause/resume subscription
// PUT /api/subscriptions/admin/:id/status
// @access  Private (Admin)
exports.adminUpdateSubscriptionStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;

    if (!["active", "paused"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either active or paused",
      });
    }

    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    if (status === "paused") {
      await subscription.pause(reason || "Paused by admin");
    } else {
      await subscription.resume();
    }

    res.json({
      success: true,
      message: `Subscription ${
        status === "paused" ? "paused" : "resumed"
      } successfully`,
      data: { subscription },
    });
  } catch (error) {
    console.error("Admin update subscription status error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update subscription status",
    });
  }
};
