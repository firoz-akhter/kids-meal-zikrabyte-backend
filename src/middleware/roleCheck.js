// Check if user has required role
const roleCheck = (...roles) => {
  // console.log("inside isAdmin");
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Please login first.",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This route requires ${roles.join(
          " or "
        )} role.`,
      });
    }
    // console.log("after roll check,,");
    next();
  };
};

// Shorthand middleware for common roles
const isParent = roleCheck("parent");
const isAdmin = roleCheck("admin");
const isParentOrAdmin = roleCheck("parent", "admin");

module.exports = {
  roleCheck,
  isParent,
  isAdmin,
  isParentOrAdmin,
};
