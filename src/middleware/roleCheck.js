// Restrict access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`,
      });
    }

    next();
  };
};

// Check if user is parent
exports.isParent = (req, res, next) => {
  if (!req.user || req.user.role !== "parent") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Parents only.",
    });
  }
  next();
};

// Check if user is admin
exports.isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admins only.",
    });
  }
  next();
};

// Check if user is either parent or admin
exports.isParentOrAdmin = (req, res, next) => {
  if (!req.user || !["parent", "admin"].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Access denied.",
    });
  }
  next();
};
