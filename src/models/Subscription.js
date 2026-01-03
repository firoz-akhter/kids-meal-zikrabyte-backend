const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Parent reference is required"],
      index: true,
    },
    child: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Child_profile",
      required: [true, "Child_profile reference is required"],
      index: true,
    },
    planType: {
      type: String,
      enum: ["weekly", "monthly"],
      required: [true, "Plan type is required"],
    },
    mealType: {
      type: String,
      enum: ["lunch", "snacks", "both"],
      required: [true, "Meal type is required"],
    },
    status: {
      type: String,
      enum: ["active", "paused", "cancelled", "expired"],
      default: "active",
      index: true,
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    pausedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: 0,
    },
    // For tracking pause/resume history
    statusHistory: [
      {
        status: {
          type: String,
          enum: ["active", "paused", "cancelled", "expired"],
        },
        // changedAt: {
        //   type: Date,
        //   default: Date.now,
        // },
        // reason: String,
      },
    ],
    // Days when meal should be delivered (0 = Sunday, 6 = Saturday)
    deliveryDays: [
      {
        type: Number,
        min: 0,
        max: 6,
      },
    ],
    // notes: {
    //   type: String,
    //   trim: true,
    // },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
subscriptionSchema.index({ parent: 1, status: 1 });
subscriptionSchema.index({ child: 1, status: 1 });
subscriptionSchema.index({ status: 1, endDate: 1 });
subscriptionSchema.index({ startDate: 1, endDate: 1 });

// Method to check if subscription is valid for a given date
subscriptionSchema.methods.isValidForDate = function (date) {
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  const start = new Date(this.startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(this.endDate);
  end.setHours(23, 59, 59, 999);

  return (
    this.status === "active" &&
    checkDate >= start &&
    checkDate <= end &&
    (!this.deliveryDays.length ||
      this.deliveryDays.includes(checkDate.getDay()))
  );
};

// Method to pause subscription
subscriptionSchema.methods.pause = function (reason) {
  this.status = "paused";
  this.pausedAt = new Date();
  this.statusHistory.push({
    status: "paused",
    reason: reason || "Paused by user",
  });
  return this.save();
};

// Method to resume subscription
subscriptionSchema.methods.resume = function () {
  this.status = "active";
  this.pausedAt = null;
  this.statusHistory.push({
    status: "active",
    reason: "Resumed by user",
  });
  return this.save();
};

// Method to cancel subscription
subscriptionSchema.methods.cancel = function (reason) {
  this.status = "cancelled";
  this.cancelledAt = new Date();
  this.statusHistory.push({
    status: "cancelled",
    reason: reason || "Cancelled by user",
  });
  return this.save();
};

// Static method to expire old subscriptions
subscriptionSchema.statics.expireOldSubscriptions = async function () {
  const now = new Date();
  return await this.updateMany(
    {
      status: { $in: ["active", "paused"] },
      endDate: { $lt: now },
    },
    {
      $set: { status: "expired" },
      $push: {
        statusHistory: {
          status: "expired",
          changedAt: now,
          reason: "Subscription period ended",
        },
      },
    }
  );
};

module.exports = mongoose.model("Subscription", subscriptionSchema);
