/**
 * Middleware cấu hình CORS (Cross-Origin Resource Sharing)
 * Kiểm soát truy cập từ các domain khác
 */

const cors = require("cors");

/**
 * Cấu hình CORS cơ bản cho production
 */
const securityCors = cors({
  origin: function (origin, callback) {
    // Lấy danh sách domain được phép từ env
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
    ];

    // Cho phép requests không có origin (như mobile apps, Postman)
    if (!origin) return callback(null, true);

    // Kiểm tra origin có trong danh sách cho phép không
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Từ chối origin không được phép
    const msg = `Origin ${origin} không được phép truy cập`;
    console.warn(`🚫 CORS blocked: ${msg}`, {
      origin: origin,
      timestamp: new Date().toISOString(),
    });

    return callback(new Error(msg), false);
  },

  // Các methods HTTP được phép
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],

  // Headers được phép gửi
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Access-Control-Request-Method",
    "Access-Control-Request-Headers",
  ],

  // Headers được phép expose cho client
  exposedHeaders: [
    "X-API-Version",
    "X-Request-ID",
    "X-Rate-Limit-Remaining",
    "X-Rate-Limit-Reset",
  ],

  // Cho phép gửi credentials (cookies, authorization headers)
  credentials: true,

  // Cache preflight request trong 1 ngày
  maxAge: 86400,

  // Gửi OPTIONS request cho tất cả routes
  preflightContinue: false,

  // Xử lý OPTIONS requests
  optionsSuccessStatus: 204,
});

/**
 * Cấu hình CORS cho development - permissive hơn
 */
const securityCorsDev = cors({
  origin: true, // Cho phép tất cả origins trong development
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["X-API-Version", "X-Request-ID"],
});

/**
 * Middleware tùy chỉnh kiểm tra và log CORS requests
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const corsLogger = (req, res, next) => {
  // Log CORS requests trong development
  if (process.env.NODE_ENV === "development") {
    const origin = req.get("Origin");
    const method = req.method;
    const userAgent = req.get("User-Agent");

    if (origin) {
      console.log(`🌐 CORS request: ${method} ${req.originalUrl}`, {
        origin: origin,
        userAgent: userAgent?.substring(0, 50),
        ip: req.ip,
      });
    }
  }

  next();
};

/**
 * Middleware kiểm tra suspicious CORS requests
 * Phát hiện và chặn các requests đáng ngờ
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const corsSecurityCheck = (req, res, next) => {
  try {
    const origin = req.get("Origin");
    const referer = req.get("Referer");
    const host = req.get("Host");
    const userAgent = req.get("User-Agent");

    // Danh sách User-Agent đáng ngờ
    const suspiciousUserAgents = [
      "curl",
      "wget",
      "python",
      "java",
      "bot",
      "spider",
      "crawler",
    ];

    // Kiểm tra User-Agent
    const isSuspiciousUA = suspiciousUserAgents.some((agent) =>
      userAgent?.toLowerCase().includes(agent.toLowerCase())
    );

    if (isSuspiciousUA) {
      console.warn(`🚨 Suspicious CORS request detected:`, {
        origin: origin,
        referer: referer,
        host: host,
        userAgent: userAgent,
        ip: req.ip,
        method: req.method,
        url: req.originalUrl,
        timestamp: new Date().toISOString(),
      });

      // Có thể chặn request hoặc chỉ log
      // return res.status(403).json({
      //   success: false,
      //   message: 'Request blocked due to suspicious activity'
      // });
    }

    // Kiểm tra Origin và Referer mismatch
    if (origin && referer && !referer.startsWith(origin)) {
      console.warn(`⚠️ Origin-Referer mismatch:`, {
        origin: origin,
        referer: referer,
        ip: req.ip,
      });
    }

    next();
  } catch (error) {
    console.error("❌ Lỗi CORS security check:", error.message);
    next();
  }
};

/**
 * Middleware tùy chỉnh cho API routes
 * Áp dụng CORS nghiêm ngặt hơn cho API endpoints
 */
const corsApiStrict = cors({
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
    ];

    // API chỉ cho phép origins được cấu hình
    if (!origin)
      return callback(new Error("Origin header required for API"), false);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(
      new Error(`API access denied for origin: ${origin}`),
      false
    );
  },

  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["X-API-Version", "X-Request-ID"],
  maxAge: 86400,
});

/**
 * Middleware cho WebSocket CORS (nếu sử dụng WS)
 */
const corsWebSocket = cors({
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
    ];

    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("WebSocket CORS denied"), false);
  },

  credentials: true,
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization", "Upgrade", "Connection"],
  exposedHeaders: ["X-WebSocket-Version"],
});

module.exports = {
  securityCors,
  securityCorsDev,
  corsLogger,
  corsSecurityCheck,
  corsApiStrict,
  corsWebSocket,
};
