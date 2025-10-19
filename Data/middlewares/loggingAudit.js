/**
 * Middleware audit logging - ghi log kiểm tra chi tiết
 * Tuân thủ các yêu cầu compliance và security audit
 */

const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");

/**
 * Ghi audit log vào file với mã hóa
 * @param {string} eventType - Loại sự kiện
 * @param {Object} auditData - Dữ liệu audit
 */
const writeAuditLog = async (eventType, auditData) => {
  try {
    const logsDir = path.join(process.cwd(), "logs", "audit");
    await fs.mkdir(logsDir, { recursive: true });

    const timestamp = new Date().toISOString();
    const eventId = crypto.randomUUID();

    const auditEntry = {
      eventId,
      timestamp,
      eventType,
      ...auditData,
      checksum: crypto
        .createHash("sha256")
        .update(JSON.stringify({ eventId, timestamp, eventType, ...auditData }))
        .digest("hex"),
    };

    const filename = `audit_${new Date().toISOString().split("T")[0]}.log`;
    const filePath = path.join(logsDir, filename);

    await fs.appendFile(filePath, JSON.stringify(auditEntry) + "\n", "utf8");

    // Ghi log tóm tắt ra console
    console.log(`📋 Audit Log: ${eventType}`, {
      eventId,
      userId: auditData.userId,
      resource: auditData.resource,
      action: auditData.action,
    });
  } catch (error) {
    console.error("❌ Lỗi ghi audit log:", error.message);
  }
};

/**
 * Middleware audit cho authentication events
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const loggingAuditAuth = (req, res, next) => {
  const originalJson = res.json;

  res.json = function (data) {
    const authEvents = {
      200: "AUTH_SUCCESS",
      401: "AUTH_FAILED",
      403: "AUTH_FORBIDDEN",
    };

    const eventType = authEvents[res.statusCode];
    if (eventType) {
      const auditData = {
        userId: req.user?.id || null,
        userRole: req.user?.role || null,
        action: eventType,
        resource: "AUTHENTICATION",
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        attemptedEmail: req.body?.email,
        success: data.success || false,
        reason: data.message || null,
        sessionId: req.sessionID || null,
      };

      writeAuditLog(eventType, auditData);
    }

    return originalJson.call(this, data);
  };

  next();
};

/**
 * Middleware audit cho data access events
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const loggingAuditDataAccess = (req, res, next) => {
  const originalJson = res.json;

  res.json = function (data) {
    if (
      req.user &&
      (req.method === "GET" ||
        req.method === "POST" ||
        req.method === "PUT" ||
        req.method === "DELETE")
    ) {
      const resource = getResourceFromUrl(req.originalUrl);
      const action = getActionFromMethod(req.method, req.originalUrl);

      const auditData = {
        userId: req.user.id,
        userRole: req.user.role,
        action: action,
        resource: resource,
        resourceId: req.params.id || null,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        queryParams: req.query,
        requestBody: sanitizeAuditData(req.body),
        responseStatus: res.statusCode,
        success: data.success !== false,
        recordCount: data.data
          ? Array.isArray(data.data)
            ? data.data.length
            : 1
          : 0,
        sessionId: req.sessionID || null,
      };

      // Chỉ audit các truy cập nhạy cảm
      if (isSensitiveResource(resource) || req.user.role === "admin") {
        writeAuditLog("DATA_ACCESS", auditData);
      }
    }

    return originalJson.call(this, data);
  };

  next();
};

/**
 * Middleware audit cho admin actions
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const loggingAuditAdminActions = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    const originalJson = res.json;

    res.json = function (data) {
      const auditData = {
        userId: req.user.id,
        userRole: req.user.role,
        action: "ADMIN_ACTION",
        resource: getResourceFromUrl(req.originalUrl),
        resourceId: req.params.id || null,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        requestBody: sanitizeAuditData(req.body),
        responseStatus: res.statusCode,
        success: data.success !== false,
        adminAction: getAdminActionType(req.method, req.originalUrl),
        timestamp: new Date().toISOString(),
      };

      writeAuditLog("ADMIN_ACTION", auditData);

      return originalJson.call(this, data);
    };
  }

  next();
};

/**
 * Middleware audit cho security events
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const loggingAuditSecurity = (req, res, next) => {
  const originalJson = res.json;

  res.json = function (data) {
    // Audit các security events
    if (
      [401, 403, 429].includes(res.statusCode) ||
      data.code === "CSRF_INVALID"
    ) {
      const auditData = {
        userId: req.user?.id || null,
        action: "SECURITY_EVENT",
        resource: "SECURITY",
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        statusCode: res.statusCode,
        errorCode: data.code || null,
        errorMessage: data.message || null,
        attemptedAccess: data.message || null,
        riskLevel: getRiskLevel(res.statusCode, data),
        sessionId: req.sessionID || null,
      };

      writeAuditLog("SECURITY_EVENT", auditData);
    }

    return originalJson.call(this, data);
  };

  next();
};

/**
 * Middleware audit cho logout events
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const loggingAuditLogout = (req, res, next) => {
  const originalJson = res.json;

  res.json = function (data) {
    if (req.user && req.originalUrl.includes("logout")) {
      const auditData = {
        userId: req.user.id,
        userRole: req.user.role,
        action: "LOGOUT",
        resource: "SESSION",
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        logoutReason: req.body?.reason || "user_initiated",
        sessionDuration: req.sessionDuration || null,
        success: data.success !== false,
      };

      writeAuditLog("LOGOUT", auditData);
    }

    return originalJson.call(this, data);
  };

  next();
};

/**
 * Helper: Xác định resource từ URL
 * @param {string} url - Request URL
 * @returns {string} Resource name
 */
function getResourceFromUrl(url) {
  const urlLower = url.toLowerCase();

  if (urlLower.includes("/user")) return "USER";
  if (urlLower.includes("/event")) return "EVENT";
  if (urlLower.includes("/dashboard")) return "DASHBOARD";
  if (urlLower.includes("/login") || urlLower.includes("/auth"))
    return "AUTHENTICATION";
  if (urlLower.includes("/api/")) return "API";

  return "UNKNOWN";
}

/**
 * Helper: Xác định action từ method và URL
 * @param {string} method - HTTP method
 * @param {string} url - URL
 * @returns {string} Action name
 */
function getActionFromMethod(method, url) {
  const urlLower = url.toLowerCase();

  switch (method) {
    case "GET":
      return urlLower.includes("/all") ? "LIST_ALL" : "READ";
    case "POST":
      return "CREATE";
    case "PUT":
      return "UPDATE";
    case "DELETE":
      return "DELETE";
    default:
      return "UNKNOWN";
  }
}

/**
 * Helper: Kiểm tra resource nhạy cảm
 * @param {string} resource - Resource name
 * @returns {boolean} True nếu nhạy cảm
 */
function isSensitiveResource(resource) {
  const sensitiveResources = ["USER", "ADMIN", "SYSTEM"];
  return sensitiveResources.includes(resource);
}

/**
 * Helper: Xác định loại action admin
 * @param {string} method - HTTP method
 * @param {string} url - URL
 * @returns {string} Admin action type
 */
function getAdminActionType(method, url) {
  const urlLower = url.toLowerCase();

  if (urlLower.includes("/user") && method === "DELETE") return "USER_DELETION";
  if (urlLower.includes("/user") && method === "PUT")
    return "USER_MODIFICATION";
  if (urlLower.includes("/event") && method === "DELETE")
    return "EVENT_DELETION";
  if (urlLower.includes("/system")) return "SYSTEM_MAINTENANCE";

  return "GENERAL_ADMIN_ACTION";
}

/**
 * Helper: Xác định mức độ rủi ro
 * @param {number} statusCode - HTTP status code
 * @param {Object} data - Response data
 * @returns {string} Risk level
 */
function getRiskLevel(statusCode, data) {
  if (statusCode === 401) return "LOW";
  if (statusCode === 403) return "MEDIUM";
  if (statusCode === 429) return "MEDIUM";
  if (data.code === "CSRF_INVALID") return "HIGH";

  return "UNKNOWN";
}

/**
 * Helper: Sanitize dữ liệu cho audit log
 * @param {Object} data - Dữ liệu cần sanitize
 * @returns {Object} Dữ liệu đã sanitize
 */
function sanitizeAuditData(data) {
  if (!data || typeof data !== "object") return data;

  const sanitized = { ...data };
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
}

module.exports = {
  loggingAuditAuth,
  loggingAuditDataAccess,
  loggingAuditAdminActions,
  loggingAuditSecurity,
  loggingAuditLogout,
  writeAuditLog,
};
