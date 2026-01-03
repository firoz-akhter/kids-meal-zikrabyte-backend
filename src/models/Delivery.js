const mongoose = require("mongoose");

const deliverySchema = new mongoose.Schema(
  {
    child: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Child_profile",
      required: [true, "Child_profile reference is required"],
      index: true,
    },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      required: [true, "Subscription reference is required"],
      index: true,
    },
    deliveryDate: {
      type: Date,
      required: [true, "Delivery date is required"],
      index: true,
    },
    mealType: {
      type: String,
      enum: ["lunch", "snacks"],
      required: [true, "Meal type is required"],
    },
    status: {
      type: String,
      enum: ["pending", "delivered", "missed"],
      default: "pending",
      index: true,
    },
    deliveredAt: {
      type: Date,
    },
    // deliveredBy: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "User", // Admin who marked as delivered
    // },
    qrCodeScanned: {
      type: Boolean,
      default: false,
    },
    // qrCodeScannedAt: {
    //   type: Date,
    // },
    // comment: {
    //   type: String,
    //   trim: true,
    //   maxlength: 500,
    // },
    // For tracking changes
    statusHistory: [
      {
        status: {
          type: String,
          enum: ["pending", "delivered", "missed"],
        },
        // changedAt: {
        //   type: Date,
        //   default: Date.now,
        // },
        // changedBy: {
        //   type: mongoose.Schema.Types.ObjectId,
        //   ref: "User",
        // },
        // reason: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
deliverySchema.index({ child: 1, deliveryDate: 1 });
deliverySchema.index({ subscription: 1, deliveryDate: 1 });
deliverySchema.index({ deliveryDate: 1, status: 1 });
deliverySchema.index({ status: 1, deliveryDate: 1 });

// Unique index to prevent duplicate deliveries
deliverySchema.index(
  { child: 1, deliveryDate: 1, mealType: 1 },
  { unique: true }
);

// Method to mark as delivered
deliverySchema.methods.markDelivered = function (
  adminId,
  comment,
  qrScanned = false
) {
  this.status = "delivered";
  this.deliveredAt = new Date();
  this.deliveredBy = adminId;
  this.qrCodeScanned = qrScanned;
  if (qrScanned) {
    this.qrCodeScannedAt = new Date();
  }
  if (comment) {
    this.comment = comment;
  }
  this.statusHistory.push({
    status: "delivered",
    changedBy: adminId,
    reason: comment || "Marked as delivered",
  });
  return this.save();
};

// Method to mark as missed
deliverySchema.methods.markMissed = function (adminId, reason) {
  this.status = "missed";
  this.comment = reason;
  this.statusHistory.push({
    status: "missed",
    changedBy: adminId,
    reason: reason || "Marked as missed",
  });
  return this.save();
};

// Static method to get today's deliveries
deliverySchema.statics.getTodaysDeliveries = async function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return await this.find({
    deliveryDate: {
      $gte: today,
      $lt: tomorrow,
    },
  })
    .populate("child", "name age grade deliveryLocation")
    .populate("subscription", "mealType")
    .sort({ deliveryDate: 1, mealType: 1 });
};

// Static method to get delivery stats for a date
deliverySchema.statics.getDeliveryStats = async function (date) {
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1);

  const stats = await this.aggregate([
    {
      $match: {
        deliveryDate: {
          $gte: startDate,
          $lt: endDate,
        },
      },
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const result = {
    total: 0,
    pending: 0,
    delivered: 0,
    missed: 0,
  };

  stats.forEach((stat) => {
    result[stat._id] = stat.count;
    result.total += stat.count;
  });

  return result;
};

// Static method to create deliveries for active subscriptions
deliverySchema.statics.createDeliveriesForDate = async function (date) {
  const Subscription = mongoose.model("Subscription");

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  // Get all active subscriptions valid for this date
  const subscriptions = await Subscription.find({
    status: "active",
    startDate: { $lte: targetDate },
    endDate: { $gte: targetDate },
  }).populate("child");

  const deliveries = [];

  for (const subscription of subscriptions) {
    // Check if delivery already exists
    const existingLunch = await this.findOne({
      child: subscription.child._id,
      deliveryDate: targetDate,
      mealType: "lunch",
    });

    const existingSnacks = await this.findOne({
      child: subscription.child._id,
      deliveryDate: targetDate,
      mealType: "snacks",
    });

    // Create lunch delivery if needed
    if (!existingLunch && ["lunch", "both"].includes(subscription.mealType)) {
      deliveries.push({
        child: subscription.child._id,
        subscription: subscription._id,
        deliveryDate: targetDate,
        mealType: "lunch",
        status: "pending",
      });
    }

    // Create snacks delivery if needed
    if (!existingSnacks && ["snacks", "both"].includes(subscription.mealType)) {
      deliveries.push({
        child: subscription.child._id,
        subscription: subscription._id,
        deliveryDate: targetDate,
        mealType: "snacks",
        status: "pending",
      });
    }
  }

  if (deliveries.length > 0) {
    return await this.insertMany(deliveries);
  }

  return [];
};

module.exports = mongoose.model("Delivery", deliverySchema);
