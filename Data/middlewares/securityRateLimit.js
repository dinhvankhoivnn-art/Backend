/**
 * Middleware rate limiting tổng hợp cho toàn bộ ứng dụng
 * Bảo vệ khỏi DDoS attacks và abuse
 */

const rateLimit = require("express-rate-limit");

/**
 * Rate limiter tổng quát cho tất cả requests
 * Giới hạn 1000 request mỗi 15 phút từ cùng IP
 */
const securityGeneralLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 1000, // Giới hạn 1000 request
  message: {
    success: false,
    message: "Quá nhiều request. Vui lòng thử lại sau.",
    retryAfter: "15 phút",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Bỏ qua rate limit cho admin đã xác thực
    return req.user && req.user.role === "admin";
  },
  handler: (req, res) => {
    console.error(`🚨 General rate limit exceeded:`, {
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
 * Rate limiter nghiêm ngặt cho endpoints nhạy cảm
 * Giới hạn 10 request mỗi phút
 */
const securitySensitiveLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  max: 10,
  message: {
    success: false,
    message: "Quá nhiều request đến endpoint nhạy cảm.",
    retryAfter: "1 phút",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Sử dụng user ID nếu đã đăng nhập, nếu không thì IP
    return req.user?.id || req.ip;
  },
  handler: (req, res) => {
    console.error(`🚨 Sensitive endpoint rate limit exceeded:`, {
      ip: req.ip,
      userId: req.user?.id,
      endpoint: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString(),
    });
  },
});

/**
 * Rate limiter cho uploads
 * Giới hạn 20 uploads mỗi giờ
 */
const securityUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 20,
  message: {
    success: false,
    message: "Quá nhiều file upload. Vui lòng thử lại sau 1 giờ.",
    retryAfter: "1 giờ",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.user && req.user.role === "admin";
  },
  handler: (req, res) => {
    console.error(`🚨 Upload rate limit exceeded:`, {
      ip: req.ip,
      userId: req.user?.id,
      timestamp: new Date().toISOString(),
    });
  },
});

/**
 * Rate limiter cho API endpoints
 * Giới hạn 500 request mỗi 5 phút cho APIs
 */
const securityApiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 phút
  max: 500,
  message: {
    success: false,
    message: "API rate limit exceeded.",
    retryAfter: "5 phút",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.user && req.user.role === "admin";
  },
  handler: (req, res) => {
    console.error(`🚨 API rate limit exceeded:`, {
      ip: req.ip,
      userId: req.user?.id,
      endpoint: req.originalUrl,
      timestamp: new Date().toISOString(),
    });
  },
});

/**
 * Rate limiter cho static files (CSS, JS, images)
 * Giới hạn 1000 request mỗi phút cho static files
 */
const securityStaticLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  max: 1000,
  message: {
    success: false,
    message: "Static files rate limit exceeded.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`⚠️ Static files rate limit exceeded:`, {
      ip: req.ip,
      endpoint: req.originalUrl,
      timestamp: new Date().toISOString(),
    });
  },
});

/**
 * Rate limiter chống brute force password reset
 * Giới hạn 5 request mỗi 30 phút
 */
const securityPasswordResetLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 phút
  max: 5,
  message: {
    success: false,
    message: "Quá nhiều yêu cầu reset mật khẩu.",
    retryAfter: "30 phút",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Sử dụng email hoặc IP
    return req.body?.email || req.ip;
  },
  handler: (req, res) => {
    console.error(`🚨 Password reset brute force detected:`, {
      ip: req.ip,
      email: req.body?.email,
      timestamp: new Date().toISOString(),
    });
  },
});

/**
 * Rate limiter chống DDoS
 * Giới hạn 100 request mỗi 10 giây cho mỗi IP
 */
const securityDdosLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 giây
  max: 100,
  message: {
    success: false,
    message: "Request rate too high. Possible DDoS attack detected.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.error(`🚨 Potential DDoS attack:`, {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      endpoint: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString(),
    });

    // Có thể thêm logic chặn IP hoặc thông báo admin
  },
});

/**
 * Middleware kiểm tra và chặn suspicious traffic patterns
 * Phát hiện bot và automated requests
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const securityTrafficAnalyzer = (req, res, next) => {
  try {
    const userAgent = req.get("User-Agent") || "";
    const ip = req.ip || req.connection.remoteAddress;
    const referer = req.get("Referer") || "";

    // Danh sách patterns đáng ngờ
    const suspiciousPatterns = [
      /\b(bot|crawler|spider|scraper)\b/i,
      /\bpython|java|curl|wget\b/i,
      /\bHTTrack|clshttp|archiver\b/i,
      /\bemail|harvest|extract|harvest\b/i,
      /\bmeta|data|mining|collection\b/i,
    ];

    // Kiểm tra User-Agent
    const isSuspiciousUA = suspiciousPatterns.some((pattern) =>
      pattern.test(userAgent)
    );

    // Kiểm tra request patterns (có thể mở rộng)
    const isSuspiciousReferer =
      referer.includes("localhost") && !req.originalUrl.includes("/api/");

    if (isSuspiciousUA || isSuspiciousReferer) {
      console.warn(`🚨 Suspicious traffic detected:`, {
        ip: ip,
        userAgent: userAgent.substring(0, 100),
        referer: referer,
        endpoint: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString(),
      });

      // Có thể chặn request hoặc chỉ log
      // return res.status(429).json({
      //   success: false,
      //   message: 'Traffic pattern not allowed'
      // });
    }

    next();
  } catch (error) {
    console.error("❌ Lỗi traffic analyzer:", error.message);
    next();
  }
};

/**
 * Middleware theo dõi và log rate limit violations
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const securityRateLimitLogger = (req, res, next) => {
  // Ghi log tất cả request với thông tin rate limit
  const rateLimitInfo = {
    ip: req.ip,
    userId: req.user?.id,
    endpoint: req.originalUrl,
    method: req.method,
    userAgent: req.get("User-Agent"),
    remaining: res.get("X-RateLimit-Remaining"),
    reset: res.get("X-RateLimit-Reset"),
    timestamp: new Date().toISOString(),
  };

  // Log chi tiết trong development hoặc khi có vấn đề
  if (
    process.env.NODE_ENV === "development" ||
    (rateLimitInfo.remaining && parseInt(rateLimitInfo.remaining) < 10)
  ) {
    console.log(`📊 Rate limit status:`, rateLimitInfo);
  }

  next();
};

/**
 * Middleware tổng hợp security rate limiting
 * Áp dụng nhiều lớp rate limiting khác nhau
 */
const securityRateLimit = [
  securityDdosLimiter, // DDoS protection (10s/100req)
  securityGeneralLimiter, // General limit (15min/1000req)
  securityTrafficAnalyzer, // Traffic analysis
  securityRateLimitLogger, // Rate limit logging
];

module.exports = {
  securityGeneralLimiter,
  securitySensitiveLimiter,
  securityUploadLimiter,
  securityApiLimiter,
  securityStaticLimiter,
  securityPasswordResetLimiter,
  securityDdosLimiter,
  securityTrafficAnalyzer,
  securityRateLimitLogger,
  securityRateLimit,
};
