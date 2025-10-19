const express = require("express");
const { loginUser, registerUser } = require("../controllers/login.controller");
const { loginValidation } = require("../middlewares/loginValidation");
const { registerValidation } = require("../middlewares/registerValidation");
const {
  handleValidationErrors,
} = require("../middlewares/validationMiddleware");

const loginRouter = express.Router();

// Endpoint đăng nhập
loginRouter.post(
  "/login",
  [...loginValidation, handleValidationErrors],
  loginUser
);

// Endpoint đăng ký
loginRouter.post(
  "/register",
  [...registerValidation, handleValidationErrors],
  registerUser
);

module.exports = {
  loginRouter,
};
