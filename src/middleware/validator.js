// Validation middleware for common requests

// Validate registration data
exports.validateRegister = (req, res, next) => {
  const { name, email, mobile, password } = req.body;

  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push("Name must be at least 2 characters long");
  }

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    errors.push("Please provide a valid email address");
  }

  if (!mobile || !/^[0-9]{10}$/.test(mobile)) {
    errors.push("Please provide a valid 10-digit mobile number");
  }

  if (!password || password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

// Validate login data
exports.validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Please provide email and password",
    });
  }

  next();
};

// Validate child data
exports.validateChild = (req, res, next) => {
  const { name, age, grade, deliveryLocation } = req.body;

  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push("Child name must be at least 2 characters long");
  }

  if (!age || age < 1 || age > 18) {
    errors.push("Child age must be between 1 and 18");
  }

  if (!grade || grade.trim().length === 0) {
    errors.push("Grade is required");
  }

  if (!deliveryLocation || deliveryLocation.trim().length === 0) {
    errors.push("Delivery location is required");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

// Validate subscription data
exports.validateSubscription = (req, res, next) => {
  const { childId, planType, mealType, paymentMethod } = req.body;

  const errors = [];

  if (!childId) {
    errors.push("Child ID is required");
  }

  if (!planType || !["weekly", "monthly"].includes(planType)) {
    errors.push("Plan type must be either 'weekly' or 'monthly'");
  }

  if (!mealType || !["lunch", "snacks"].includes(mealType)) {
    errors.push("Meal type must be either 'lunch' or 'snacks'");
  }

  if (
    !paymentMethod ||
    !["card", "upi", "netbanking", "wallet"].includes(paymentMethod)
  ) {
    errors.push("Payment method must be one of: card, upi, netbanking, wallet");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

// Validate menu data
exports.validateMenu = (req, res, next) => {
  const { weekStartDate, days } = req.body;

  const errors = [];

  if (!weekStartDate) {
    errors.push("Week start date is required");
  }

  if (!days || !Array.isArray(days) || days.length === 0) {
    errors.push("Days array is required and must not be empty");
  } else {
    days.forEach((day, index) => {
      if (!day.day || !day.date) {
        errors.push(`Day ${index + 1}: day and date are required`);
      }

      if (!day.mealType || !["lunch", "snacks"].includes(day.mealType)) {
        errors.push(`Day ${index + 1}: meal type must be 'lunch' or 'snacks'`);
      }

      if (!day.items || !Array.isArray(day.items) || day.items.length === 0) {
        errors.push(`Day ${index + 1}: items array is required`);
      }
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

// Validate MongoDB ObjectId
exports.validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName];

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`,
      });
    }

    next();
  };
};

// Validate pagination params
exports.validatePagination = (req, res, next) => {
  const { page, limit } = req.query;

  if (page && (isNaN(page) || parseInt(page) < 1)) {
    return res.status(400).json({
      success: false,
      message: "Page must be a positive number",
    });
  }

  if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
    return res.status(400).json({
      success: false,
      message: "Limit must be between 1 and 100",
    });
  }

  next();
};
