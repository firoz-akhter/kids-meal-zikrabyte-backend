const { User, Child, Subscription, Delivery, Payment } = require("../models");

// @desc    Get admin dashboard statistics
// @route   GET /api/dashboard/admin
// @access  Private (Admin)
exports.getAdminDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Total Parents
    const totalParents = await User.countDocuments({
      role: "parent",
      isActive: true,
    });

    // Total Child_profile
    const totalChildren = await Child_profile.countDocuments({
      isActive: true,
    });

    // Active Subscriptions
    const activeSubscriptions = await Subscription.countDocuments({
      status: "active",
    });

    // Subscription Status Breakdown
    const subscriptionsByStatus = await Subscription.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const subscriptionStats = {
      active: 0,
      paused: 0,
      cancelled: 0,
      expired: 0,
    };

    subscriptionsByStatus.forEach((item) => {
      subscriptionStats[item._id] = item.count;
    });

    // Today's Meal Requirements
    const todaysMeals = await Delivery.countDocuments({
      deliveryDate: { $gte: today, $lt: tomorrow },
    });

    // Today's Delivery Status
    const todaysDeliveryStatus = await Delivery.aggregate([
      {
        $match: {
          deliveryDate: { $gte: today, $lt: tomorrow },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const deliveryStats = {
      total: todaysMeals,
      pending: 0,
      delivered: 0,
      missed: 0,
    };

    todaysDeliveryStatus.forEach((item) => {
      deliveryStats[item._id] = item.count;
    });

    // Meal Type Breakdown for Today
    const mealTypeBreakdown = await Delivery.aggregate([
      {
        $match: {
          deliveryDate: { $gte: today, $lt: tomorrow },
        },
      },
      {
        $group: {
          _id: "$mealType",
          count: { $sum: 1 },
        },
      },
    ]);

    const mealTypes = {
      lunch: 0,
      snacks: 0,
    };

    mealTypeBreakdown.forEach((item) => {
      mealTypes[item._id] = item.count;
    });

    // Recent Subscriptions (Last 7 days)
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentSubscriptions = await Subscription.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    // Revenue Statistics (Current Month)
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    const monthlyRevenue = await Payment.aggregate([
      {
        $match: {
          status: "completed",
          paymentDate: { $gte: monthStart, $lte: monthEnd },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const revenue = {
      month: monthlyRevenue[0] ? monthlyRevenue[0].total : 0,
      transactions: monthlyRevenue[0] ? monthlyRevenue[0].count : 0,
    };

    // Delivery Performance (Last 7 days)
    const weekDeliveries = await Delivery.aggregate([
      {
        $match: {
          deliveryDate: { $gte: sevenDaysAgo, $lt: tomorrow },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const weekPerformance = {
      total: 0,
      delivered: 0,
      missed: 0,
      successRate: 0,
    };

    weekDeliveries.forEach((item) => {
      weekPerformance[item._id] = item.count;
      weekPerformance.total += item.count;
    });

    if (weekPerformance.total > 0) {
      weekPerformance.successRate = (
        (weekPerformance.delivered / weekPerformance.total) *
        100
      ).toFixed(2);
    }

    res.json({
      success: true,
      data: {
        overview: {
          totalParents,
          totalChildren,
          activeSubscriptions,
          todaysMeals,
        },
        subscriptions: subscriptionStats,
        todaysDeliveries: {
          ...deliveryStats,
          byMealType: mealTypes,
        },
        recentActivity: {
          newSubscriptionsLast7Days: recentSubscriptions,
        },
        revenue: {
          currentMonth: revenue.month,
          transactions: revenue.transactions,
        },
        weeklyPerformance: weekPerformance,
        lastUpdated: new Date(),
      },
    });
  } catch (error) {
    console.error("Get admin dashboard error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get dashboard data",
    });
  }
};

// @desc    Get parent dashboard statistics
// @route   GET /api/dashboard/parent
// @access  Private (Parent)
exports.getParentDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all children
    const children = await Child_profile.find({
      parent: req.user.id,
      isActive: true,
    });

    const childIds = children.map((child) => child._id);

    // Active Subscriptions
    const activeSubscriptions = await Subscription.find({
      parent: req.user.id,
      status: "active",
    }).populate("child", "name age grade qrCode");

    // Today's Meals
    const todaysMeals = await Delivery.find({
      child: { $in: childIds },
      deliveryDate: { $gte: today, $lt: tomorrow },
    })
      .populate("child", "name age grade deliveryLocation qrCode")
      .populate("subscription", "mealType planType");

    // Upcoming Meals (Next 7 days)
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcomingMeals = await Delivery.countDocuments({
      child: { $in: childIds },
      deliveryDate: { $gte: tomorrow, $lt: nextWeek },
      status: "pending",
    });

    // Meal Delivery Stats (Last 30 days)
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const deliveryStats = await Delivery.aggregate([
      {
        $match: {
          child: { $in: childIds },
          deliveryDate: { $gte: thirtyDaysAgo, $lt: today },
        },
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
      delivered: 0,
      missed: 0,
      successRate: 0,
    };

    deliveryStats.forEach((item) => {
      stats[item._id] = item.count;
      stats.total += item.count;
    });

    if (stats.total > 0) {
      stats.successRate = ((stats.delivered / stats.total) * 100).toFixed(2);
    }

    // Payment Summary
    const paymentSummary = await Payment.aggregate([
      {
        $match: { parent: req.user.id },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    const payments = {
      total: 0,
      totalAmount: 0,
      completed: { count: 0, amount: 0 },
    };

    paymentSummary.forEach((item) => {
      payments[item._id] = {
        count: item.count,
        amount: item.totalAmount,
      };
      payments.total += item.count;
      payments.totalAmount += item.totalAmount;
    });

    // Subscription expiring soon (within 7 days)
    const expiringSubscriptions = await Subscription.find({
      parent: req.user.id,
      status: "active",
      endDate: { $gte: today, $lte: nextWeek },
    }).populate("child", "name");

    res.json({
      success: true,
      data: {
        overview: {
          totalChildren: children.length,
          activeSubscriptions: activeSubscriptions.length,
          todaysMeals: todaysMeals.length,
          upcomingMeals,
        },
        children: children.map((child) => ({
          id: child._id,
          name: child.name,
          age: child.age,
          grade: child.grade,
          qrCode: child.qrCode,
        })),
        activeSubscriptions: activeSubscriptions.map((sub) => ({
          id: sub._id,
          child: sub.child,
          planType: sub.planType,
          mealType: sub.mealType,
          endDate: sub.endDate,
          daysRemaining: Math.ceil(
            (new Date(sub.endDate) - today) / (1000 * 60 * 60 * 24)
          ),
        })),
        todaysMeals: todaysMeals.map((meal) => ({
          id: meal._id,
          child: meal.child,
          mealType: meal.mealType,
          status: meal.status,
          deliveredAt: meal.deliveredAt,
        })),
        deliveryStats: stats,
        paymentSummary: payments,
        alerts: {
          expiringSubscriptions: expiringSubscriptions.map((sub) => ({
            subscriptionId: sub._id,
            childName: sub.child.name,
            endDate: sub.endDate,
            daysRemaining: Math.ceil(
              (new Date(sub.endDate) - today) / (1000 * 60 * 60 * 24)
            ),
          })),
        },
        lastUpdated: new Date(),
      },
    });
  } catch (error) {
    console.error("Get parent dashboard error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get dashboard data",
    });
  }
};

// @desc    Get quick stats for any date range (Admin)
// @route   GET /api/dashboard/admin/stats
// @access  Private (Admin)
exports.getDateRangeStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Please provide startDate and endDate",
      });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Deliveries in date range
    const deliveries = await Delivery.aggregate([
      {
        $match: {
          deliveryDate: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Subscriptions created in date range
    const subscriptions = await Subscription.countDocuments({
      createdAt: { $gte: start, $lte: end },
    });

    // Revenue in date range
    const revenue = await Payment.aggregate([
      {
        $match: {
          status: "completed",
          paymentDate: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      dateRange: { startDate: start, endDate: end },
      data: {
        deliveries,
        newSubscriptions: subscriptions,
        revenue: revenue[0] || { total: 0, count: 0 },
      },
    });
  } catch (error) {
    console.error("Get date range stats error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get statistics",
    });
  }
};

// module.exports = {
//   getAdminDashboard,
//   getParentDashboard,
//   getDateRangeStats,
// };
