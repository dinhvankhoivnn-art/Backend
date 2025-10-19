/**
 * Middleware ghi log hoạt động user chi tiết
 * Theo dõi các hành động quan trọng của user
 */

const fs = require("fs").promises;
const path = require("path");

/**
 * Ghi log hoạt động vào file
 * @param {string} action - Tên hành động
 * @param {Object} details - Chi tiết hoạt động
 */
const logActivityToFile = async (action, details) => {
  try {
    const logsDir = path.join(process.cwd(), "logs");
    await fs.mkdir(logsDir, { recursive: true });

    const filename = `activity_${new Date().toISOString().split("T")[0]}.log`;
    const filePath = path.join(logsDir, filename);

    const logEntry =
      JSON.stringify({
        timestamp: new Date().toISOString(),
        action,
        ...details,
      }) + "\n";

    await fs.appendFile(filePath, logEntry, "utf8");
  } catch (error) {
    console.error("❌ Lỗi ghi log hoạt động:", error.message);
  }
};

/**
 * Middleware ghi log hoạt động CRUD
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const loggingActivityCrud = (req, res, next) => {
  const originalJson = res.json;

  res.json = function (data) {
    // Chỉ log khi thành công
    if (data.success && res.statusCode >= 200 && res.statusCode < 300) {
      const action = getCrudAction(req.method, req.originalUrl);

      if (action) {
        const activityData = {
          userId: req.user?.id,
          userRole: req.user?.role,
          action: action,
          resource: getResourceFromUrl(req.originalUrl),
          resourceId: req.params.id,
          method: req.method,
          url: req.originalUrl,
          ip: req.ip,
          userAgent: req.get("User-Agent"),
          requestBody: sanitizeForLog(req.body),
          responseData: data.data ? "Success" : "No data",
          timestamp: new Date().toISOString(),
        };

        console.log(`📝 CRUD Activity: ${action} ${activityData.resource}`, {
          userId: activityData.userId,
          resourceId: activityData.resourceId,
          ip: activityData.ip,
        });

        logActivityToFile(action, activityData);
      }
    }

    return originalJson.call(this, data);
  };

  next();
};

/**
 * Middleware ghi log thay đổi dữ liệu nhạy cảm
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const loggingActivityDataChanges = (req, res, next) => {
  // Lưu dữ liệu gốc trước khi thay đổi
  const originalData = { ...req.body };

  const originalJson = res.json;

  res.json = function (data) {
    if (data.success && ["PUT", "PATCH"].includes(req.method)) {
      const sensitiveFields = ["password", "email", "role", "status"];
      const hasSensitiveChanges = sensitiveFields.some(
        (field) => originalData[field] !== undefined
      );

      if (hasSensitiveChanges) {
        const activityData = {
          userId: req.user?.id,
          userRole: req.user?.role,
          action: "DATA_CHANGE_SENSITIVE",
          resource: getResourceFromUrl(req.originalUrl),
          resourceId: req.params.id,
          changedFields: sensitiveFields.filter(
            (field) => originalData[field] !== undefined
          ),
          method: req.method,
          url: req.originalUrl,
          ip: req.ip,
          userAgent: req.get("User-Agent"),
          timestamp: new Date().toISOString(),
        };

        console.warn(`🔐 Sensitive Data Change:`, {
          userId: activityData.userId,
          resource: activityData.resource,
          resourceId: activityData.resourceId,
          changedFields: activityData.changedFields,
        });

        logActivityToFile("SENSITIVE_DATA_CHANGE", activityData);
      }
    }

    return originalJson.call(this, data);
  };

  next();
};

/**
 * Middleware ghi log truy cập admin
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const loggingActivityAdminAccess = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    const activityData = {
      userId: req.user.id,
      userRole: req.user.role,
      action: "ADMIN_ACCESS",
      resource: getResourceFromUrl(req.originalUrl),
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      timestamp: new Date().toISOString(),
    };

    console.log(`👑 Admin Access: ${req.user.email}`, {
      action: activityData.action,
      resource: activityData.resource,
      method: activityData.method,
    });

    logActivityToFile("ADMIN_ACCESS", activityData);
  }

  next();
};

/**
 * Middleware ghi log truy cập tài nguyên
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const loggingActivityResourceAccess = (req, res, next) => {
  res.on("finish", () => {
    const activityData = {
      userId: req.user?.id,
      userRole: req.user?.role,
      action: "RESOURCE_ACCESS",
      resource: getResourceFromUrl(req.originalUrl),
      resourceId: req.params.id,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      timestamp: new Date().toISOString(),
    };

    // Chỉ log truy cập thành công hoặc lỗi authorization
    if (res.statusCode < 400 || res.statusCode === 403) {
      logActivityToFile("RESOURCE_ACCESS", activityData);
    }
  });

  next();
};

/**
 * Middleware ghi log download/uploads
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const loggingActivityFileOperations = (req, res, next) => {
  const originalSend = res.send;
  const originalSendFile = res.sendFile;

  // Override sendFile method
  res.sendFile = function (filePath, options, callback) {
    const activityData = {
      userId: req.user?.id,
      userRole: req.user?.role,
      action: "FILE_DOWNLOAD",
      filePath: filePath,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      timestamp: new Date().toISOString(),
    };

    console.log(`📁 File Download:`, {
      userId: activityData.userId,
      filePath: path.basename(filePath),
    });

    logActivityToFile("FILE_DOWNLOAD", activityData);

    return originalSendFile.call(this, filePath, options, callback);
  };

  // Ghi log upload (từ multer hoặc similar)
  if (req.files || req.file) {
    const activityData = {
      userId: req.user?.id,
      userRole: req.user?.role,
      action: "FILE_UPLOAD",
      fileCount: req.files ? req.files.length : 1,
      fileNames: req.files
        ? req.files.map((f) => f.originalname)
        : [req.file.originalname],
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      timestamp: new Date().toISOString(),
    };

    console.log(`📤 File Upload:`, {
      userId: activityData.userId,
      fileCount: activityData.fileCount,
    });

    logActivityToFile("FILE_UPLOAD", activityData);
  }

  res.on("finish", () => {
    return originalSend.apply(this, arguments);
  });

  next();
};

/**
 * Helper: Xác định action CRUD từ method và URL
 * @param {string} method - HTTP method
 * @param {string} url - Request URL
 * @returns {string|null} Action name
 */
function getCrudAction(method, url) {
  const urlLower = url.toLowerCase();

  if (
    method === "POST" &&
    (urlLower.includes("/user") || urlLower.includes("/event"))
  ) {
    return "CREATE";
  }
  if (method === "GET" && urlLower.includes("/all")) {
    return "READ_ALL";
  }
  if (method === "GET" && /\w+/.test(url.split("/").pop())) {
    return "READ_ONE";
  }
  if (method === "PUT") {
    return "UPDATE";
  }
  if (method === "DELETE") {
    return "DELETE";
  }

  return null;
}

/**
 * Helper: Xác định resource từ URL
 * @param {string} url - Request URL
 * @returns {string} Resource name
 */
function getResourceFromUrl(url) {
  const urlParts = url.split("/").filter((part) => part);
  const resourceMap = {
    user: "USER",
    users: "USER",
    api: "API",
    v1: "API_V1",
    event: "EVENT",
    events: "EVENT",
    dashboard: "DASHBOARD",
    login: "AUTH",
    logout: "AUTH",
    signin: "AUTH",
  };

  for (const part of urlParts) {
    if (resourceMap[part.toLowerCase()]) {
      return resourceMap[part.toLowerCase()];
    }
  }

  return "UNKNOWN";
}

/**
 * Helper: Sanitize object cho logging
 * @param {Object} obj - Object cần sanitize
 * @returns {Object} Object đã sanitize
 */
function sanitizeForLog(obj) {
  if (!obj || typeof obj !== "object") return obj;

  const sanitized = { ...obj };
  const sensitiveKeys = ["password", "pass", "token", "secret", "key"];

  sensitiveKeys.forEach((key) => {
    if (sanitized[key]) {
      sanitized[key] = "[REDACTED]";
    }
  });

  return sanitized;
}

module.exports = {
  loggingActivityCrud,
  loggingActivityDataChanges,
  loggingActivityAdminAccess,
  loggingActivityResourceAccess,
  loggingActivityFileOperations,
};
