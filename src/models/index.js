// models/index.js
// Central export file for all models

const User = require("./User");
const Child = require("./Child");
const Subscription = require("./Subscription");
const Menu = require("./Menu");
const Delivery = require("./Delivery");
const Payment = require("./Payment");

module.exports = {
  User,
  Child,
  Subscription,
  Menu,
  Delivery,
  Payment,
};
