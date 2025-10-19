/**
 * Middleware bảo vệ chuyên biệt cho hệ thống chat
 * Bao gồm 10 middleware bảo vệ cổng chat với các tính năng bảo mật và tối ưu
 */

const UserChatNew = require("../models/UserChatNew");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");

/**
 * 1. Chat Rate Limiting - Giới hạn tốc độ request cho chat APIs
 * Ngăn spam và abuse cho các chức năng chat
 */
const chatRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: (req, res) => {
    // Giới hạn khác nhau cho các loại request
    const path = req.path;
    if (path.includes("/register")) return 5; // Đăng ký chat: 5/lần
    if (path.includes("/search")) return 30; // Tìm kiếm: 30/lần
    if (path.includes("/friend")) return 20; // Friends management: 20/lần
    return 50; // Default: 50/lần
  },
  message: {
    success: false,
    message: "Quá nhiều request chat. Vui lòng thử lại sau.",
    code: "CHAT_RATE_LIMIT_EXCEEDED",
    retryAfter: "15 phút",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit theo user ID thay vì IP để tránh block người dùng hợp lệ
    return req.user?.id || req.ip;
  },
  handler: (req, res) => {
    console.warn(`🚦 Chat Rate Limit Exceeded:`, {
      userId: req.user?.id,
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    res.status(429).json({
      success: false,
      message: "Quá nhiều request chat. Vui lòng thử lại sau.",
      code: "CHAT_RATE_LIMIT_EXCEEDED",
      retryAfter: "15 phút",
    });
  },
});

/**
 * 2. Chat Session Validation - Kiểm tra session chat có hợp lệ
 * Đảm bảo user đã đăng ký chat và session còn active
 */
const chatSessionValidation = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Chưa đăng nhập",
        code: "CHAT_SESSION_INVALID",
      });
    }

    // Kiểm tra user có tài khoản chat không
    const chatUser = await UserChatNew.findOne({ userId });
    if (!chatUser) {
      return res.status(403).json({
        success: false,
        message: "Bạn chưa đăng ký tài khoản chat",
        code: "CHAT_USER_NOT_REGISTERED",
      });
    }

    // Kiểm tra tài khoản chat có bị khóa không
    if (chatUser.status === "blocked") {
      return res.status(403).json({
        success: false,
        message: "Tài khoản chat đã bị khóa",
        code: "CHAT_USER_BLOCKED",
      });
    }

    // Attach chat user info to request
    req.chatUser = chatUser;
    next();
  } catch (error) {
    console.error("❌ Chat Session Validation Error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi xác thực session chat",
      code: "CHAT_SESSION_ERROR",
    });
  }
};

/**
 * 3. Chat Privacy Protection - Bảo vệ quyền riêng tư
 * Kiểm tra quyền truy cập thông tin cá nhân của chat user khác
 */
const chatPrivacyProtection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentChatUser = req.chatUser;

    // Nếu đang truy cập thông tin của chính mình -> cho phép
    if (currentChatUser._id.toString() === id) {
      return next();
    }

    // Kiểm tra quyền xem thông tin của user khác
    const targetChatUser = await UserChatNew.findById(id);
    if (!targetChatUser) {
      return res.status(404).json({
        success: false,
        message: "User chat không tồn tại",
        code: "CHAT_USER_NOT_FOUND",
      });
    }

    // Admin có thể xem tất cả
    if (req.user.role === "admin") {
      return next();
    }

    // Kiểm tra có phải bạn bè không
    const isFriend = targetChatUser.friends.includes(currentChatUser._id);
    const isFriendBack = currentChatUser.friends.includes(targetChatUser._id);

    // Nếu không phải bạn bè và không cho phép xem trạng thái online
    if (!isFriend || !isFriendBack) {
      if (!targetChatUser.chatSettings.showOnlineStatus) {
        // Ẩn thông tin nhạy cảm
        targetChatUser.status = "offline";
        targetChatUser.lastOnlineAt = null;
        targetChatUser.currentSocketId = null;
      }

      // Kiểm tra quyền xem thông tin cá nhân
      if (!targetChatUser.chatSettings.allowDirectMessages) {
        return res.status(403).json({
          success: false,
          message: "User này không cho phép nhắn tin trực tiếp",
          code: "CHAT_PRIVACY_RESTRICTED",
        });
      }
    }

    // Kiểm tra có bị chặn không
    if (
      targetChatUser.isBlocked(currentChatUser._id) ||
      currentChatUser.isBlocked(targetChatUser._id)
    ) {
      return res.status(403).json({
        success: false,
        message: "Bạn đã bị chặn hoặc đã chặn user này",
        code: "CHAT_USER_BLOCKED",
      });
    }

    req.targetChatUser = targetChatUser;
    next();
  } catch (error) {
    console.error("❌ Chat Privacy Protection Error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi kiểm tra quyền riêng tư",
      code: "CHAT_PRIVACY_ERROR",
    });
  }
};

/**
 * 4. Chat Content Filtering - Lọc nội dung chat
 * Ngăn spam, toxic content trong chat
 */
const chatContentFiltering = (req, res, next) => {
  const filterWords = [
    // Từ khóa spam/toxic (có thể mở rộng)
    "spam",
    "scam",
    "hack",
    "crack",
    "virus",
    "toxic",
    "abuse",
    "harass",
    "threat",
  ];

  const checkContent = (content) => {
    if (!content) return false;
    const lowerContent = content.toLowerCase();
    return filterWords.some((word) => lowerContent.includes(word));
  };

  // Kiểm tra các trường có thể chứa nội dung
  const fieldsToCheck = ["bio", "interests", "name"];
  for (const field of fieldsToCheck) {
    if (req.body[field] && checkContent(req.body[field])) {
      console.warn(`🚫 Chat Content Filtered:`, {
        userId: req.user?.id,
        field,
        content: req.body[field],
      });

      return res.status(400).json({
        success: false,
        message: `Nội dung ${field} chứa từ khóa không được phép`,
        code: "CHAT_CONTENT_FILTERED",
        field,
      });
    }
  }

  next();
};

/**
 * 5. Chat Flood Prevention - Ngăn flood request
 * Theo dõi và ngăn chặn flood từ cùng một user
 */
const chatFloodPrevention = (() => {
  const userRequests = new Map();
  const FLOOD_THRESHOLD = 10; // 10 requests
  const FLOOD_WINDOW = 60 * 1000; // 1 phút

  return (req, res, next) => {
    const userId = req.user?.id || req.ip;
    const now = Date.now();

    if (!userRequests.has(userId)) {
      userRequests.set(userId, []);
    }

    const requests = userRequests.get(userId);
    // Xóa requests cũ
    const recentRequests = requests.filter((time) => now - time < FLOOD_WINDOW);

    if (recentRequests.length >= FLOOD_THRESHOLD) {
      console.warn(`🌊 Chat Flood Detected:`, {
        userId,
        requestCount: recentRequests.length,
      });
      return res.status(429).json({
        success: false,
        message: "Phát hiện flood request. Vui lòng chậm lại.",
        code: "CHAT_FLOOD_DETECTED",
        retryAfter: "1 phút",
      });
    }

    recentRequests.push(now);
    userRequests.set(userId, recentRequests);

    next();
  };
})();

/**
 * 6. Chat Audit Logging - Ghi log chi tiết cho chat activities
 * Theo dõi tất cả hoạt động chat để audit
 */
const chatAuditLogging = (req, res, next) => {
  const startTime = Date.now();
  const originalJson = res.json;

  res.json = function (data) {
    const duration = Date.now() - startTime;

    console.log(`📊 Chat Audit:`, {
      userId: req.user?.id,
      chatUserId: req.chatUser?._id,
      method: req.method,
      path: req.path,
      success: data.success,
      code: data.code,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      timestamp: new Date().toISOString(),
    });

    return originalJson.call(this, data);
  };

  next();
};

/**
 * 7. Chat Resource Limits - Giới hạn tài nguyên chat
 * Ngăn tạo quá nhiều bạn bè, group, etc.
 */
const chatResourceLimits = async (req, res, next) => {
  try {
    const chatUser = req.chatUser;
    const path = req.path;

    // Giới hạn số lượng bạn bè (max 500)
    if (path.includes("/friend") && req.method === "POST") {
      if (chatUser.friends.length >= 500) {
        return res.status(400).json({
          success: false,
          message: "Đã đạt giới hạn số lượng bạn bè (500)",
          code: "CHAT_FRIENDS_LIMIT_EXCEEDED",
        });
      }
    }

    // Giới hạn độ dài bio (max 200 chars)
    if (req.body.bio && req.body.bio.length > 200) {
      return res.status(400).json({
        success: false,
        message: "Bio không được vượt quá 200 ký tự",
        code: "CHAT_BIO_TOO_LONG",
      });
    }

    // Giới hạn số lượng interests (max 10)
    if (req.body.interests && req.body.interests.length > 10) {
      return res.status(400).json({
        success: false,
        message: "Không được thêm quá 10 sở thích",
        code: "CHAT_INTERESTS_LIMIT_EXCEEDED",
      });
    }

    next();
  } catch (error) {
    console.error("❌ Chat Resource Limits Error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi kiểm tra giới hạn tài nguyên",
      code: "CHAT_RESOURCE_LIMITS_ERROR",
    });
  }
};

/**
 * 8. Chat IP Blacklist - Chặn IP đáng ngờ
 * Danh sách đen IP có hành vi xấu
 */
const chatIPBlacklist = (() => {
  const blacklist = new Set([
    // Có thể load từ database hoặc config
    // '192.168.1.1', '10.0.0.1'
  ]);

  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;

    if (blacklist.has(clientIP)) {
      console.warn(`🚫 Chat IP Blacklisted:`, { ip: clientIP, path: req.path });
      return res.status(403).json({
        success: false,
        message: "IP của bạn đã bị chặn",
        code: "CHAT_IP_BLACKLISTED",
      });
    }

    next();
  };
})();

/**
 * 9. Chat Request Validation - Validate chat-specific requests
 * Kiểm tra tính hợp lệ của request parameters
 */
const chatRequestValidation = (req, res, next) => {
  const { id, friendId } = req.params;

  // Validate MongoDB ObjectId format
  const mongoIdRegex = /^[0-9a-fA-F]{24}$/;

  if (id && !mongoIdRegex.test(id)) {
    return res.status(400).json({
      success: false,
      message: "ID chat user không hợp lệ",
      code: "CHAT_INVALID_USER_ID",
    });
  }

  if (friendId && !mongoIdRegex.test(friendId)) {
    return res.status(400).json({
      success: false,
      message: "ID friend không hợp lệ",
      code: "CHAT_INVALID_FRIEND_ID",
    });
  }

  // Validate query parameters cho search
  if (req.path.includes("/search")) {
    const { q, limit } = req.query;

    if (q && (q.length < 1 || q.length > 100)) {
      return res.status(400).json({
        success: false,
        message: "Từ khóa tìm kiếm phải từ 1-100 ký tự",
        code: "CHAT_SEARCH_QUERY_INVALID",
      });
    }

    if (limit && (parseInt(limit) < 1 || parseInt(limit) > 50)) {
      return res.status(400).json({
        success: false,
        message: "Limit phải từ 1-50",
        code: "CHAT_SEARCH_LIMIT_INVALID",
      });
    }
  }

  next();
};

/**
 * 10. Chat Performance Monitoring - Theo dõi performance
 * Monitor response time và resource usage
 */
const chatPerformanceMonitoring = (req, res, next) => {
  const startTime = process.hrtime.bigint();
  const startMemory = process.memoryUsage();

  res.on("finish", () => {
    const endTime = process.hrtime.bigint();
    const endMemory = process.memoryUsage();

    const duration = Number(endTime - startTime) / 1_000_000; // ms
    const memoryDelta = {
      rss: endMemory.rss - startMemory.rss,
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      external: endMemory.external - startMemory.external,
    };

    // Log nếu response time > 1000ms hoặc memory usage tăng đáng kể
    if (duration > 1000 || Math.abs(memoryDelta.heapUsed) > 10 * 1024 * 1024) {
      // 10MB
      console.warn(`⚡ Chat Performance Alert:`, {
        path: req.path,
        method: req.method,
        duration: `${duration.toFixed(2)}ms`,
        memoryDelta,
        statusCode: res.statusCode,
        userId: req.user?.id,
      });
    }

    // Có thể gửi metrics đến monitoring service
    // monitoringService.record('chat_request', { duration, memoryDelta, ... });
  });

  next();
};

module.exports = {
  chatRateLimit,
  chatSessionValidation,
  chatPrivacyProtection,
  chatContentFiltering,
  chatFloodPrevention,
  chatAuditLogging,
  chatResourceLimits,
  chatIPBlacklist,
  chatRequestValidation,
  chatPerformanceMonitoring,
};
