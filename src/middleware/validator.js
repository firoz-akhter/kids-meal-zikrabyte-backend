const { body, param, query, validationResult } = require("express-validator");

// Middleware to check validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

// Auth Validators
const registerValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("mobile")
    .trim()
    .notEmpty()
    .withMessage("Mobile number is required")
    .matches(/^[0-9]{10}$/)
    .withMessage("Please provide a valid 10-digit mobile number"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),

  validate,
];

const loginValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email"),

  body("password").notEmpty().withMessage("Password is required"),

  validate,
];

const changePasswordValidator = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),

  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters"),

  validate,
];

// Child Validators
const addChildValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Child name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),

  body("age")
    .notEmpty()
    .withMessage("Age is required")
    .isInt({ min: 3, max: 18 })
    .withMessage("Age must be between 3 and 18"),

  body("grade").trim().notEmpty().withMessage("Grade is required"),

  body("deliveryLocation")
    .trim()
    .notEmpty()
    .withMessage("Delivery location is required"),

  body("foodPreference")
    .optional()
    .isIn(["veg", "non-veg", "veg-only"])
    .withMessage("Invalid food preference"),

  body("allergies")
    .optional()
    .isArray()
    .withMessage("Allergies must be an array"),

  validate,
];

const updateChildValidator = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),

  body("age")
    .optional()
    .isInt({ min: 3, max: 18 })
    .withMessage("Age must be between 3 and 18"),

  body("grade")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Grade cannot be empty"),

  body("deliveryLocation")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Delivery location cannot be empty"),

  body("foodPreference")
    .optional()
    .isIn(["veg", "non-veg", "veg-only"])
    .withMessage("Invalid food preference"),

  validate,
];

// Subscription Validators
const createSubscriptionValidator = [
  body("childId")
    .notEmpty()
    .withMessage("Child ID is required")
    .isMongoId()
    .withMessage("Invalid child ID"),

  body("planType")
    .notEmpty()
    .withMessage("Plan type is required")
    .isIn(["weekly", "monthly"])
    .withMessage("Plan type must be weekly or monthly"),

  body("mealType")
    .notEmpty()
    .withMessage("Meal type is required")
    .isIn(["lunch", "snacks", "both"])
    .withMessage("Meal type must be lunch, snacks, or both"),

  body("paymentMethod")
    .notEmpty()
    .withMessage("Payment method is required")
    .isIn(["card", "upi", "netbanking", "wallet", "cash"])
    .withMessage("Invalid payment method"),

  validate,
];

const calculatePriceValidator = [
  body("planType")
    .notEmpty()
    .withMessage("Plan type is required")
    .isIn(["weekly", "monthly"])
    .withMessage("Plan type must be weekly or monthly"),

  body("mealType")
    .notEmpty()
    .withMessage("Meal type is required")
    .isIn(["lunch", "snacks", "both"])
    .withMessage("Meal type must be lunch, snacks, or both"),

  validate,
];

// Menu Validators
const createMenuValidator = [
  body("weekStartDate")
    .notEmpty()
    .withMessage("Week start date is required")
    .isISO8601()
    .withMessage("Invalid date format"),

  body("days")
    .notEmpty()
    .withMessage("Menu days are required")
    .isObject()
    .withMessage("Days must be an object"),

  validate,
];

// Delivery Validators
const markDeliveredValidator = [
  body("comment")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Comment cannot exceed 500 characters"),

  body("qrScanned")
    .optional()
    .isBoolean()
    .withMessage("qrScanned must be a boolean"),

  validate,
];

const markMissedValidator = [
  body("reason")
    .notEmpty()
    .withMessage("Reason is required")
    .trim()
    .isLength({ max: 500 })
    .withMessage("Reason cannot exceed 500 characters"),

  validate,
];

const verifyAndDeliverValidator = [
  body("qrCodeData").notEmpty().withMessage("QR code data is required"),

  body("mealType")
    .notEmpty()
    .withMessage("Meal type is required")
    .isIn(["lunch", "snacks"])
    .withMessage("Meal type must be lunch or snacks"),

  body("comment")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Comment cannot exceed 500 characters"),

  validate,
];

// Payment Validators
const processPaymentValidator = [
  body("subscriptionId")
    .notEmpty()
    .withMessage("Subscription ID is required")
    .isMongoId()
    .withMessage("Invalid subscription ID"),

  body("paymentMethod")
    .notEmpty()
    .withMessage("Payment method is required")
    .isIn(["card", "upi", "netbanking", "wallet", "cash"])
    .withMessage("Invalid payment method"),

  validate,
];

// MongoDB ID Validator
const mongoIdValidator = (paramName = "id") => [
  param(paramName).isMongoId().withMessage(`Invalid ${paramName}`),

  validate,
];

// Query Validators
const paginationValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  validate,
];

const dateRangeValidator = [
  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid start date format"),

  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid end date format"),

  validate,
];

module.exports = {
  validate,

  // Auth
  registerValidator,
  loginValidator,
  changePasswordValidator,

  // Child
  addChildValidator,
  updateChildValidator,

  // Subscription
  createSubscriptionValidator,
  calculatePriceValidator,

  // Menu
  createMenuValidator,

  // Delivery
  markDeliveredValidator,
  markMissedValidator,
  verifyAndDeliverValidator,

  // Payment
  processPaymentValidator,

  // Common
  mongoIdValidator,
  paginationValidator,
  dateRangeValidator,
};
