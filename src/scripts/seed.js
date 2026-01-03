require("dotenv").config();
const mongoose = require("mongoose");
const { User } = require("../src/models");

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB Connected");

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      email: process.env.ADMIN_EMAIL || "admin@kidsmeals.com",
    });

    if (existingAdmin) {
      console.log("⚠️  Admin user already exists");
      console.log("Email:", existingAdmin.email);
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      name: "Admin User",
      email: process.env.ADMIN_EMAIL || "admin@kidsmeals.com",
      mobile: process.env.ADMIN_MOBILE || "9999999999",
      password: process.env.ADMIN_PASSWORD || "Admin@123",
      role: "admin",
    });

    console.log("=".repeat(50) + "\n");
    console.log("✅ Admin User Created Successfully!");
    console.log("Email:", admin.email);
    console.log("Password:", process.env.ADMIN_PASSWORD || "Admin@123");
    console.log("Mobile:", admin.mobile);
    console.log("Role:", admin.role);
    console.log("=".repeat(50) + "\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

seedAdmin();
