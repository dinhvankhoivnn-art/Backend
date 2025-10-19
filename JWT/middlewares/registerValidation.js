const { body } = require("express-validator");

const registerValidation = [
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
];

module.exports = {
  registerValidation,
};
