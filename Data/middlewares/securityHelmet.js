/**
 * Middleware bảo mật Helmet - Cấu hình security headers
 * Bảo vệ ứng dụng khỏi các lỗ hổng bảo mật phổ biến
 */

const helmet = require("helmet");

/**
 * Cấu hình Helmet cơ bản với các security headers thiết yếu
 * Bảo vệ khỏi XSS, clickjacking, MIME sniffing, etc.
 */
const securityHelmet = helmet({
  // Cấu hình Content Security Policy (CSP)
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },

  // Ngăn chặn clickjacking
  frameguard: {
    action: "deny", // Hoàn toàn không cho phép iframe
  },

  // Ngăn chặn MIME type sniffing
  noSniff: true,

  // Thêm header X-Content-Type-Options
  contentTypeOptions: true,

  // Bảo vệ khỏi XSS với X-XSS-Protection
  xssFilter: true,

  // Thêm header Referrer-Policy
  referrerPolicy: {
    policy: "strict-origin-when-cross-origin",
  },

  // Thêm header Permissions-Policy
  permissionsPolicy: {
    features: {
      camera: ["'none'"],
      microphone: ["'none'"],
      geolocation: ["'none'"],
      payment: ["'none'"],
    },
  },

  // Tắt powered-by header để ẩn thông tin server
  hidePoweredBy: true,
});

/**
 * Cấu hình Helmet cho development - ít restrictive hơn
 */
const securityHelmetDev = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:", "http:"],
      fontSrc: ["'self'", "https:", "http:"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https:",
        "http:",
      ],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "ws:", "wss:", "https:", "http:"],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
    },
  },
  frameguard: { action: "sameorigin" }, // Cho phép iframe từ cùng domain
  hidePoweredBy: true,
});

/**
 * Middleware tùy chỉnh thêm security headers
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const addSecurityHeaders = (req, res, next) => {
  // Thêm header bảo mật tùy chỉnh
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Header ngăn chặn MIME sniffing
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  // Header bảo mật cho API
  if (req.originalUrl.startsWith("/api/")) {
    res.setHeader("X-API-Version", "1.0.0");
    res.setHeader("X-Request-ID", require("crypto").randomUUID());
  }

  // Log security headers trong development
  if (process.env.NODE_ENV === "development") {
    console.log("🛡️ Security headers added");
  }

  next();
};

/**
 * Middleware kiểm tra và validate security headers
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const validateSecurityHeaders = (req, res, next) => {
  try {
    // Kiểm tra User-Agent (ngăn bots xấu)
    const userAgent = req.get("User-Agent");
    if (!userAgent || userAgent.length < 10) {
      return res.status(400).json({
        success: false,
        message: "Invalid User-Agent header",
      });
    }

    // Kiểm tra Content-Type cho POST/PUT/PATCH requests
    if (["POST", "PUT", "PATCH"].includes(req.method)) {
      const contentType = req.get("Content-Type");
      if (!contentType || !contentType.includes("application/json")) {
        return res.status(400).json({
          success: false,
          message: "Content-Type must be application/json",
        });
      }
    }

    // Kiểm tra Origin header cho CORS
    const origin = req.get("Origin");
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
    ];

    if (origin && !allowedOrigins.includes(origin)) {
      console.warn(`🚨 Suspicious origin: ${origin}`, {
        ip: req.ip,
        userAgent: userAgent,
        timestamp: new Date().toISOString(),
      });
    }

    next();
  } catch (error) {
    console.error("❌ Lỗi validate security headers:", error.message);

    return res.status(500).json({
      success: false,
      message: "Lỗi server khi kiểm tra bảo mật",
    });
  }
};

module.exports = {
  securityHelmet,
  securityHelmetDev,
  addSecurityHeaders,
  validateSecurityHeaders,
};
