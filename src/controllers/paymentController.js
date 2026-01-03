const { Payment, Subscription } = require("../models");

// @desc    Get payment history for parent
// GET /api/payments
// @access  Private (Parent)
exports.getPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = { parent: req.user.id };

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const payments = await Payment.find(query)
      .populate("child", "name age grade")
      .populate("subscription", "planType mealType startDate endDate status")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      count: payments.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: { payments },
    });
  } catch (error) {
    console.error("Get payments error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get payments",
    });
  }
};

// @desc    Get single payment
//  GET /api/payments/:id
// @access  Private (Parent)
exports.getPayment = async (req, res) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.id,
      parent: req.user.id,
    })
      .populate("child", "name age grade")
      .populate("subscription", "planType mealType startDate endDate status");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    res.json({
      success: true,
      data: { payment },
    });
  } catch (error) {
    console.error("Get payment error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get payment",
    });
  }
};

// @desc    Get payment summary for parent
// GET /api/payments/summary
// @access  Private (Parent)
exports.getPaymentSummary = async (req, res) => {
  try {
    const summary = await Payment.getParentPaymentSummary(req.user.id);

    const formattedSummary = {
      total: 0,
      completed: { count: 0, amount: 0 },
      pending: { count: 0, amount: 0 },
      failed: { count: 0, amount: 0 },
      refunded: { count: 0, amount: 0 },
    };

    summary.forEach((item) => {
      formattedSummary[item._id] = {
        count: item.count,
        amount: item.totalAmount,
      };
      formattedSummary.total += item.totalAmount;
    });

    res.json({
      success: true,
      data: { summary: formattedSummary },
    });
  } catch (error) {
    console.error("Get payment summary error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get payment summary",
    });
  }
};

// @desc    Process payment (Simplified - in real app, integrate payment gateway)
// POST /api/payments/process
// @access  Private (Parent)
exports.processPayment = async (req, res) => {
  try {
    const { subscriptionId, paymentMethod } = req.body;

    if (!subscriptionId || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Please provide subscriptionId and paymentMethod",
      });
    }

    // Get subscription
    const subscription = await Subscription.findOne({
      _id: subscriptionId,
      parent: req.user.id,
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({
      subscription: subscriptionId,
      status: { $in: ["completed", "pending"] },
    });

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: "Payment already processed for this subscription",
      });
    }

    // Create payment
    const payment = await Payment.create({
      parent: req.user.id,
      subscription: subscriptionId,
      child: subscription.child,
      amount: subscription.price,
      currency: "INR",
      status: "pending",
      paymentMethod,
      breakdown: {
        planType: subscription.planType,
        mealType: subscription.mealType,
        duration: subscription.planType === "weekly" ? "7 days" : "30 days",
        basePrice: subscription.price * 0.95, // Assuming 5% tax
        tax: subscription.price * 0.05,
        discount: 0,
        totalPrice: subscription.price,
      },
    });

    // Simulate payment processing (in real app, call payment gateway API)
    // For demo, automatically mark as completed
    setTimeout(async () => {
      try {
        await payment.markCompleted(`TXN${Date.now()}`, {
          gateway: "demo",
          status: "success",
        });
      } catch (error) {
        console.error("Payment completion error:", error);
      }
    }, 1000);

    res.status(201).json({
      success: true,
      message: "Payment initiated successfully",
      data: { payment },
    });
  } catch (error) {
    console.error("Process payment error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to process payment",
    });
  }
};

// @desc    Request refund (Note: No refund policy, but can track requests)
// POST /api/payments/:id/refund-request
// @access  Private (Parent)
exports.requestRefund = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Please provide a reason for refund request",
      });
    }

    const payment = await Payment.findOne({
      _id: req.params.id,
      parent: req.user.id,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (payment.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Can only request refund for completed payments",
      });
    }

    // Add note about no refund policy
    payment.notes = `Refund requested: ${reason}. Note: As per policy, refunds are not provided.`;
    await payment.save();

    res.json({
      success: false,
      message:
        "Refund request noted. However, as per our policy, we do not provide refunds for subscriptions.",
      data: { payment },
    });
  } catch (error) {
    console.error("Request refund error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to process refund request",
    });
  }
};

// @desc    Get all payments (Admin)
// GET /api/payments/admin/all
// @access  Private (Admin)
exports.getAllPayments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      startDate,
      endDate,
      search,
    } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) {
        query.paymentDate.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.paymentDate.$lte = end;
      }
    }

    const skip = (page - 1) * limit;

    let payments = await Payment.find(query)
      .populate("parent", "name email mobile")
      .populate("child", "name age grade")
      .populate("subscription", "planType mealType startDate endDate status")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Apply search filter
    if (search) {
      payments = payments.filter(
        (payment) =>
          payment.parent?.name.toLowerCase().includes(search.toLowerCase()) ||
          payment.parent?.email.toLowerCase().includes(search.toLowerCase()) ||
          payment.transactionId?.toLowerCase().includes(search.toLowerCase())
      );
    }

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      count: payments.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: { payments },
    });
  } catch (error) {
    console.error("Get all payments error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get payments",
    });
  }
};

// @desc    Get payment statistics (Admin Dashboard)
// GET /api/payments/admin/stats
// @access  Private (Admin)
exports.getPaymentStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchQuery = {};

    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) {
        matchQuery.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchQuery.createdAt.$lte = end;
      }
    }

    const stats = await Payment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    // Get payment method breakdown
    const methodStats = await Payment.aggregate([
      { $match: { ...matchQuery, status: "completed" } },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    // Format results
    const formattedStats = {
      overall: {
        total: 0,
        totalAmount: 0,
        completed: { count: 0, amount: 0 },
        pending: { count: 0, amount: 0 },
        failed: { count: 0, amount: 0 },
        refunded: { count: 0, amount: 0 },
      },
      byPaymentMethod: [],
    };

    stats.forEach((stat) => {
      formattedStats.overall[stat._id] = {
        count: stat.count,
        amount: stat.totalAmount,
      };
      formattedStats.overall.total += stat.count;
      formattedStats.overall.totalAmount += stat.totalAmount;
    });

    formattedStats.byPaymentMethod = methodStats;

    res.json({
      success: true,
      data: { stats: formattedStats },
    });
  } catch (error) {
    console.error("Get payment stats error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get payment stats",
    });
  }
};

// @desc    Get revenue report (Admin)
// GET /api/payments/admin/revenue
// @access  Private (Admin)
exports.getRevenueReport = async (req, res) => {
  try {
    const { year, month } = req.query;

    const matchQuery = { status: "completed" };

    if (year && month) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      matchQuery.paymentDate = { $gte: startDate, $lte: endDate };
    } else if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
      matchQuery.paymentDate = { $gte: startDate, $lte: endDate };
    }

    const revenue = await Payment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            year: { $year: "$paymentDate" },
            month: { $month: "$paymentDate" },
          },
          totalRevenue: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
    ]);

    res.json({
      success: true,
      data: { revenue },
    });
  } catch (error) {
    console.error("Get revenue report error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get revenue report",
    });
  }
};
