const mongoose = require("mongoose");
const QRCode = require("qrcode");

const childSchema = new mongoose.Schema(
  {
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Parent reference is required"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Child name is required"],
      trim: true,
    },
    age: {
      type: Number,
      required: [true, "Age is required"],
      min: [3, "Age must be at least 3"],
      max: [18, "Age must be less than 18"],
    },
    grade: {
      type: String,
      required: [true, "Grade is required"],
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
      required: true,
    },
    deliveryLocation: {
      type: String,
      required: [true, "Delivery location (school) is required"],
      trim: true,
    },
    qrCode: {
      code: {
        type: String,
        unique: true,
        sparse: true, // Allows multiple null values but unique non-null values
      },
      image: {
        type: String, // Base64 encoded QR code image
      },
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
childSchema.index({ "qrCode.code": 1 });

// Generate unique QR code before saving
childSchema.pre("save", async function () {
  // Only generate QR code for new documents
  if (this.isNew && !this.qrCode?.code) {
    try {
      // Ensure _id exists (create it if not present)
      if (!this._id) {
        this._id = new mongoose.Types.ObjectId();
      }

      // Generate unique QR code data
      const qrCodeData = `CHILD-${this._id.toString()}-${Date.now()}`;

      // Generate QR code image (base64)
      const qrCodeImage = await QRCode.toDataURL(qrCodeData, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      // Set qrCode object
      this.qrCode = {
        code: qrCodeData,
        image: qrCodeImage,
      };
    } catch (error) {
      console.error("Error generating QR code:", error);
      throw new Error("Failed to generate QR code");
    }
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

module.exports = mongoose.model("Child_profile", childSchema);
