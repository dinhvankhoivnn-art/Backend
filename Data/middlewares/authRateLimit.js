/**
 * Middleware giới hạn tốc độ request cho authentication
 * Ngăn chặn brute force attacks và spam đăng nhập
 */

const rateLimit = require("express-rate-limit");

/**
 * Rate limiter cho đăng nhập
 * Giới hạn 5 lần thử đăng nhập mỗi 15 phút từ cùng IP
 */
const authLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 5, // Giới hạn 5 request
  message: {
    success: false,
    message: "Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau 15 phút.",
    retryAfter: "15 phút",
  },
  standardHeaders: true, // Trả về rate limit info trong headers `RateLimit-*`
  legacyHeaders: false, // Tắt headers `X-RateLimit-*`
  skip: (req) => {
    // Bỏ qua rate limit cho admin (nếu cần)
    return req.user && req.user.role === "admin";
  },
  // Removed onLimitReached as it's deprecated in express-rate-limit v7
});

/**
 * Rate limiter cho đăng ký tài khoản
 * Giới hạn 3 lần đăng ký mỗi giờ từ cùng IP
 */
const authRegisterLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 3, // Giới hạn 3 request
  message: {
    success: false,
    message: "Quá nhiều lần đăng ký tài khoản. Vui lòng thử lại sau 1 giờ.",
    retryAfter: "1 giờ",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`🚫 Register rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      email: req.body?.email,
      timestamp: new Date().toISOString(),
    });

    res.status(429).json({
      success: false,
      message: "Quá nhiều request đăng ký. Vui lòng thử lại sau.",
      code: "REGISTER_RATE_LIMIT_EXCEEDED",
      retryAfter: "1 giờ",
    });
  },
});

/**
 * Rate limiter cho gửi mã xác minh
 * Giới hạn 3 lần gửi mỗi 10 phút từ cùng IP
 */
const authVerificationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 phút
  max: 3, // Giới hạn 3 request
  message: {
    success: false,
    message: "Quá nhiều lần gửi mã xác minh. Vui lòng thử lại sau 10 phút.",
    retryAfter: "10 phút",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`🚫 Verification rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      email: req.body?.email || req.body?.phone,
      timestamp: new Date().toISOString(),
    });
  },
});

/**
 * Rate limiter cho đổi mật khẩu
 * Giới hạn 3 lần đổi mật khẩu mỗi giờ cho mỗi user
 */
const authPasswordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 3,
  message: {
    success: false,
    message: "Quá nhiều lần yêu cầu đổi mật khẩu. Vui lòng thử lại sau 1 giờ.",
    retryAfter: "1 giờ",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Dùng user ID thay vì IP nếu đã đăng nhập
    return req.user?.id || req.ip;
  },
  handler: (req, res) => {
    console.warn(`🚫 Password reset rate limit exceeded:`, {
      userId: req.user?.id,
      email: req.user?.email,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
  },
});

/**
 * Rate limiter chung cho API authentication
 * Giới hạn 10 request mỗi phút cho mỗi IP
 */
const authApiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  max: 10,
  message: {
    success: false,
    message: "Quá nhiều request. Vui lòng thử lại sau 1 phút.",
    retryAfter: "1 phút",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Bỏ qua cho admin
    return req.user && req.user.role === "admin";
  },
  handler: (req, res) => {
    console.warn(`🚫 API rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      userId: req.user?.id,
      endpoint: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString(),
    });
  },
});

/**
 * Rate limiter nghiêm ngặt cho endpoint nhạy cảm
 * Giới hạn 3 request mỗi 5 phút
 */
const authSensitiveLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 phút
  max: 3,
  message: {
    success: false,
    message:
      "Quá nhiều request đến endpoint nhạy cảm. Vui lòng thử lại sau 5 phút.",
    retryAfter: "5 phút",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Dùng user ID + IP để tăng độ chính xác
    return `${req.user?.id || "anonymous"}_${req.ip}`;
  },
  handler: (req, res) => {
    console.error(`🚨 Sensitive endpoint rate limit exceeded:`, {
      userId: req.user?.id,
      email: req.user?.email,
      ip: req.ip,
      endpoint: req.originalUrl,
      method: req.method,
      userAgent: req.get("User-Agent"),
      timestamp: new Date().toISOString(),
    });
  },
});

module.exports = {
  authLoginLimiter,
  authRegisterLimiter,
  authVerificationLimiter,
  authPasswordResetLimiter,
  authApiLimiter,
  authSensitiveLimiter,
};
