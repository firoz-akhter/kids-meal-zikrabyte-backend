const authRoutes = require("./authRoutes");
const childRoutes = require("./childRoutes");
const subscriptionRoutes = require("./subscriptionRoutes");
const menuRoutes = require("./menuRoutes");
const deliveryRoutes = require("./deliveryRoutes");
const paymentRoutes = require("./paymentRoutes");
const dashboardRoutes = require("./dashboardRoutes");

const setupRoutes = (app) => {
  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/children", childRoutes);
  app.use("/api/subscriptions", subscriptionRoutes);
  app.use("/api/menus", menuRoutes);
  app.use("/api/deliveries", deliveryRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api/dashboard", dashboardRoutes);
};

module.exports = setupRoutes;
