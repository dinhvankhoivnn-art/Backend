const { body } = require("express-validator");

// Validation cho endpoint đăng nhập
const loginValidation = [
  // Kiểm tra email
  body("email")
    .notEmpty()
    .withMessage("Email là bắt buộc")
    .isEmail()
    .withMessage("Email không hợp lệ")
    .trim(),
  // Kiểm tra password
  body("password")
    .notEmpty()
    .withMessage("Mật khẩu là bắt buộc")
    .isLength({ min: 6 })
    .withMessage("Mật khẩu phải có ít nhất 6 ký tự"),
];

module.exports = {
  loginValidation,
};
