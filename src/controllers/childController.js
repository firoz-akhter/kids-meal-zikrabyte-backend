const { Child, Subscription } = require("../models");

// @desc    Get all children for logged in parent
// @route   GET /api/children
// @access  Private (Parent)
exports.getChildren = async (req, res) => {
  try {
    const children = await Child.find({
      parent: req.user.id,
      isActive: true,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: children.length,
      data: { children },
    });
  } catch (error) {
    console.error("Get children error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get children",
    });
  }
};

// @desc    Get single child by ID
// @route   GET /api/children/:id
// @access  Private (Parent)
exports.getChild = async (req, res) => {
  try {
    const child = await Child.findOne({
      _id: req.params.id,
      parent: req.user.id,
    });

    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child not found",
      });
    }

    // Get active subscriptions for this child
    const activeSubscriptions = await Subscription.find({
      child: child._id,
      status: "active",
    });

    res.json({
      success: true,
      data: {
        child: {
          ...child.toObject(),
          activeSubscriptions,
        },
      },
    });
  } catch (error) {
    console.error("Get child error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get child",
    });
  }
};

// @desc    Add a new child
// @route   POST /api/children
// @access  Private (Parent)
exports.addChild = async (req, res) => {
  try {
    const { name, age, grade, allergies, foodPreference, deliveryLocation } =
      req.body;

    // Validate required fields
    if (!name || !age || !grade || !deliveryLocation) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide all required fields: name, age, grade, deliveryLocation",
      });
    }

    // Create child (QR code will be auto-generated in pre-save hook)
    const child = await Child.create({
      parent: req.user.id,
      name,
      age,
      grade,
      allergies: allergies || [],
      foodPreference: foodPreference || "veg",
      deliveryLocation,
    });

    res.status(201).json({
      success: true,
      message: "Child profile created successfully",
      data: { child },
    });
  } catch (error) {
    console.error("Add child error:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to add child",
    });
  }
};

// @desc    Update child details
// @route   PUT /api/children/:id
// @access  Private (Parent)
exports.updateChild = async (req, res) => {
  try {
    const { name, age, grade, allergies, foodPreference, deliveryLocation } =
      req.body;

    const child = await Child.findOne({
      _id: req.params.id,
      parent: req.user.id,
    });

    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child not found",
      });
    }

    // Update fields
    if (name) child.name = name;
    if (age) child.age = age;
    if (grade) child.grade = grade;
    if (allergies !== undefined) child.allergies = allergies;
    if (foodPreference) child.foodPreference = foodPreference;
    if (deliveryLocation) child.deliveryLocation = deliveryLocation;

    await child.save();

    res.json({
      success: true,
      message: "Child profile updated successfully",
      data: { child },
    });
  } catch (error) {
    console.error("Update child error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to update child",
    });
  }
};

// @desc    Delete child (soft delete)
// @route   DELETE /api/children/:id
// @access  Private (Parent)
exports.deleteChild = async (req, res) => {
  try {
    const child = await Child.findOne({
      _id: req.params.id,
      parent: req.user.id,
    });

    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child not found",
      });
    }

    // Check if child has active subscriptions
    const activeSubscriptions = await Subscription.countDocuments({
      child: child._id,
      status: "active",
    });

    if (activeSubscriptions > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete child with active subscriptions. Please cancel subscriptions first.",
      });
    }

    // Soft delete
    child.isActive = false;
    await child.save();

    res.json({
      success: true,
      message: "Child profile deleted successfully",
    });
  } catch (error) {
    console.error("Delete child error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete child",
    });
  }
};

// @desc    Get child's QR code
// @route   GET /api/children/:id/qr-code
// @access  Private (Parent)
exports.getQRCode = async (req, res) => {
  try {
    const child = await Child.findOne({
      _id: req.params.id,
      parent: req.user.id,
    });

    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child not found",
      });
    }

    res.json({
      success: true,
      data: {
        qrCode: child.qrCode,
        qrCodeData: child.qrCodeData,
        childName: child.name,
      },
    });
  } catch (error) {
    console.error("Get QR code error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get QR code",
    });
  }
};

// @desc    Verify QR code (for admin during delivery)
// @route   POST /api/children/verify-qr
// @access  Private (Admin)
exports.verifyQRCode = async (req, res) => {
  try {
    const { qrCodeData } = req.body;

    if (!qrCodeData) {
      return res.status(400).json({
        success: false,
        message: "QR code data is required",
      });
    }

    const child = await Child.findOne({ qrCodeData }).populate(
      "parent",
      "name email mobile"
    );

    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Invalid QR code",
      });
    }

    // Get active subscription
    const activeSubscription = await Subscription.findOne({
      child: child._id,
      status: "active",
    });

    res.json({
      success: true,
      data: {
        child: {
          id: child._id,
          name: child.name,
          age: child.age,
          grade: child.grade,
          deliveryLocation: child.deliveryLocation,
          foodPreference: child.foodPreference,
          allergies: child.allergies,
        },
        parent: child.parent,
        hasActiveSubscription: !!activeSubscription,
        subscription: activeSubscription,
      },
    });
  } catch (error) {
    console.error("Verify QR code error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to verify QR code",
    });
  }
};

// @desc    Get all children (Admin only)
// @route   GET /api/children/admin/all
// @access  Private (Admin)
exports.getAllChildren = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { deliveryLocation: { $regex: search, $options: "i" } },
      ];
    }

    if (status) {
      query.isActive = status === "active";
    }

    const skip = (page - 1) * limit;

    const children = await Child.find(query)
      .populate("parent", "name email mobile")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Child.countDocuments(query);

    res.json({
      success: true,
      count: children.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: { children },
    });
  } catch (error) {
    console.error("Get all children error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get children",
    });
  }
};
