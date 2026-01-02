const mongoose = require("mongoose");
const QRCode = require("qrcode");

const childSchema = new mongoose.Schema(
  {
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      required: true,
      min: 3,
      max: 18,
    },
    grade: {
      type: String,
      required: true,
      trim: true,
    },
    allergies: [
      {
        type: String,
        trim: true,
      },
    ],
    foodPreference: {
      type: String,
      enum: ["veg", "non-veg", "veg-only"],
      default: "veg",
    },
    deliveryLocation: {
      type: String,
      required: true,
      trim: true,
    },
    qrCode: {
      type: String, // Base64 encoded QR code image
      required: true,
    },
    qrCodeData: {
      type: String, // Unique identifier for QR verification
      unique: true,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for parent queries
childSchema.index({ parent: 1, isActive: 1 });
childSchema.index({ qrCodeData: 1 });

// Generate unique QR code before saving
childSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      // Generate unique QR data
      this.qrCodeData = `CHILD-${this._id}-${Date.now()}`;

      // Generate QR code image (base64)
      this.qrCode = await QRCode.toDataURL(this.qrCodeData, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Virtual for active subscriptions
childSchema.virtual("activeSubscriptions", {
  ref: "Subscription",
  localField: "_id",
  foreignField: "child",
  match: { status: "active" },
});

// Enable virtuals in JSON
childSchema.set("toJSON", { virtuals: true });
childSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Child", childSchema);
