const { body, param, query } = require("express-validator");
const mongoose = require("mongoose");

// Validation cho endpoint getAllUser
const getAllUserValidation = [];

// Validation cho endpoint getUserForID
const getUserForIDValidation = [
  param("id")
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("ID không hợp lệ"),
];

// Validation cho endpoint createUserNew
const createUserValidation = [
  body("name")
    .notEmpty()
    .withMessage("Tên là bắt buộc")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Tên phải có từ 2 đến 50 ký tự"),
  body("age")
    .notEmpty()
    .withMessage("Tuổi là bắt buộc")
    .isInt({ min: 18, max: 80 })
    .withMessage("Tuổi phải là số từ 18 đến 80"),
  body("phone")
    .notEmpty()
    .withMessage("Số điện thoại là bắt buộc")
    .matches(/^\d{10,11}$/)
    .withMessage("Số điện thoại phải có 10-11 chữ số"),
  body("email")
    .notEmpty()
    .withMessage("Email là bắt buộc")
    .isEmail()
    .withMessage("Email không hợp lệ")
    .trim(),
  body("password")
    .notEmpty()
    .withMessage("Mật khẩu là bắt buộc")
    .isLength({ min: 6 })
    .withMessage("Mật khẩu phải có ít nhất 6 ký tự"),
  body("role")
    .optional()
    .isIn(["admin", "user"])
    .withMessage("Role phải là 'admin' hoặc 'user'"),
];

// Validation cho endpoint updateUserForID
const updateUserValidation = [
  param("id")
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("ID không hợp lệ"),
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Tên phải có từ 2 đến 50 ký tự"),
  body("age")
    .optional()
    .isInt({ min: 18, max: 80 })
    .withMessage("Tuổi phải là số từ 18 đến 80"),
  body("phone")
    .optional()
    .matches(/^\d{10,11}$/)
    .withMessage("Số điện thoại phải có 10-11 chữ số"),
  body("email").optional().isEmail().withMessage("Email không hợp lệ").trim(),
  body("password")
    .optional()
    .isLength({ min: 6 })
    .withMessage("Mật khẩu phải có ít nhất 6 ký tự"),
  body("role")
    .optional()
    .isIn(["admin", "user"])
    .withMessage("Role phải là 'admin' hoặc 'user'"),
];

// Validation cho endpoint deleteUserForID
const deleteUserValidation = [
  param("id")
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("ID không hợp lệ"),
];

// Validation cho endpoint searchUser
const searchUserValidation = [
  query("query")
    .notEmpty()
    .withMessage("Từ khóa tìm kiếm là bắt buộc")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Từ khóa tìm kiếm phải có từ 1 đến 50 ký tự"),
];

module.exports = {
  getAllUserValidation,
  getUserForIDValidation,
  createUserValidation,
  updateUserValidation,
  deleteUserValidation,
  searchUserValidation,
};
