// controllers/index.js
// Central export file for all controllers

const authController = require("./authController");
const childController = require("./childController");
const subscriptionController = require("./subscriptionController");
const menuController = require("./menuController");
const deliveryController = require("./deliveryController");
const paymentController = require("./paymentController");
const dashboardController = require("./dashboardController");

module.exports = {
  authController,
  childController,
  subscriptionController,
  menuController,
  deliveryController,
  paymentController,
  dashboardController,
};
