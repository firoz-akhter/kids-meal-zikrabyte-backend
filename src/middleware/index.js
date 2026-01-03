// middleware/index.js
// Central export file for all middleware

const auth = require("./auth");
const {
  roleCheck,
  isParent,
  isAdmin,
  isParentOrAdmin,
} = require("./roleCheck");
const { errorHandler, notFound } = require("./errorHandler");
const validator = require("./validator");
// console.log("validator,,", validator);

module.exports = {
  auth,
  roleCheck,
  isParent,
  isAdmin,
  isParentOrAdmin,
  errorHandler,
  notFound,
  ...validator,
};
