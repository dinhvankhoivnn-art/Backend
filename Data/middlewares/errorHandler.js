/**
 * Middleware xử lý lỗi tổng hợp
 * Centralized error handling cho toàn bộ ứng dụng
 */

const { logErrorToFile } = require("./loggingError");

/**
 * Middleware xử lý lỗi validation
 * @param {Error} err - Error object
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const errorHandlerValidation = (err, req, res, next) => {
  if (err.name === "ValidationError") {
    // Mongoose validation error
    const errors = Object.values(err.errors).map((error) => ({
      field: error.path,
      message: error.message,
      value: error.value,
    }));

    console.warn(`⚠️ Validation Error:`, {
      url: req.originalUrl,
      method: req.method,
      errors: errors.map((e) => `${e.field}: ${e.message}`),
    });

    return res.status(400).json({
      success: false,
      message: "Dữ liệu đầu vào không hợp lệ",
      errors: errors,
      code: "VALIDATION_ERROR",
    });
  }

  next(err);
};

/**
 * Middleware xử lý lỗi database
 * @param {Error} err - Error object
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const errorHandlerDatabase = (err, req, res, next) => {
  if (err.name === "MongoError" || err.name === "MongoServerError") {
    let statusCode = 500;
    let message = "Lỗi cơ sở dữ liệu";

    // Xử lý các loại lỗi MongoDB cụ thể
    switch (err.code) {
      case 11000: // Duplicate key error
        statusCode = 409;
        message = "Dữ liệu đã tồn tại";
        break;
      case 121: // Document failed validation
        statusCode = 400;
        message = "Dữ liệu không hợp lệ";
        break;
      default:
        statusCode = 500;
        message = "Lỗi cơ sở dữ liệu";
    }

    console.error(`💾 Database Error [${err.code}]:`, {
      url: req.originalUrl,
      method: req.method,
      error: err.message,
      code: err.code,
    });

    // Log lỗi database
    logErrorToFile("error", err, {
      url: req.originalUrl,
      method: req.method,
      userId: req.user?.id,
      ip: req.ip,
    });

    return res.status(statusCode).json({
      success: false,
      message: message,
      code: "DATABASE_ERROR",
      ...(process.env.NODE_ENV === "development" && { details: err.message }),
    });
  }

  next(err);
};

/**
 * Middleware xử lý lỗi JWT
 * @param {Error} err - Error object
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const errorHandlerJwt = (err, req, res, next) => {
  if (err.name === "JsonWebTokenError") {
    console.warn(`🔐 JWT Error:`, {
      url: req.originalUrl,
      method: req.method,
      error: err.message,
      ip: req.ip,
    });

    return res.status(401).json({
      success: false,
      message: "Token không hợp lệ",
      code: "INVALID_TOKEN",
    });
  }

  if (err.name === "TokenExpiredError") {
    console.warn(`⏰ JWT Expired:`, {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
    });

    return res.status(401).json({
      success: false,
      message: "Token đã hết hạn",
      code: "TOKEN_EXPIRED",
    });
  }

  next(err);
};

/**
 * Middleware xử lý lỗi authorization
 * @param {Error} err - Error object
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const errorHandlerAuth = (err, req, res, next) => {
  if (err.message && err.message.includes("authorization")) {
    console.warn(`🚫 Authorization Error:`, {
      url: req.originalUrl,
      method: req.method,
      userId: req.user?.id,
      userRole: req.user?.role,
      ip: req.ip,
    });

    return res.status(403).json({
      success: false,
      message: "Không có quyền truy cập",
      code: "AUTHORIZATION_ERROR",
      requiredRole: err.requiredRole || "unknown",
    });
  }

  next(err);
};

/**
 * Middleware xử lý lỗi rate limit
 * @param {Error} err - Error object
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const errorHandlerRateLimit = (err, req, res, next) => {
  // Rate limit errors thường được xử lý bởi express-rate-limit middleware
  // Đây là fallback handler
  if (err.message && err.message.includes("rate limit")) {
    console.warn(`🚦 Rate Limit Error:`, {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userId: req.user?.id,
    });

    return res.status(429).json({
      success: false,
      message: "Quá nhiều request. Vui lòng thử lại sau.",
      code: "RATE_LIMIT_ERROR",
      retryAfter: res.get("Retry-After") || "60",
    });
  }

  next(err);
};

/**
 * Middleware xử lý lỗi file upload
 * @param {Error} err - Error object
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const errorHandlerFileUpload = (err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      success: false,
      message: "File quá lớn",
      code: "FILE_TOO_LARGE",
    });
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({
      success: false,
      message: "Loại file không được phép",
      code: "INVALID_FILE_TYPE",
    });
  }

  next(err);
};

/**
 * Global error handler - xử lý tất cả lỗi chưa được xử lý
 * @param {Error} err - Error object
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const errorHandlerGlobal = (err, req, res, next) => {
  // Log lỗi chi tiết
  console.error(`💥 Unhandled Error:`, {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
    userAgent: req.get("User-Agent"),
    timestamp: new Date().toISOString(),
  });

  // Log lỗi vào file
  logErrorToFile("error", err, {
    url: req.originalUrl,
    method: req.method,
    userId: req.user?.id,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    requestBody: req.body,
    requestQuery: req.query,
  });

  // Xóa cookie nếu có lỗi auth
  if (
    err.message &&
    (err.message.includes("token") || err.message.includes("auth"))
  ) {
    res.clearCookie("token");
  }

  // Gửi response lỗi
  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "Đã xảy ra lỗi server"
      : err.message;

  res.status(statusCode).json({
    success: false,
    message: message,
    code: "INTERNAL_ERROR",
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      details: err.message,
    }),
  });
};

/**
 * Middleware xử lý lỗi async
 * Wrap async functions để catch errors
 * @param {Function} fn - Async function cần wrap
 * @returns {Function} Wrapped function
 */
const errorHandlerAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Middleware xử lý lỗi 404 - Not Found
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const errorHandler404 = (req, res, next) => {
  console.warn(`🚫 404 Not Found:`, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    userId: req.user?.id,
  });

  res.status(404).json({
    success: false,
    message: "Endpoint không tồn tại",
    code: "NOT_FOUND",
    requestedUrl: req.originalUrl,
    method: req.method,
  });
};

/**
 * Middleware xử lý lỗi CSRF
 * @param {Error} err - Error object
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const errorHandlerCsrf = (err, req, res, next) => {
  if (err.code === "EBADCSRFTOKEN") {
    console.warn(`🔒 CSRF Error:`, {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userId: req.user?.id,
    });

    return res.status(403).json({
      success: false,
      message: "CSRF token không hợp lệ",
      code: "CSRF_ERROR",
    });
  }

  next(err);
};

module.exports = {
  errorHandlerValidation,
  errorHandlerDatabase,
  errorHandlerJwt,
  errorHandlerAuth,
  errorHandlerRateLimit,
  errorHandlerFileUpload,
  errorHandlerGlobal,
  errorHandlerAsync,
  errorHandler404,
  errorHandlerCsrf,
};
