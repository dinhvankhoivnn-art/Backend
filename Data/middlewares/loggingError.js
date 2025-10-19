/**
 * Middleware ghi log lỗi và exceptions
 * Theo dõi và phân tích các lỗi trong hệ thống
 */

const fs = require("fs").promises;
const path = require("path");

/**
 * Ghi log lỗi vào file
 * @param {string} level - Mức độ lỗi (error, warn, info)
 * @param {Error|string} error - Đối tượng lỗi hoặc message
 * @param {Object} context - Thông tin context bổ sung
 */
const logErrorToFile = async (level, error, context = {}) => {
  try {
    const logsDir = path.join(process.cwd(), "logs");
    await fs.mkdir(logsDir, { recursive: true });

    const timestamp = new Date().toISOString();
    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : null;

    const logEntry = {
      timestamp,
      level,
      message: errorMessage,
      stack: errorStack,
      ...context,
    };

    const filename = `errors_${new Date().toISOString().split("T")[0]}.log`;
    const filePath = path.join(logsDir, filename);

    await fs.appendFile(filePath, JSON.stringify(logEntry) + "\n", "utf8");
  } catch (fileError) {
    console.error("❌ Lỗi ghi log lỗi vào file:", fileError.message);
  }
};

/**
 * Middleware ghi log lỗi 404 - Not Found
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const loggingError404 = (req, res, next) => {
  // Ghi log 404 trước khi response
  console.warn(`🚫 404 Not Found: ${req.method} ${req.originalUrl}`, {
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get("User-Agent"),
    referer: req.get("Referer"),
    userId: req.user?.id,
    timestamp: new Date().toISOString(),
  });

  // Ghi vào file log
  logErrorToFile("warn", "404 Not Found", {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    referer: req.get("Referer"),
    userId: req.user?.id,
  });

  next();
};

/**
 * Middleware ghi log lỗi validation
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const loggingErrorValidation = (req, res, next) => {
  const originalJson = res.json;

  res.json = function (data) {
    // Kiểm tra nếu response là lỗi validation
    if (data.success === false && data.errors) {
      console.warn(`⚠️ Validation Error: ${req.method} ${req.originalUrl}`, {
        errors: data.errors,
        ip: req.ip,
        userId: req.user?.id,
        body: JSON.stringify(req.body).substring(0, 200),
      });

      // Ghi log validation errors
      logErrorToFile("warn", "Validation Error", {
        method: req.method,
        url: req.originalUrl,
        errors: data.errors,
        ip: req.ip,
        userId: req.user?.id,
        requestBody: req.body,
      });
    }

    return originalJson.call(this, data);
  };

  next();
};

/**
 * Middleware ghi log lỗi database
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const loggingErrorDatabase = (req, res, next) => {
  const originalJson = res.json;

  res.json = function (data) {
    // Kiểm tra lỗi database (status 500 với message chứa 'database' hoặc 'db')
    if (
      res.statusCode >= 500 &&
      data.message &&
      (data.message.toLowerCase().includes("database") ||
        data.message.toLowerCase().includes("db") ||
        data.message.toLowerCase().includes("mongodb"))
    ) {
      console.error(`💾 Database Error: ${req.method} ${req.originalUrl}`, {
        message: data.message,
        statusCode: res.statusCode,
        ip: req.ip,
        userId: req.user?.id,
      });

      logErrorToFile("error", "Database Error", {
        method: req.method,
        url: req.originalUrl,
        message: data.message,
        statusCode: res.statusCode,
        ip: req.ip,
        userId: req.user?.id,
        stack: data.stack,
      });
    }

    return originalJson.call(this, data);
  };

  next();
};

/**
 * Middleware ghi log lỗi authentication
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const loggingErrorAuth = (req, res, next) => {
  const originalJson = res.json;

  res.json = function (data) {
    // Kiểm tra lỗi auth (status 401, 403)
    if ([401, 403].includes(res.statusCode)) {
      const errorType =
        res.statusCode === 401
          ? "Authentication Failed"
          : "Authorization Failed";

      console.warn(`🔐 ${errorType}: ${req.method} ${req.originalUrl}`, {
        message: data.message,
        statusCode: res.statusCode,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        attemptedEmail: req.body?.email,
      });

      logErrorToFile("warn", errorType, {
        method: req.method,
        url: req.originalUrl,
        message: data.message,
        statusCode: res.statusCode,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        attemptedEmail: req.body?.email,
        userId: req.user?.id,
      });
    }

    return originalJson.call(this, data);
  };

  next();
};

/**
 * Middleware ghi log lỗi server (500)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const loggingErrorServer = (req, res, next) => {
  const originalJson = res.json;

  res.json = function (data) {
    // Kiểm tra lỗi server (status 500+)
    if (res.statusCode >= 500) {
      console.error(`💥 Server Error: ${req.method} ${req.originalUrl}`, {
        message: data.message,
        statusCode: res.statusCode,
        ip: req.ip,
        userId: req.user?.id,
        stack: data.stack,
      });

      logErrorToFile("error", "Server Error", {
        method: req.method,
        url: req.originalUrl,
        message: data.message,
        statusCode: res.statusCode,
        ip: req.ip,
        userId: req.user?.id,
        userAgent: req.get("User-Agent"),
        requestBody: req.body,
        requestQuery: req.query,
        stack: data.stack || new Error().stack,
      });
    }

    return originalJson.call(this, data);
  };

  next();
};

/**
 * Global error handler - ghi log tất cả errors chưa được xử lý
 * @param {Error} err - Error object
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const loggingErrorGlobal = (err, req, res, next) => {
  // Ghi log error chi tiết
  console.error(`💥 Unhandled Error: ${req.method} ${req.originalUrl}`, {
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode || 500,
    ip: req.ip,
    userId: req.user?.id,
    userAgent: req.get("User-Agent"),
  });

  logErrorToFile("error", err, {
    method: req.method,
    url: req.originalUrl,
    statusCode: err.statusCode || 500,
    ip: req.ip,
    userId: req.user?.id,
    userAgent: req.get("User-Agent"),
    requestBody: req.body,
    requestQuery: req.query,
    headers: req.headers,
  });

  // Gửi response lỗi
  res.status(err.statusCode || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Đã xảy ra lỗi server"
        : err.message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

/**
 * Middleware ghi log performance issues
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const loggingErrorPerformance = (req, res, next) => {
  const startTime = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - startTime;

    // Log nếu request quá chậm (> 5000ms)
    if (duration > 5000) {
      console.warn(`🐌 Performance Issue: ${req.method} ${req.originalUrl}`, {
        duration: `${duration}ms`,
        ip: req.ip,
        userId: req.user?.id,
      });

      logErrorToFile("warn", "Performance Issue", {
        method: req.method,
        url: req.originalUrl,
        duration: duration,
        ip: req.ip,
        userId: req.user?.id,
        userAgent: req.get("User-Agent"),
      });
    }
  });

  next();
};

module.exports = {
  loggingError404,
  loggingErrorValidation,
  loggingErrorDatabase,
  loggingErrorAuth,
  loggingErrorServer,
  loggingErrorGlobal,
  loggingErrorPerformance,
  logErrorToFile,
};
