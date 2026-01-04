const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Menu item name is required"],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  type: {
    type: String,
    enum: ["lunch", "snacks"],
    required: [true, "Menu item type is required"],
  },
  category: {
    type: String,
    enum: ["veg", "non-veg"],
    required: [true, "Category is required"],
  },
  ingredients: [
    {
      type: String,
      trim: true,
    },
  ],
  allergens: [
    {
      type: String,
      trim: true,
    },
  ],
  nutritionInfo: {
    calories: Number,
    protein: String,
    carbs: String,
    fat: String,
  },
});

const menuSchema = new mongoose.Schema(
  {
    weekStartDate: {
      type: Date,
      required: [true, "Week start date is required"],
      index: true,
    },
    weekEndDate: {
      type: Date,
      required: [true, "Week end date is required"],
    },
    weekNumber: {
      type: Number,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    // Menu for each day of the week
    days: {
      monday: {
        lunch: [menuItemSchema],
        snacks: [menuItemSchema],
      },
      tuesday: {
        lunch: [menuItemSchema],
        snacks: [menuItemSchema],
      },
      wednesday: {
        lunch: [menuItemSchema],
        snacks: [menuItemSchema],
      },
      thursday: {
        lunch: [menuItemSchema],
        snacks: [menuItemSchema],
      },
      friday: {
        lunch: [menuItemSchema],
        snacks: [menuItemSchema],
      },
      saturday: {
        lunch: [menuItemSchema],
        snacks: [menuItemSchema],
      },
      sunday: {
        lunch: [menuItemSchema],
        snacks: [menuItemSchema],
      },
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
    publishedAt: {
      type: Date,
    },
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique week
menuSchema.index({ year: 1, weekNumber: 1 }, { unique: true });
menuSchema.index({ weekStartDate: 1, weekEndDate: 1 });
menuSchema.index({ isPublished: 1, weekStartDate: 1 });

// Method to publish menu
menuSchema.methods.publish = function (adminId) {
  this.isPublished = true;
  this.publishedAt = new Date();
  this.publishedBy = adminId;
  return this.save();
};

// Method to unpublish menu
menuSchema.methods.unpublish = function () {
  this.isPublished = false;
  this.publishedAt = null;
  return this.save();
};

// Static method to get menu for a specific date
menuSchema.statics.getMenuForDate = async function (date) {
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  return await this.findOne({
    isPublished: true,
    weekStartDate: { $lte: checkDate },
    weekEndDate: { $gte: checkDate },
  });
};

// Static method to get current week menu
menuSchema.statics.getCurrentWeekMenu = async function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return await this.findOne({
    isPublished: true,
    weekStartDate: { $lte: today },
    weekEndDate: { $gte: today },
  });
};

// Helper method to get day name from date
menuSchema.methods.getDayMenu = function (date) {
  const dayNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const dayName = dayNames[new Date(date).getDay()];
  return this.days[dayName];
};

module.exports = mongoose.model("Menu", menuSchema);
