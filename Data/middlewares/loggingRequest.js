/**
 * Middleware ghi log tất cả HTTP requests
 * Theo dõi traffic, performance và patterns
 */

const fs = require("fs").promises;
const path = require("path");

/**
 * Tạo thư mục logs nếu chưa tồn tại
 */
const ensureLogsDirectory = async () => {
  const logsDir = path.join(process.cwd(), "logs");
  try {
    await fs.access(logsDir);
  } catch {
    await fs.mkdir(logsDir, { recursive: true });
  }
  return logsDir;
};

/**
 * Ghi log vào file
 * @param {string} filename - Tên file log
 * @param {Object} data - Dữ liệu cần ghi
 */
const writeLogToFile = async (filename, data) => {
  try {
    const logsDir = await ensureLogsDirectory();
    const filePath = path.join(logsDir, filename);
    const timestamp = new Date().toISOString();
    const logEntry =
      JSON.stringify({
        timestamp,
        ...data,
      }) + "\n";

    await fs.appendFile(filePath, logEntry, "utf8");
  } catch (error) {
    console.error("❌ Lỗi ghi log vào file:", error.message);
  }
};

/**
 * Middleware ghi log request cơ bản
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const loggingRequestBasic = (req, res, next) => {
  const startTime = Date.now();

  // Ghi log khi request bắt đầu
  console.log(`📨 ${req.method} ${req.originalUrl}`, {
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get("User-Agent")?.substring(0, 50),
    userId: req.user?.id,
    timestamp: new Date().toISOString(),
  });

  // Ghi log khi response hoàn thành
  res.on("finish", () => {
    const duration = Date.now() - startTime;

    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get("User-Agent"),
      userId: req.user?.id,
      userRole: req.user?.role,
      referer: req.get("Referer"),
      contentLength: res.get("Content-Length"),
      timestamp: new Date().toISOString(),
    };

    console.log(
      `📤 ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`,
      {
        ip: logData.ip,
        userId: logData.userId,
      }
    );

    // Ghi log chi tiết vào file cho production
    if (process.env.NODE_ENV === "production") {
      writeLogToFile("requests.log", logData);
    }
  });

  next();
};

/**
 * Middleware ghi log request chi tiết (bao gồm body/query)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const loggingRequestDetailed = (req, res, next) => {
  const startTime = Date.now();

  // Sanitize sensitive data trước khi log
  const sanitizeForLog = (obj) => {
    if (!obj || typeof obj !== "object") return obj;

    const sanitized = { ...obj };
    const sensitiveKeys = [
      "password",
      "pass",
      "token",
      "secret",
      "key",
      "authorization",
    ];

    sensitiveKeys.forEach((key) => {
      if (sanitized[key]) {
        sanitized[key] = "[REDACTED]";
      }
    });

    return sanitized;
  };

  const requestData = {
    method: req.method,
    url: req.originalUrl,
    headers: req.headers,
    query: sanitizeForLog(req.query),
    params: req.params,
    body: sanitizeForLog(req.body),
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    userId: req.user?.id,
    timestamp: new Date().toISOString(),
  };

  // Ghi log request vào file
  writeLogToFile("requests_detailed.log", requestData);

  // Ghi log response
  res.on("finish", () => {
    const duration = Date.now() - startTime;

    const responseData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userId: req.user?.id,
      timestamp: new Date().toISOString(),
    };

    writeLogToFile("responses.log", responseData);
  });

  next();
};

/**
 * Middleware ghi log performance của requests
 * Theo dõi các request chậm
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const loggingRequestPerformance = (req, res, next) => {
  const startTime = Date.now();
  const startMemory = process.memoryUsage();

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const endMemory = process.memoryUsage();
    const memoryDelta = {
      rss: endMemory.rss - startMemory.rss,
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      heapTotal: endMemory.heapTotal - startMemory.heapTotal,
    };

    const perfData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: duration,
      memoryDelta: memoryDelta,
      ip: req.ip,
      userId: req.user?.id,
      timestamp: new Date().toISOString(),
    };

    // Log performance cho các request chậm (> 1000ms)
    if (duration > 1000) {
      console.warn(`🐌 Slow request detected:`, {
        method: req.method,
        url: req.originalUrl,
        duration: `${duration}ms`,
        ip: req.ip,
        userId: req.user?.id,
      });

      writeLogToFile("slow_requests.log", perfData);
    }

    // Ghi log performance tổng quát
    writeLogToFile("performance.log", perfData);
  });

  next();
};

/**
 * Middleware ghi log security events
 * Theo dõi các hoạt động bảo mật đáng ngờ
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const loggingRequestSecurity = (req, res, next) => {
  const securityEvents = [];

  // Kiểm tra các patterns đáng ngờ
  const suspiciousPatterns = {
    sqlInjection: [
      /(\bunion\b|\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b)/i,
      /(\bor\b|\band\b)\s+\d+\s*=\s*\d+/i,
    ],
    xss: [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /onload=|onerror=|onclick=/i,
    ],
    pathTraversal: [/\.\.\//, /\/etc\/passwd/i, /\.\./],
  };

  // Kiểm tra trong query, body, params
  const checkForSuspiciousContent = (obj, location) => {
    if (!obj || typeof obj !== "object") return;

    const str = JSON.stringify(obj);

    Object.entries(suspiciousPatterns).forEach(([type, patterns]) => {
      patterns.forEach((pattern) => {
        if (pattern.test(str)) {
          securityEvents.push({
            type: type,
            pattern: pattern.toString(),
            location: location,
            content: str.substring(0, 200) + "...",
            ip: req.ip,
            userAgent: req.get("User-Agent"),
            userId: req.user?.id,
          });
        }
      });
    });
  };

  checkForSuspiciousContent(req.query, "query");
  checkForSuspiciousContent(req.body, "body");
  checkForSuspiciousContent(req.params, "params");

  // Kiểm tra brute force patterns
  const recentRequests = req.app.locals.recentRequests || new Map();
  const clientKey = req.ip;
  const now = Date.now();

  if (!recentRequests.has(clientKey)) {
    recentRequests.set(clientKey, []);
  }

  const clientRequests = recentRequests.get(clientKey);
  clientRequests.push(now);

  // Giữ chỉ 1 phút gần nhất
  const oneMinuteAgo = now - 60000;
  const recentCount = clientRequests.filter(
    (time) => time > oneMinuteAgo
  ).length;

  if (recentCount > 50) {
    // > 50 requests/phút
    securityEvents.push({
      type: "brute_force",
      count: recentCount,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });
  }

  // Cập nhật recent requests
  req.app.locals.recentRequests = recentRequests;

  // Log security events
  securityEvents.forEach((event) => {
    console.error(`🚨 Security event detected:`, event);
    writeLogToFile("security_events.log", {
      ...event,
      method: req.method,
      url: req.originalUrl,
      timestamp: new Date().toISOString(),
    });
  });

  next();
};

/**
 * Middleware ghi log API usage patterns
 * Phân tích cách sử dụng API
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const loggingRequestApiUsage = (req, res, next) => {
  res.on("finish", () => {
    const usageData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      ip: req.ip,
      userId: req.user?.id,
      userRole: req.user?.role,
      userAgent: req.get("User-Agent"),
      timestamp: new Date().toISOString(),
      hour: new Date().getHours(),
      day: new Date().getDay(),
      endpoint: req.originalUrl.split("?")[0], // Loại bỏ query params
    };

    // Ghi log usage cho analytics
    writeLogToFile("api_usage.log", usageData);
  });

  next();
};

module.exports = {
  loggingRequestBasic,
  loggingRequestDetailed,
  loggingRequestPerformance,
  loggingRequestSecurity,
  loggingRequestApiUsage,
};
