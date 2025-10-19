/**
 * File tiện ích cho authentication và authorization
 * Bao gồm các hàm hash password, tạo/verification JWT, và các tiện ích liên quan
 */

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
require("dotenv").config();

/**
 * Hàm hash mật khẩu sử dụng bcrypt
 * @param {string} password - Mật khẩu gốc cần hash
 * @returns {Promise<string>} Mật khẩu đã được hash
 */
const hashPassword = async (password) => {
  try {
    // Số vòng lặp hash (càng cao càng bảo mật nhưng chậm hơn)
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    console.error("❌ Lỗi khi hash mật khẩu:", error.message);
    throw new Error("Không thể hash mật khẩu");
  }
};

/**
 * Hàm so sánh mật khẩu với hash đã lưu
 * @param {string} password - Mật khẩu gốc
 * @param {string} hashedPassword - Mật khẩu đã hash trong DB
 * @returns {Promise<boolean>} True nếu khớp, false nếu không
 */
const comparePassword = async (password, hashedPassword) => {
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    console.error("❌ Lỗi khi so sánh mật khẩu:", error.message);
    throw new Error("Không thể xác minh mật khẩu");
  }
};

/**
 * Hàm tạo JWT token
 * @param {Object} payload - Dữ liệu cần mã hóa vào token
 * @param {string} expiresIn - Thời gian hết hạn (mặc định 7 ngày)
 * @returns {string} JWT token
 */
const generateToken = (payload, expiresIn = "7d") => {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET không được cấu hình");
    }

    const token = jwt.sign(payload, secret, {
      expiresIn: expiresIn,
      issuer: "backend-api",
      audience: "backend-users",
    });

    return token;
  } catch (error) {
    console.error("❌ Lỗi khi tạo JWT token:", error.message);
    throw new Error("Không thể tạo token xác thực");
  }
};

/**
 * Hàm xác minh và giải mã JWT token
 * @param {string} token - JWT token cần xác minh
 * @returns {Object} Payload đã giải mã hoặc null nếu token không hợp lệ
 */
const verifyToken = (token) => {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET không được cấu hình");
    }

    const decoded = jwt.verify(token, secret, {
      issuer: "backend-api",
      audience: "backend-users",
    });

    return decoded;
  } catch (error) {
    console.error("❌ Lỗi khi xác minh JWT token:", error.message);
    return null;
  }
};

/**
 * Hàm tạo refresh token (token dài hạn để làm mới access token)
 * @param {Object} payload - Dữ liệu cần mã hóa
 * @returns {string} Refresh token
 */
const generateRefreshToken = (payload) => {
  try {
    const secret = process.env.JWT_SECRET + "_refresh";
    const refreshToken = jwt.sign(payload, secret, {
      expiresIn: "30d", // Refresh token tồn tại 30 ngày
      issuer: "backend-api",
      audience: "backend-refresh",
    });

    return refreshToken;
  } catch (error) {
    console.error("❌ Lỗi khi tạo refresh token:", error.message);
    throw new Error("Không thể tạo refresh token");
  }
};

/**
 * Hàm xác minh refresh token
 * @param {string} refreshToken - Refresh token cần xác minh
 * @returns {Object} Payload đã giải mã hoặc null nếu không hợp lệ
 */
const verifyRefreshToken = (refreshToken) => {
  try {
    const secret = process.env.JWT_SECRET + "_refresh";
    const decoded = jwt.verify(refreshToken, secret, {
      issuer: "backend-api",
      audience: "backend-refresh",
    });

    return decoded;
  } catch (error) {
    console.error("❌ Lỗi khi xác minh refresh token:", error.message);
    return null;
  }
};

/**
 * Hàm tạo chuỗi ngẫu nhiên cho session secret hoặc CSRF token
 * @param {number} length - Độ dài của chuỗi (mặc định 32)
 * @returns {string} Chuỗi ngẫu nhiên hex
 */
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString("hex");
};

/**
 * Hàm tạo CSRF token
 * @returns {string} CSRF token
 */
const generateCSRFToken = () => {
  return generateRandomString(16);
};

/**
 * Hàm tạo session ID duy nhất
 * @returns {string} Session ID
 */
const generateSessionId = () => {
  const timestamp = Date.now().toString();
  const random = generateRandomString(16);
  return crypto
    .createHash("sha256")
    .update(timestamp + random)
    .digest("hex");
};

/**
 * Hàm kiểm tra định dạng email cơ bản
 * @param {string} email - Email cần kiểm tra
 * @returns {boolean} True nếu email hợp lệ
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Hàm kiểm tra độ mạnh của mật khẩu
 * @param {string} password - Mật khẩu cần kiểm tra
 * @returns {Object} {isValid: boolean, errors: string[]}
 */
const validatePasswordStrength = (password) => {
  const errors = [];
  const minLength = 8;

  if (!password || password.length < minLength) {
    errors.push(`Mật khẩu phải có ít nhất ${minLength} ký tự`);
  }

  if (!/(?=.*[a-z])/.test(password)) {
    errors.push("Mật khẩu phải chứa ít nhất một chữ cái thường");
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push("Mật khẩu phải chứa ít nhất một chữ cái hoa");
  }

  if (!/(?=.*\d)/.test(password)) {
    errors.push("Mật khẩu phải chứa ít nhất một chữ số");
  }

  if (!/(?=.*[@$!%*?&])/.test(password)) {
    errors.push("Mật khẩu phải chứa ít nhất một ký tự đặc biệt");
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
  };
};

/**
 * Hàm sanitize input để tránh XSS
 * @param {string} input - Chuỗi cần sanitize
 * @returns {string} Chuỗi đã được sanitize
 */
const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;

  return input
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, "")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .replace(/\\/g, "&#x5C;")
    .replace(/`/g, "&#x60;");
};

/**
 * Hàm tạo mã xác minh (OTP) ngẫu nhiên
 * @param {number} length - Độ dài mã OTP (mặc định 6)
 * @returns {string} Mã OTP
 */
const generateOTP = (length = 6) => {
  const digits = "0123456789";
  let otp = "";

  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }

  return otp;
};

// Export tất cả các hàm tiện ích
module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateRandomString,
  generateCSRFToken,
  generateSessionId,
  isValidEmail,
  validatePasswordStrength,
  sanitizeInput,
  generateOTP,
};
