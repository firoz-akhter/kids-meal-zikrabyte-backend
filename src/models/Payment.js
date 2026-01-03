const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      required: true,
      index: true,
    },
    child: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Child_profile",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ["card", "upi", "netbanking", "wallet"],
      required: true,
    },
    transactionId: {
      type: String,
      trim: true,
      index: true,
      sparse: true, // Allows multiple null values but unique non-null values
    },
    paymentGateway: {
      type: String,
      trim: true,
    },
    paymentDate: {
      type: Date,
    },
    // Breakdown of payment
    breakdown: {
      planType: String,
      mealType: String,
      duration: String,
      basePrice: Number,
      tax: Number,
      discount: Number,
      totalPrice: Number,
    },
    // For refunds
    // refundAmount: {
    //   type: Number,
    //   default: 0,
    // },
    // refundReason: {
    //   type: String,
    //   trim: true,
    // },
    // refundedAt: {
    //   type: Date,
    // },
    notes: {
      type: String,
      trim: true,
    },
    // For tracking payment attempts
    attempts: [
      {
        attemptedAt: {
          type: Date,
          default: Date.now,
        },
        status: String,
        errorMessage: String,
        gatewayResponse: mongoose.Schema.Types.Mixed,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
paymentSchema.index({ parent: 1, status: 1 });
paymentSchema.index({ subscription: 1 });
paymentSchema.index({ status: 1, paymentDate: 1 });
paymentSchema.index({ createdAt: -1 });

// // Method to mark payment as completed
// paymentSchema.methods.markCompleted = function (
//   transactionId,
//   gatewayResponse
// ) {
//   this.status = "completed";
//   this.paymentDate = new Date();
//   this.transactionId = transactionId;

//   this.attempts.push({
//     status: "completed",
//     gatewayResponse: gatewayResponse,
//   });

//   return this.save();
// };

// // Method to mark payment as failed
// paymentSchema.methods.markFailed = function (errorMessage, gatewayResponse) {
//   this.status = "failed";

//   this.attempts.push({
//     status: "failed",
//     errorMessage: errorMessage,
//     gatewayResponse: gatewayResponse,
//   });

//   return this.save();
// };

// // Method to process refund
// paymentSchema.methods.processRefund = function (amount, reason) {
//   if (this.status !== "completed") {
//     throw new Error("Can only refund completed payments");
//   }

//   if (amount > this.amount - this.refundAmount) {
//     throw new Error("Refund amount exceeds available balance");
//   }

//   this.refundAmount += amount;
//   this.refundReason = reason;
//   this.refundedAt = new Date();

//   if (this.refundAmount >= this.amount) {
//     this.status = "refunded";
//   }

//   return this.save();
// };

// // Static method to get payment summary for parent
// paymentSchema.statics.getParentPaymentSummary = async function (parentId) {
//   const summary = await this.aggregate([
//     {
//       $match: {
//         parent: mongoose.Types.ObjectId(parentId),
//       },
//     },
//     {
//       $group: {
//         _id: "$status",
//         count: { $sum: 1 },
//         totalAmount: { $sum: "$amount" },
//       },
//     },
//   ]);

//   return summary;
// };

// // Static method to get payment history with pagination
// paymentSchema.statics.getPaymentHistory = async function (
//   parentId,
//   page = 1,
//   limit = 10
// ) {
//   const skip = (page - 1) * limit;

//   const payments = await this.find({ parent: parentId })
//     .sort({ createdAt: -1 })
//     .skip(skip)
//     .limit(limit)
//     .populate("child", "name")
//     .populate("subscription", "planType mealType startDate endDate");

//   const total = await this.countDocuments({ parent: parentId });

//   return {
//     payments,
//     total,
//     page,
//     totalPages: Math.ceil(total / limit),
//   };
// };

module.exports = mongoose.model("Payment", paymentSchema);
