/**
 * File chính của ứng dụng Backend Node.js
 * Khởi tạo server Express với tất cả middleware và routes
 */

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const http = require("http");

// Import các modules
const { connectDB } = require("./config/database");

// Import controllers
const authController = require("./controllers/authController");
const userController = require("./controllers/userController");
const chatController = require("./controllers/chatController");

// Import middlewares
const { authVerifyToken } = require("./middlewares/authVerifyToken");
const { authCheckAdmin } = require("./middlewares/authCheckAdmin");
const { authCheckUser } = require("./middlewares/authCheckUser");
const { authValidateSession } = require("./middlewares/authValidateSession");
const {
  authLoginLimiter,
  authRegisterLimiter,
  authApiLimiter,
} = require("./middlewares/authRateLimit");
const {
  authLogLogin,
  authLogLogout,
} = require("./middlewares/authLogActivity");
const {
  securityHelmet,
  addSecurityHeaders,
} = require("./middlewares/securityHelmet");
const { securityCors } = require("./middlewares/securityCors");
const {
  csrfProtection,
  csrfCookieGenerator,
  csrfTokenGenerator,
} = require("./middlewares/securityCsrf");
const { sanitizeInput } = require("./middlewares/securitySanitize");
const { securityRateLimit } = require("./middlewares/securityRateLimit");
const {
  loggingRequestBasic,
  loggingRequestDetailed,
} = require("./middlewares/loggingRequest");
const {
  errorHandlerGlobal,
  errorHandlerValidation,
  errorHandlerAuth,
  errorHandler404,
} = require("./middlewares/errorHandler");
const { loggingActivityCrud } = require("./middlewares/loggingActivity");

// Import chat security middlewares
const {
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
} = require("./middlewares/chatSecurity");

// Import chat optimization middlewares
const {
  chatCompression,
  chatCache,
  chatConnectionPool,
  chatMemoryManager,
  chatRequestBatching,
  chatSecurityHeaders,
  chatHealthCheck,
  chatRequestDeduplication,
  chatResponseOptimization,
  chatCircuitBreaker,
} = require("./middlewares/chatOptimizations");

// Import web tracking middlewares
const {
  trackUserActivity,
  trackGPSLocation,
  trackDeviceInfo,
  trackSession,
  getTrackingStats,
  exportTrackingData,
} = require("./middlewares/webTracking");

// Khởi tạo Express app
const app = express();
const server = http.createServer(app);

// Cấu hình cơ bản
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

// Trust proxy (quan trọng cho rate limiting khi deploy)
app.set("trust proxy", 1);

// Cấu hình EJS view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// =====================================================================================
// MIDDLEWARE CƠ BẢN
// =====================================================================================

// Security headers (đặt đầu tiên)
app.use(securityHelmet);
app.use(addSecurityHeaders);

// CORS
app.use(securityCors);

// Rate limiting tổng thể
app.use(securityRateLimit);

// Logging requests
if (NODE_ENV === "development") {
  app.use(loggingRequestDetailed);
} else {
  app.use(loggingRequestBasic);
}

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Cookie parser
const cookieParser = require("cookie-parser");
app.use(cookieParser());

// Static files
app.use(express.static(path.join(__dirname, "public")));
app.use("/client", express.static(path.join(__dirname, "client")));

// Input sanitization
app.use(sanitizeInput);

// =====================================================================================
// WEB TRACKING MIDDLEWARE (đặt sau body parsing, trước auth)
// =====================================================================================

// Track mọi hoạt động của user trên web
app.use(trackUserActivity);

// =====================================================================================
// SESSION & CSRF (nếu sử dụng session)
// =====================================================================================

// CSRF protection (chỉ cho routes cần thiết)
app.use("/api", csrfProtection);

// =====================================================================================
// SECURITY MIDDLEWARE
// =====================================================================================

// Bảo vệ tất cả routes với rate limiting
app.use("/api", authApiLimiter);

// =====================================================================================
// LOGGING MIDDLEWARE
// =====================================================================================

// Activity logging cho CRUD operations
app.use("/api/v1/user", loggingActivityCrud);

// =====================================================================================
// PUBLIC ROUTES (không cần auth)
// =====================================================================================

// Trang login
app.get("/login", authController.showLoginPage);

// Xử lý login
app.post(
  "/login",
  authLoginLimiter,
  authLogLogin,
  require("./validations/expressValidators").commonValidators.login,
  authController.login
);

// API đăng ký (sign in)
app.post(
  "/api/v1/signIn",
  authRegisterLimiter,
  require("./validations/expressValidators").createNewUserValidators.register,
  // TODO: Implement sign in controller
  (req, res) => res.json({ message: "Sign in endpoint - TODO" })
);

// =====================================================================================
// WEB TRACKING API ROUTES
// =====================================================================================

// Track GPS location
app.post("/api/track-location", authCheckUser, trackGPSLocation);

// Track device and network info
app.post("/api/track-device-info", authCheckUser, trackDeviceInfo);

// Track session info
app.post("/api/track-session", authCheckUser, trackSession);

// Get tracking statistics (admin only)
app.get("/api/tracking/stats", authCheckAdmin, getTrackingStats);

// Export tracking data (admin only)
app.get("/api/tracking/export", authCheckAdmin, exportTrackingData);

// =====================================================================================
// AUTHENTICATED ROUTES (cần login)
// =====================================================================================

// Middleware xác thực token cho tất cả routes còn lại
app.use(authVerifyToken);

// Validate session
app.use(authValidateSession);

// Logout
app.post("/logout", authLogLogout, authController.logout);

// Check auth status
app.get("/auth/status", authController.checkAuthStatus);

// Refresh token
app.post("/auth/refresh", authController.refreshToken);

// Verify token endpoint
app.get("/api/v1/verify-token", authController.checkAuthStatus);
// Get profile
app.get("/auth/profile", authController.getProfile);

// =====================================================================================
// USER MANAGEMENT ROUTES
// =====================================================================================

// Dashboard - chỉ admin mới xem được tất cả users
app.get(
  "/dashboard",
  authCheckAdmin,
  // TODO: Implement dashboard controller
  (req, res) =>
    res.render("dashboard", {
      title: "Dashboard",
      currentUser: req.user,
      stats: {}, // TODO: Add real stats
    })
);

// User routes với phân quyền
app.get("/api/v1/user", authCheckUser, userController.getUserAll);

app.get("/api/v1/user/new", authCheckAdmin, userController.showCreateUserForm);

app.post(
  "/api/v1/user",
  authCheckAdmin,
  require("./validations/expressValidators").userValidators.createUser,
  userController.createUserNew
);

app.get(
  "/api/v1/user/:id",
  authCheckUser,
  require("./validations/expressValidators").userValidators.getUserById,
  userController.getUserForID
);

app.get(
  "/api/v1/user/:id/edit",
  authCheckUser,
  require("./validations/expressValidators").userValidators.getUserById,
  userController.showEditUserForm
);

app.put(
  "/api/v1/user/:id",
  authCheckUser,
  require("./validations/expressValidators").userValidators.updateUser,
  userController.updateForID
);

app.delete(
  "/api/v1/user/:id",
  authCheckAdmin,
  require("./validations/expressValidators").userValidators.deleteUser,
  userController.deleteForID
);

// =====================================================================================
// CHAT ROUTES - Protected by 10 specialized security middlewares
// =====================================================================================

// Add optimization middlewares globally for chat routes
app.use("/chat", chatCompression);
app.use("/chat", chatCache.middleware);
app.use("/chat", chatConnectionPool.middleware);
app.use("/chat", chatMemoryManager.monitor);
app.use("/chat", chatSecurityHeaders);
app.use("/chat", chatRequestDeduplication);
app.use("/chat", chatResponseOptimization);
app.use("/chat", chatCircuitBreaker.middleware);

// Health check endpoint
app.get("/chat/health", chatHealthCheck);

// Chat register
app.post(
  "/chat/register",
  // 🔒 Security Layer: Rate limiting, IP blacklist, flood prevention
  chatIPBlacklist,
  chatRateLimit,
  chatFloodPrevention,
  // ✅ Session & Auth: Validate user session and chat registration
  authCheckUser,
  chatSessionValidation,
  // 🛡️ Content & Privacy: Filter content, validate requests
  chatRequestValidation,
  chatContentFiltering,
  // 📊 Monitoring: Audit logging and performance monitoring
  chatAuditLogging,
  chatPerformanceMonitoring,
  // 🎯 Validation: Express validators for chat data
  require("./validations/expressValidators").chatValidators.registerChat,
  chatController.registerChat
);

// Chat messages routes - sửa lỗi typing
app.post(
  "/chat/messages/private",
  // 🔒 Security Layer: Rate limiting, flood prevention
  chatIPBlacklist,
  chatRateLimit,
  chatFloodPrevention,
  // ✅ Session & Auth: Validate user session
  authCheckUser,
  chatSessionValidation,
  // 🛡️ Content & Resources: Filter content, limit resources
  chatRequestValidation,
  chatContentFiltering,
  chatResourceLimits,
  // 📊 Monitoring: Audit logging and performance
  chatAuditLogging,
  chatPerformanceMonitoring,
  // 🎯 Validation: Express validators
  require("./validations/expressValidators").chatValidators.sendPrivateMessage,
  chatController.sendPrivateMessage
);

app.post(
  "/chat/messages/group",
  // 🔒 Security Layer: Rate limiting, flood prevention
  chatIPBlacklist,
  chatRateLimit,
  chatFloodPrevention,
  // ✅ Session & Auth: Validate user session
  authCheckUser,
  chatSessionValidation,
  // 🛡️ Content & Resources: Filter content, limit resources
  chatRequestValidation,
  chatContentFiltering,
  chatResourceLimits,
  // 📊 Monitoring: Audit logging and performance
  chatAuditLogging,
  chatPerformanceMonitoring,
  // 🎯 Validation: Express validators
  require("./validations/expressValidators").chatValidators.sendGroupMessage,
  chatController.sendGroupMessage
);

app.get(
  "/chat/messages/private/:userId",
  // 🔒 Security Layer: Rate limiting
  chatIPBlacklist,
  chatRateLimit,
  // ✅ Session & Auth: Validate user session
  authCheckUser,
  chatSessionValidation,
  // 🛡️ Privacy Protection: Check access permissions
  chatPrivacyProtection,
  // 📊 Monitoring: Audit logging and performance
  chatAuditLogging,
  chatPerformanceMonitoring,
  // 🎯 Validation: Request validation
  chatRequestValidation,
  chatController.getPrivateMessages
);

app.get(
  "/chat/messages/group/:groupId",
  // 🔒 Security Layer: Rate limiting
  chatIPBlacklist,
  chatRateLimit,
  // ✅ Session & Auth: Validate user session
  authCheckUser,
  chatSessionValidation,
  // 🛡️ Privacy Protection: Check access permissions
  chatPrivacyProtection,
  // 📊 Monitoring: Audit logging and performance
  chatAuditLogging,
  chatPerformanceMonitoring,
  // 🎯 Validation: Request validation
  chatRequestValidation,
  chatController.getGroupMessages
);

// Chat groups routes
app.post(
  "/chat/groups",
  // 🔒 Security Layer: Rate limiting, flood prevention
  chatIPBlacklist,
  chatRateLimit,
  chatFloodPrevention,
  // ✅ Session & Auth: Validate user session
  authCheckUser,
  chatSessionValidation,
  // 🛡️ Resources: Limit resource usage
  chatResourceLimits,
  // 📊 Monitoring: Audit logging and performance
  chatAuditLogging,
  chatPerformanceMonitoring,
  // 🎯 Validation: Request validation
  chatRequestValidation,
  chatController.createGroup
);

app.get(
  "/chat/groups/:groupId",
  // 🔒 Security Layer: Rate limiting
  chatIPBlacklist,
  chatRateLimit,
  // ✅ Session & Auth: Validate user session
  authCheckUser,
  chatSessionValidation,
  // 🛡️ Privacy Protection: Check access permissions
  chatPrivacyProtection,
  // 📊 Monitoring: Audit logging and performance
  chatAuditLogging,
  chatPerformanceMonitoring,
  // 🎯 Validation: Request validation
  chatRequestValidation,
  chatController.getGroupById
);

app.put(
  "/chat/groups/:groupId",
  // 🔒 Security Layer: Rate limiting, flood prevention
  chatIPBlacklist,
  chatRateLimit,
  chatFloodPrevention,
  // ✅ Session & Auth: Validate user session
  authCheckUser,
  chatSessionValidation,
  // 🛡️ Content & Resources: Filter content, limit resources
  chatRequestValidation,
  chatContentFiltering,
  chatResourceLimits,
  // 📊 Monitoring: Audit logging and performance
  chatAuditLogging,
  chatPerformanceMonitoring,
  // 🎯 Validation: Express validators
  require("./validations/expressValidators").chatValidators.updateGroup,
  chatController.updateGroup
);

app.post(
  "/chat/groups/:groupId/members",
  // 🔒 Security Layer: Rate limiting, flood prevention
  chatIPBlacklist,
  chatRateLimit,
  chatFloodPrevention,
  // ✅ Session & Auth: Validate user session
  authCheckUser,
  chatSessionValidation,
  // 🛡️ Resources: Limit member additions
  chatResourceLimits,
  // 📊 Monitoring: Audit logging and performance
  chatAuditLogging,
  chatPerformanceMonitoring,
  // 🎯 Validation: Request validation
  chatRequestValidation,
  chatController.addGroupMember
);

app.delete(
  "/chat/groups/:groupId/members/:userId",
  // 🔒 Security Layer: Rate limiting
  chatIPBlacklist,
  chatRateLimit,
  // ✅ Session & Auth: Validate user session
  authCheckUser,
  chatSessionValidation,
  // 📊 Monitoring: Audit logging and performance
  chatAuditLogging,
  chatPerformanceMonitoring,
  // 🎯 Validation: Request validation
  chatRequestValidation,
  chatController.removeGroupMember
);

app.get(
  "/chat/groups",
  // 🔒 Security Layer: Rate limiting
  chatIPBlacklist,
  chatRateLimit,
  // ✅ Session & Auth: Validate user session
  authCheckUser,
  chatSessionValidation,
  // 📊 Monitoring: Audit logging and performance
  chatAuditLogging,
  chatPerformanceMonitoring,
  chatController.getUserGroups
);

// Chat reactions routes
app.post(
  "/chat/messages/:messageId/reactions",
  // 🔒 Security Layer: Rate limiting, flood prevention
  chatIPBlacklist,
  chatRateLimit,
  chatFloodPrevention,
  // ✅ Session & Auth: Validate user session
  authCheckUser,
  chatSessionValidation,
  // 🛡️ Resources: Limit reactions
  chatResourceLimits,
  // 📊 Monitoring: Audit logging and performance
  chatAuditLogging,
  chatPerformanceMonitoring,
  // 🎯 Validation: Request validation
  chatRequestValidation,
  chatController.addMessageReaction
);

app.delete(
  "/chat/messages/:messageId/reactions",
  // 🔒 Security Layer: Rate limiting
  chatIPBlacklist,
  chatRateLimit,
  // ✅ Session & Auth: Validate user session
  authCheckUser,
  chatSessionValidation,
  // 📊 Monitoring: Audit logging and performance
  chatAuditLogging,
  chatPerformanceMonitoring,
  // 🎯 Validation: Request validation
  chatRequestValidation,
  chatController.removeMessageReaction
);

app.put(
  "/chat/messages/:messageId/read",
  // 🔒 Security Layer: Rate limiting
  chatIPBlacklist,
  chatRateLimit,
  // ✅ Session & Auth: Validate user session
  authCheckUser,
  chatSessionValidation,
  // 📊 Monitoring: Audit logging and performance
  chatAuditLogging,
  chatPerformanceMonitoring,
  // 🎯 Validation: Request validation
  chatRequestValidation,
  chatController.markMessageAsRead
);

app.delete(
  "/chat/messages/:messageId",
  // 🔒 Security Layer: Rate limiting
  chatIPBlacklist,
  chatRateLimit,
  // ✅ Session & Auth: Validate user session
  authCheckUser,
  chatSessionValidation,
  // 📊 Monitoring: Audit logging and performance
  chatAuditLogging,
  chatPerformanceMonitoring,
  // 🎯 Validation: Request validation
  chatRequestValidation,
  chatController.deleteMessage
);

app.get(
  "/chat/messages/search",
  // 🔒 Security Layer: Rate limiting, flood prevention
  chatIPBlacklist,
  chatRateLimit,
  chatFloodPrevention,
  // ✅ Session & Auth: Validate user session
  authCheckUser,
  chatSessionValidation,
  // 📊 Monitoring: Audit logging and performance
  chatAuditLogging,
  chatPerformanceMonitoring,
  // 🎯 Validation: Request validation
  chatRequestValidation,
  chatController.searchMessages
);

// Chat user management
app.get(
  "/chat/user/:id",
  // 🔒 Security Layer: Rate limiting, IP blacklist
  chatIPBlacklist,
  chatRateLimit,
  // ✅ Session & Auth: Validate user session
  authCheckUser,
  chatSessionValidation,
  // 🛡️ Privacy Protection: Check access permissions
  chatPrivacyProtection,
  // 📊 Monitoring: Audit logging and performance
  chatAuditLogging,
  chatPerformanceMonitoring,
  // 🎯 Validation: Request validation
  chatRequestValidation,
  chatController.getChatUserById
);

app.put(
  "/chat/user/:id",
  // 🔒 Security Layer: Rate limiting, flood prevention
  chatIPBlacklist,
  chatRateLimit,
  chatFloodPrevention,
  // ✅ Session & Auth: Validate user session
  authCheckUser,
  chatSessionValidation,
  // 🛡️ Content & Resources: Filter content, limit resources
  chatRequestValidation,
  chatContentFiltering,
  chatResourceLimits,
  // 📊 Monitoring: Audit logging and performance
  chatAuditLogging,
  chatPerformanceMonitoring,
  // 🎯 Validation: Express validators
  require("./validations/expressValidators").chatValidators.updateChatUser,
  chatController.updateChatUser
);

app.delete(
  "/chat/user/:id",
  // 🔒 Security Layer: Rate limiting
  chatIPBlacklist,
  chatRateLimit,
  // ✅ Session & Auth: Validate admin session
  authCheckAdmin,
  chatSessionValidation,
  // 📊 Monitoring: Audit logging and performance
  chatAuditLogging,
  chatPerformanceMonitoring,
  // 🎯 Validation: Request validation
  chatRequestValidation,
  chatController.deleteChatUser
);

// Chat friends management
app.post(
  "/chat/user/:id/friend/:friendId",
  // 🔒 Security Layer: Rate limiting, flood prevention
  chatIPBlacklist,
  chatRateLimit,
  chatFloodPrevention,
  // ✅ Session & Auth: Validate user session
  authCheckUser,
  chatSessionValidation,
  // 🛡️ Resources: Limit friend additions
  chatResourceLimits,
  // 📊 Monitoring: Audit logging and performance
  chatAuditLogging,
  chatPerformanceMonitoring,
  // 🎯 Validation: Request validation
  chatRequestValidation,
  chatController.addFriend
);

app.delete(
  "/chat/user/:id/friend/:friendId",
  // 🔒 Security Layer: Rate limiting
  chatIPBlacklist,
  chatRateLimit,
  // ✅ Session & Auth: Validate user session
  authCheckUser,
  chatSessionValidation,
  // 📊 Monitoring: Audit logging and performance
  chatAuditLogging,
  chatPerformanceMonitoring,
  // 🎯 Validation: Request validation
  chatRequestValidation,
  chatController.removeFriend
);

app.get(
  "/chat/user/:id/friends",
  // 🔒 Security Layer: Rate limiting
  chatIPBlacklist,
  chatRateLimit,
  // ✅ Session & Auth: Validate user session
  authCheckUser,
  chatSessionValidation,
  // 🛡️ Privacy Protection: Check access permissions
  chatPrivacyProtection,
  // 📊 Monitoring: Audit logging and performance
  chatAuditLogging,
  chatPerformanceMonitoring,
  // 🎯 Validation: Request validation
  chatRequestValidation,
  chatController.getFriends
);

// Chat search and stats
app.get(
  "/chat/search",
  // 🔒 Security Layer: Rate limiting, flood prevention
  chatIPBlacklist,
  chatRateLimit,
  chatFloodPrevention,
  // ✅ Session & Auth: Validate user session
  authCheckUser,
  chatSessionValidation,
  // 📊 Monitoring: Audit logging and performance
  chatAuditLogging,
  chatPerformanceMonitoring,
  // 🎯 Validation: Request validation
  chatRequestValidation,
  chatController.searchChatUsers
);

app.get(
  "/chat/stats/status",
  // 🔒 Security Layer: Rate limiting
  chatIPBlacklist,
  chatRateLimit,
  // ✅ Session & Auth: Validate admin session
  authCheckAdmin,
  chatSessionValidation,
  // 📊 Monitoring: Audit logging and performance
  chatAuditLogging,
  chatPerformanceMonitoring,
  chatController.getStatusStats
);

// Admin - Get all chat users
app.get(
  "/chat/users",
  // 🔒 Security Layer: Rate limiting
  chatIPBlacklist,
  chatRateLimit,
  // ✅ Session & Auth: Validate admin session
  authCheckAdmin,
  chatSessionValidation,
  // 📊 Monitoring: Audit logging and performance
  chatAuditLogging,
  chatPerformanceMonitoring,
  chatController.getAllChatUsers
);

// =====================================================================================
// FACE RECOGNITION ROUTES - Bảo mật cấp độ 5 với 2FA
// =====================================================================================

// Import faceID routes với bảo mật cao cấp
const faceIDRoutes = require("./routes/faceID");

// Áp dụng faceID routes với bảo mật đặc biệt
app.use("/api/faceID", faceIDRoutes);

// =====================================================================================
// EVENT ROUTES (TODO)
// =====================================================================================

app.get(
  "/event",
  authCheckUser,
  // TODO: Implement event controller
  (req, res) =>
    res.render("events", {
      title: "Events",
      currentUser: req.user,
      events: [], // TODO: Add real events
    })
);

// =====================================================================================
// ERROR HANDLING MIDDLEWARE (phải đặt cuối)
// =====================================================================================

// 404 handler
app.use(require("./middlewares/errorHandler").errorHandler404);

// Global error handler
app.use(errorHandlerGlobal);

// =====================================================================================
// SERVER INITIALIZATION
// =====================================================================================

/**
 * Khởi động server
 */
async function startServer() {
  try {
    // Kết nối database
    await connectDB();

    // Khởi động server
    server.listen(PORT, () => {
      console.log(`🚀 Server đang chạy trên port ${PORT}`);
      console.log(`📝 Environment: ${NODE_ENV}`);
      console.log(`🔗 URL: http://localhost:${PORT}`);

      if (NODE_ENV === "development") {
        console.log(`📊 API Docs: http://localhost:${PORT}/api`);
      }
    });

    // Graceful shutdown
    process.on("SIGTERM", gracefulShutdown);
    process.on("SIGINT", gracefulShutdown);

    function gracefulShutdown(signal) {
      console.log(`📴 Nhận tín hiệu ${signal}. Đang tắt server...`);

      server.close(async () => {
        console.log("🛑 Server đã tắt");

        // Đóng kết nối database
        await mongoose.connection.close();

        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error("❌ Force shutdown after timeout");
        process.exit(1);
      }, 10000);
    }
  } catch (error) {
    console.error("❌ Lỗi khởi động server:", error);
    process.exit(1);
  }
}

// Khởi động server
startServer();

module.exports = app;
