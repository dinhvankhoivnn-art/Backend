/**
 * Middleware bảo vệ CSRF (Cross-Site Request Forgery)
 * Ngăn chặn các cuộc tấn công CSRF
 */

const crypto = require("crypto");

/**
 * Store đơn giản cho CSRF tokens (sử dụng Map trong memory)
 * Trong production nên dùng Redis hoặc database
 */
const csrfTokens = new Map();

/**
 * Tạo CSRF token
 * @returns {string} CSRF token
 */
const generateCsrfToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Lưu CSRF token với session ID
 * @param {string} sessionId - Session ID
 * @param {string} token - CSRF token
 * @param {number} expiresIn - Thời gian hết hạn (ms)
 */
const storeCsrfToken = (sessionId, token, expiresIn = 3600000) => {
  // 1 giờ
  const expiresAt = Date.now() + expiresIn;
  csrfTokens.set(sessionId, {
    token: token,
    expiresAt: expiresAt,
  });

  // Auto cleanup expired tokens sau 1 giờ
  setTimeout(() => {
    csrfTokens.delete(sessionId);
  }, expiresIn);
};

/**
 * Lấy và validate CSRF token
 * @param {string} sessionId - Session ID
 * @param {string} token - Token cần kiểm tra
 * @returns {boolean} True nếu token hợp lệ
 */
const validateCsrfToken = (sessionId, token) => {
  const stored = csrfTokens.get(sessionId);

  if (!stored) return false;

  // Kiểm tra token có khớp không
  if (stored.token !== token) return false;

  // Kiểm tra token có hết hạn không
  if (Date.now() > stored.expiresAt) {
    csrfTokens.delete(sessionId);
    return false;
  }

  // Token hợp lệ, xóa để tránh reuse
  csrfTokens.delete(sessionId);

  return true;
};

/**
 * Middleware tạo CSRF token cho GET requests
 * Thêm token vào response để client sử dụng
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const csrfTokenGenerator = (req, res, next) => {
  try {
    // Chỉ tạo token cho GET requests (đọc dữ liệu)
    if (req.method === "GET") {
      const sessionId = req.sessionID || req.ip || "anonymous";
      const token = generateCsrfToken();

      // Lưu token
      storeCsrfToken(sessionId, token);

      // Thêm token vào response headers
      res.setHeader("X-CSRF-Token", token);

      // Thêm token vào response body nếu là JSON
      if (res.locals.csrfToken === undefined) {
        res.locals.csrfToken = token;
      }

      if (process.env.NODE_ENV === "development") {
        console.log(`🔄 CSRF token generated for session: ${sessionId}`);
      }
    }

    next();
  } catch (error) {
    console.error("❌ Lỗi tạo CSRF token:", error.message);
    next();
  }
};

/**
 * Middleware validate CSRF token cho state-changing requests
 * Kiểm tra token cho POST, PUT, DELETE, PATCH
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const csrfProtection = (req, res, next) => {
  try {
    // Chỉ kiểm tra cho các methods thay đổi state
    const stateChangingMethods = ["POST", "PUT", "DELETE", "PATCH"];
    if (!stateChangingMethods.includes(req.method)) {
      return next();
    }

    // Bỏ qua CSRF check cho API endpoints (nếu cần)
    if (req.originalUrl.startsWith("/api/") && req.headers.authorization) {
      return next();
    }

    // Lấy token từ header, body hoặc query
    const token =
      req.headers["x-csrf-token"] || req.body._csrf || req.query._csrf;

    const sessionId = req.sessionID || req.ip || "anonymous";

    if (!token) {
      console.warn(
        `🚫 CSRF token missing for ${req.method} ${req.originalUrl}`,
        {
          sessionId: sessionId,
          ip: req.ip,
          userAgent: req.get("User-Agent"),
        }
      );

      return res.status(403).json({
        success: false,
        message: "CSRF token bị thiếu",
        code: "CSRF_MISSING",
      });
    }

    // Validate token
    if (!validateCsrfToken(sessionId, token)) {
      console.warn(
        `🚫 Invalid CSRF token for ${req.method} ${req.originalUrl}`,
        {
          sessionId: sessionId,
          providedToken: token?.substring(0, 10) + "...",
          ip: req.ip,
          userAgent: req.get("User-Agent"),
        }
      );

      return res.status(403).json({
        success: false,
        message: "CSRF token không hợp lệ hoặc đã hết hạn",
        code: "CSRF_INVALID",
      });
    }

    if (process.env.NODE_ENV === "development") {
      console.log(`✅ CSRF token validated for session: ${sessionId}`);
    }

    // Xóa token khỏi request body để tránh conflict
    if (req.body._csrf) {
      delete req.body._csrf;
    }

    next();
  } catch (error) {
    console.error("❌ Lỗi CSRF protection:", error.message);

    return res.status(500).json({
      success: false,
      message: "Lỗi server khi kiểm tra CSRF",
      code: "CSRF_ERROR",
    });
  }
};

/**
 * Middleware CSRF cho API endpoints
 * Sử dụng double submit cookie pattern
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const csrfApiProtection = (req, res, next) => {
  try {
    const stateChangingMethods = ["POST", "PUT", "DELETE", "PATCH"];
    if (!stateChangingMethods.includes(req.method)) {
      return next();
    }

    // Lấy token từ header và cookie
    const headerToken = req.headers["x-csrf-token"];
    const cookieToken = req.cookies.csrfToken;

    if (!headerToken || !cookieToken) {
      return res.status(403).json({
        success: false,
        message: "CSRF token bị thiếu trong header hoặc cookie",
        code: "CSRF_MISSING",
      });
    }

    // So sánh token từ header và cookie
    if (headerToken !== cookieToken) {
      console.warn(`🚫 CSRF token mismatch:`, {
        headerToken: headerToken?.substring(0, 10) + "...",
        cookieToken: cookieToken?.substring(0, 10) + "...",
        ip: req.ip,
      });

      return res.status(403).json({
        success: false,
        message: "CSRF token không khớp",
        code: "CSRF_MISMATCH",
      });
    }

    next();
  } catch (error) {
    console.error("❌ Lỗi CSRF API protection:", error.message);

    return res.status(500).json({
      success: false,
      message: "Lỗi server khi kiểm tra CSRF API",
      code: "CSRF_API_ERROR",
    });
  }
};

/**
 * Middleware tạo CSRF cookie
 * Tạo cookie chứa CSRF token
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const csrfCookieGenerator = (req, res, next) => {
  try {
    // Tạo token mới
    const token = generateCsrfToken();

    // Lưu token trong cookie (httpOnly để bảo mật)
    res.cookie("csrfToken", token, {
      httpOnly: true, // Không thể truy cập từ JavaScript
      secure: process.env.NODE_ENV === "production", // Chỉ HTTPS trong production
      sameSite: "strict", // Ngăn CSRF
      maxAge: 3600000, // 1 giờ
    });

    // Lưu token để sử dụng trong response
    res.locals.csrfToken = token;

    if (process.env.NODE_ENV === "development") {
      console.log(`🍪 CSRF cookie generated`);
    }

    next();
  } catch (error) {
    console.error("❌ Lỗi tạo CSRF cookie:", error.message);
    next();
  }
};

/**
 * Middleware cleanup CSRF tokens expired
 * Dọn dẹp tokens hết hạn định kỳ
 */
const csrfCleanup = () => {
  setInterval(() => {
    const now = Date.now();
    let cleaned = 0;

    for (const [sessionId, data] of csrfTokens.entries()) {
      if (now > data.expiresAt) {
        csrfTokens.delete(sessionId);
        cleaned++;
      }
    }

    if (cleaned > 0 && process.env.NODE_ENV === "development") {
      console.log(`🧹 Cleaned ${cleaned} expired CSRF tokens`);
    }
  }, 300000); // Chạy mỗi 5 phút
};

// Khởi động cleanup
csrfCleanup();

module.exports = {
  csrfTokenGenerator,
  csrfProtection,
  csrfApiProtection,
  csrfCookieGenerator,
};
