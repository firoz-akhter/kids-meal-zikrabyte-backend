// routes/index.js
// Central export and mounting file for all routes

const express = require("express");
const router = express.Router();

const authRoutes = require("./authRoutes");
const childRoutes = require("./childRoutes");
const subscriptionRoutes = require("./subscriptionRoutes");
const menuRoutes = require("./menuRoutes");
const deliveryRoutes = require("./deliveryRoutes");
const paymentRoutes = require("./paymentRoutes");
const dashboardRoutes = require("./dashboardRoutes");

// Mount routes
router.use("/auth", authRoutes);
router.use("/children", childRoutes);
router.use("/subscriptions", subscriptionRoutes);
router.use("/menus", menuRoutes);
router.use("/deliveries", deliveryRoutes);
router.use("/payments", paymentRoutes);
router.use("/dashboard", dashboardRoutes);

// Health check route
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "API is running",
    timestamp: new Date(),
  });
});

module.exports = router;
