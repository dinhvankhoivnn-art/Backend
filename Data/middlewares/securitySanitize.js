/**
 * Middleware sanitize input để ngăn chặn XSS và injection attacks
 * Làm sạch dữ liệu đầu vào trước khi xử lý
 */

const validator = require("validator");
let DOMPurify;
try {
  DOMPurify = require("isomorphic-dompurify");
} catch (error) {
  console.warn("⚠️ isomorphic-dompurify not found, using fallback sanitize");
  DOMPurify = {
    sanitize: (input) => validator.escape(input),
  };
}

/**
 * Sanitize string input - loại bỏ script và HTML nguy hiểm
 * @param {string} input - Chuỗi cần sanitize
 * @returns {string} Chuỗi đã được sanitize
 */
const sanitizeString = (input) => {
  if (typeof input !== "string") return input;

  // Loại bỏ HTML tags
  let sanitized = validator.stripLow(input);

  // Sanitize HTML nếu có
  sanitized = DOMPurify.sanitize(sanitized, {
    ALLOWED_TAGS: [], // Không cho phép thẻ HTML nào
    ALLOWED_ATTR: [], // Không cho phép attribute nào
  });

  // Escape HTML entities
  sanitized = validator.escape(sanitized);

  // Loại bỏ các ký tự control
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, "");

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
};

/**
 * Sanitize HTML input (cho phép một số tags an toàn)
 * @param {string} input - HTML cần sanitize
 * @returns {string} HTML đã được sanitize
 */
const sanitizeHtml = (input) => {
  if (typeof input !== "string") return input;

  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
    ],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
  });
};

/**
 * Sanitize object - đệ quy sanitize tất cả string values
 * @param {Object} obj - Object cần sanitize
 * @returns {Object} Object đã được sanitize
 */
const sanitizeObject = (obj) => {
  if (obj === null || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      // Sanitize khác nhau cho các field khác nhau
      if (
        key.toLowerCase().includes("html") ||
        key.toLowerCase().includes("content")
      ) {
        sanitized[key] = sanitizeHtml(value);
      } else {
        sanitized[key] = sanitizeString(value);
      }
    } else if (typeof value === "object") {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

/**
 * Middleware sanitize request body
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const sanitizeBody = (req, res, next) => {
  try {
    if (req.body && typeof req.body === "object") {
      req.body = sanitizeObject(req.body);

      if (process.env.NODE_ENV === "development") {
        console.log("🧹 Request body sanitized");
      }
    }

    next();
  } catch (error) {
    console.error("❌ Lỗi sanitize body:", error.message);

    return res.status(400).json({
      success: false,
      message: "Dữ liệu đầu vào không hợp lệ",
    });
  }
};

/**
 * Middleware sanitize query parameters
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const sanitizeQuery = (req, res, next) => {
  try {
    if (req.query && typeof req.query === "object") {
      for (const [key, value] of Object.entries(req.query)) {
        if (typeof value === "string") {
          req.query[key] = sanitizeString(value);
        }
      }

      if (process.env.NODE_ENV === "development") {
        console.log("🧹 Query parameters sanitized");
      }
    }

    next();
  } catch (error) {
    console.error("❌ Lỗi sanitize query:", error.message);
    next();
  }
};

/**
 * Middleware sanitize URL parameters
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const sanitizeParams = (req, res, next) => {
  try {
    if (req.params && typeof req.params === "object") {
      for (const [key, value] of Object.entries(req.params)) {
        if (typeof value === "string") {
          req.params[key] = sanitizeString(value);
        }
      }

      if (process.env.NODE_ENV === "development") {
        console.log("🧹 URL parameters sanitized");
      }
    }

    next();
  } catch (error) {
    console.error("❌ Lỗi sanitize params:", error.message);
    next();
  }
};

/**
 * Middleware sanitize headers (chọn lọc)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const sanitizeHeaders = (req, res, next) => {
  try {
    // Sanitize một số headers có thể chứa dữ liệu user input
    const headersToSanitize = ["user-agent", "referer", "x-forwarded-for"];

    headersToSanitize.forEach((header) => {
      const value = req.get(header);
      if (value && typeof value === "string") {
        // Chỉ sanitize cơ bản, không thay đổi header gốc
        const sanitized = sanitizeString(value);
        if (sanitized !== value) {
          console.warn(`🚨 Suspicious header detected: ${header}`, {
            original: value.substring(0, 100),
            sanitized: sanitized.substring(0, 100),
          });
        }
      }
    });

    next();
  } catch (error) {
    console.error("❌ Lỗi sanitize headers:", error.message);
    next();
  }
};

/**
 * Middleware kiểm tra input có chứa SQL injection patterns
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const detectSqlInjection = (req, res, next) => {
  try {
    const sqlPatterns = [
      /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
      /('|(\\x27)|(\\x2D\\x2D)|(\\#)|(\\x23)|(\\%27)|(\\x2D\\x2D))/i,
      /(\b(or|and)\b\s+\d+\s*=\s*\d+)/i,
      /(\bscript\b)/i,
      /(<script)/i,
    ];

    const checkString = (str) => {
      return sqlPatterns.some((pattern) => pattern.test(str));
    };

    const checkObject = (obj) => {
      if (typeof obj === "string") {
        return checkString(obj);
      }
      if (typeof obj === "object" && obj !== null) {
        for (const value of Object.values(obj)) {
          if (checkObject(value)) return true;
        }
      }
      return false;
    };

    // Kiểm tra body, query, params
    if (
      checkObject(req.body) ||
      checkObject(req.query) ||
      checkObject(req.params)
    ) {
      console.error(`🚨 Potential SQL injection detected:`, {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        url: req.originalUrl,
        method: req.method,
        body: JSON.stringify(req.body).substring(0, 200),
        query: JSON.stringify(req.query).substring(0, 200),
        params: JSON.stringify(req.params).substring(0, 200),
      });

      return res.status(400).json({
        success: false,
        message: "Dữ liệu đầu vào chứa ký tự không hợp lệ",
      });
    }

    next();
  } catch (error) {
    console.error("❌ Lỗi detect SQL injection:", error.message);
    next();
  }
};

/**
 * Middleware kiểm tra input có chứa XSS patterns
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const detectXss = (req, res, next) => {
  try {
    const xssPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /onload=/i,
      /onerror=/i,
      /onclick=/i,
      /onmouseover=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /expression\s*\(/i,
      /vbscript\s*:/i,
      /data\s*:\s*text\/html/i,
    ];

    const checkString = (str) => {
      return xssPatterns.some((pattern) => pattern.test(str));
    };

    const checkObject = (obj) => {
      if (typeof obj === "string") {
        return checkString(obj);
      }
      if (typeof obj === "object" && obj !== null) {
        for (const value of Object.values(obj)) {
          if (checkObject(value)) return true;
        }
      }
      return false;
    };

    if (
      checkObject(req.body) ||
      checkObject(req.query) ||
      checkObject(req.params)
    ) {
      console.error(`🚨 Potential XSS detected:`, {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        url: req.originalUrl,
        method: req.method,
      });

      return res.status(400).json({
        success: false,
        message: "Dữ liệu đầu vào chứa nội dung không an toàn",
      });
    }

    next();
  } catch (error) {
    console.error("❌ Lỗi detect XSS:", error.message);
    next();
  }
};

/**
 * Middleware tổng hợp sanitize input
 * Áp dụng tất cả các biện pháp sanitize
 */
const sanitizeInput = [
  sanitizeHeaders,
  sanitizeQuery,
  sanitizeParams,
  sanitizeBody,
  detectSqlInjection,
  detectXss,
];

module.exports = {
  sanitizeString,
  sanitizeHtml,
  sanitizeObject,
  sanitizeBody,
  sanitizeQuery,
  sanitizeParams,
  sanitizeHeaders,
  detectSqlInjection,
  detectXss,
  sanitizeInput,
};
