/**
 * Routes cho Face Recognition với bảo mật cấp độ 5
 * Chỉ dành cho admin với xác thực đa lớp (2FA, OTP, mã dự phòng)
 * Tích hợp hệ thống tracking toàn diện
 */

const express = require("express");
const router = express.Router();

// Import controllers
const faceRecognitionController = require("../controllers/faceRecognitionController");
const locationController = require("../controllers/locationController");

// Import middlewares bảo mật cao cấp
const {
  require2FA,
  sendOTP,
  verifyOTP,
  verifyBackupCode,
  generateBackupCodes,
  check2FAStatus,
  logout2FA,
} = require("../middlewares/advancedSecurityAuth");

// Import middlewares khác
const { authVerifyToken } = require("../middlewares/authVerifyToken");
const { authCheckAdmin } = require("../middlewares/authCheckAdmin");
const { authValidateSession } = require("../middlewares/authValidateSession");
const { sanitizeInput } = require("../middlewares/securitySanitize");
const {
  trackUserActivity,
  trackGPSLocation,
  trackDeviceInfo,
  trackSession,
} = require("../middlewares/webTracking");

// Import validators
const { body, param, query } = require("express-validator");

// ============================================================================
// MIDDLEWARE BẢO MẬT TOÀN CỤC CHO FACEID ROUTES
// ============================================================================

// Áp dụng xác thực token cho tất cả routes
router.use(authVerifyToken);
router.use(authValidateSession);

// Áp dụng sanitization cho tất cả input
router.use(sanitizeInput);

// Áp dụng tracking toàn diện cho mọi request
router.use((req, res, next) => {
  // Track hoạt động người dùng
  trackUserActivity(req, res, () => {});

  // Track vị trí GPS
  if (req.body.latitude && req.body.longitude) {
    trackGPSLocation(req, res, () => {});
  }

  // Track thông tin thiết bị
  trackDeviceInfo(req, res, () => {});

  // Track session
  trackSession(req, res, () => {});

  next();
});

// ============================================================================
// ROUTES XÁC THỰC 2FA
// ============================================================================

/**
 * POST /api/faceID/2fa/send-otp
 * Gửi OTP cho xác thực 2FA
 */
router.post(
  "/2fa/send-otp",
  [body("userId").optional().isMongoId().withMessage("User ID không hợp lệ")],
  sendOTP
);

/**
 * POST /api/faceID/2fa/verify-otp
 * Xác minh OTP
 */
router.post(
  "/2fa/verify-otp",
  [
    body("otpId").notEmpty().withMessage("OTP ID là bắt buộc"),
    body("otp")
      .notEmpty()
      .isLength({ min: 6, max: 8 })
      .withMessage("OTP không hợp lệ"),
  ],
  verifyOTP
);

/**
 * POST /api/faceID/2fa/verify-backup-code
 * Xác minh mã dự phòng
 */
router.post(
  "/2fa/verify-backup-code",
  [
    body("backupCode")
      .notEmpty()
      .isLength({ min: 8, max: 12 })
      .withMessage("Mã dự phòng không hợp lệ"),
  ],
  verifyBackupCode
);

/**
 * POST /api/faceID/2fa/generate-backup-codes
 * Tạo mã dự phòng mới
 */
router.post("/2fa/generate-backup-codes", generateBackupCodes);

/**
 * GET /api/faceID/2fa/status
 * Kiểm tra trạng thái xác thực 2FA
 */
router.get("/2fa/status", check2FAStatus);

/**
 * POST /api/faceID/2fa/logout
 * Đăng xuất khỏi xác thực 2FA
 */
router.post("/2fa/logout", logout2FA);

// ============================================================================
// ROUTES CHÍNH CHO FACE RECOGNITION (YÊU CẦU 2FA)
// ============================================================================

/**
 * POST /api/faceID/encode
 * Mã hóa dữ liệu khuôn mặt với cấp độ 5
 * Yêu cầu: Admin + 2FA + Tracking đầy đủ
 */
router.post(
  "/encode",
  require2FA,
  [
    body("faceId")
      .notEmpty()
      .isLength({ min: 3, max: 100 })
      .withMessage("Face ID không hợp lệ"),
    body("faceEncoding")
      .notEmpty()
      .custom((value) => {
        if (
          !value.primary ||
          !Array.isArray(value.primary) ||
          value.primary.length !== 128
        ) {
          throw new Error("Face encoding phải có đúng 128 giá trị đặc trưng");
        }
        return true;
      }),
    body("facialLandmarks").optional().isObject(),
    body("facialFeatures").optional().isObject(),
    body("technicalSpecs").optional().isObject(),
    body("securityLevel")
      .optional()
      .isIn(["low", "medium", "high", "critical"]),
    body("expiresAt").optional().isISO8601(),
    body("notes").optional().isLength({ max: 1000 }),
  ],
  faceRecognitionController.encodeFaceData
);

/**
 * POST /api/faceID/decode
 * Giải mã dữ liệu khuôn mặt
 * Yêu cầu: Admin + 2FA + Tracking đầy đủ
 */
router.post(
  "/decode",
  require2FA,
  [
    body("faceId").notEmpty().withMessage("Face ID là bắt buộc"),
    body("encryptedData").notEmpty().withMessage("Encrypted data là bắt buộc"),
    body("checksum").notEmpty().withMessage("Checksum là bắt buộc"),
  ],
  faceRecognitionController.decodeFaceData
);

/**
 * POST /api/faceID/compare
 * So sánh 2 khuôn mặt
 * Yêu cầu: Admin + 2FA + Tracking đầy đủ
 */
router.post(
  "/compare",
  require2FA,
  [
    body("faceId1").notEmpty().withMessage("Face ID 1 là bắt buộc"),
    body("faceId2").notEmpty().withMessage("Face ID 2 là bắt buộc"),
    body("threshold").optional().isFloat({ min: 0, max: 1 }),
  ],
  faceRecognitionController.compareFacesController
);

/**
 * GET /api/faceID/user/:userId
 * Lấy danh sách face data của user
 * Yêu cầu: Admin + 2FA + Tracking đầy đủ
 */
router.get(
  "/user/:userId",
  require2FA,
  [
    param("userId").isMongoId().withMessage("User ID không hợp lệ"),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 50 }),
    query("securityLevel")
      .optional()
      .isIn(["low", "medium", "high", "critical"]),
    query("minConfidence").optional().isInt({ min: 0, max: 100 }),
    query("isVerified").optional().isIn(["true", "false"]),
    query("isActive").optional().isIn(["true", "false"]),
  ],
  faceRecognitionController.getUserFaceData
);

/**
 * GET /api/faceID/:faceId
 * Lấy thông tin face data theo ID
 * Yêu cầu: Admin + 2FA + Tracking đầy đủ
 */
router.get(
  "/:faceId",
  require2FA,
  [param("faceId").notEmpty().isLength({ min: 3, max: 100 })],
  faceRecognitionController.getFaceById
);

/**
 * PUT /api/faceID/:faceId
 * Cập nhật face data
 * Yêu cầu: Admin + 2FA + Tracking đầy đủ
 */
router.put(
  "/:faceId",
  require2FA,
  [
    param("faceId").notEmpty().isLength({ min: 3, max: 100 }),
    body("technicalSpecs").optional().isObject(),
    body("securityLevel")
      .optional()
      .isIn(["low", "medium", "high", "critical"]),
    body("expiresAt").optional().isISO8601(),
    body("notes").optional().isLength({ max: 1000 }),
    body("tags").optional().isArray(),
  ],
  faceRecognitionController.updateFaceData
);

/**
 * DELETE /api/faceID/:faceId
 * Xóa face data
 * Yêu cầu: Admin + 2FA + Tracking đầy đủ
 */
router.delete(
  "/:faceId",
  require2FA,
  [param("faceId").notEmpty().isLength({ min: 3, max: 100 })],
  faceRecognitionController.deleteFaceData
);

/**
 * POST /api/faceID/:faceId/verify
 * Xác minh face data
 * Yêu cầu: Admin + 2FA + Tracking đầy đủ
 */
router.post(
  "/:faceId/verify",
  require2FA,
  [
    param("faceId").notEmpty().isLength({ min: 3, max: 100 }),
    body("verificationMethod")
      .optional()
      .isIn(["manual", "automatic", "biometric", "admin"]),
    body("notes").optional().isLength({ max: 1000 }),
  ],
  faceRecognitionController.verifyFaceData
);

/**
 * GET /api/faceID/stats/overview
 * Lấy thống kê tổng thể face recognition
 * Yêu cầu: Admin + 2FA + Tracking đầy đủ
 */
router.get(
  "/stats/overview",
  require2FA,
  [
    query("startDate").optional().isISO8601(),
    query("endDate").optional().isISO8601(),
  ],
  faceRecognitionController.getFaceRecognitionStats
);

/**
 * POST /api/faceID/rotate-key
 * Xoay vòng master key mã hóa
 * Yêu cầu: Admin + 2FA + Tracking đầy đủ
 */
router.post(
  "/rotate-key",
  require2FA,
  faceRecognitionController.rotateEncryptionKey
);

/**
 * GET /api/faceID/security/info
 * Lấy thông tin bảo mật hệ thống
 * Yêu cầu: Admin + 2FA + Tracking đầy đủ
 */
router.get(
  "/security/info",
  require2FA,
  faceRecognitionController.getSecurityInfo
);

// ============================================================================
// ROUTES CHO LOCATION TRACKING KÈM FACE RECOGNITION
// ============================================================================

/**
 * POST /api/faceID/location/current
 * Ghi nhận vị trí hiện tại kèm face recognition
 * Yêu cầu: Admin + 2FA + Tracking đầy đủ
 */
router.post(
  "/location/current",
  require2FA,
  [
    body("latitude")
      .isFloat({ min: -90, max: 90 })
      .withMessage("Latitude không hợp lệ"),
    body("longitude")
      .isFloat({ min: -180, max: 180 })
      .withMessage("Longitude không hợp lệ"),
    body("accuracy").optional().isFloat({ min: 0 }),
    body("country").optional().isLength({ max: 100 }),
    body("city").optional().isLength({ max: 100 }),
    body("region").optional().isLength({ max: 100 }),
    body("deviceInfo").optional().isObject(),
    body("networkInfo").optional().isObject(),
    body("accessInfo").optional().isObject(),
    body("securityInfo").optional().isObject(),
    body("metadata").optional().isObject(),
  ],
  locationController.getCurrentLocation
);

/**
 * GET /api/faceID/location/history/:userId
 * Lịch sử vị trí kèm face recognition data
 * Yêu cầu: Admin + 2FA + Tracking đầy đủ
 */
router.get(
  "/location/history/:userId",
  require2FA,
  [
    param("userId").isMongoId().withMessage("User ID không hợp lệ"),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("startDate").optional().isISO8601(),
    query("endDate").optional().isISO8601(),
    query("country").optional().isLength({ max: 100 }),
    query("city").optional().isLength({ max: 100 }),
    query("minRiskScore").optional().isInt({ min: 0, max: 100 }),
    query("maxRiskScore").optional().isInt({ min: 0, max: 100 }),
  ],
  locationController.getLocationHistory
);

/**
 * GET /api/faceID/location/suspicious
 * Vị trí đáng ngờ kèm face recognition analysis
 * Yêu cầu: Admin + 2FA + Tracking đầy đủ
 */
router.get(
  "/location/suspicious",
  require2FA,
  [
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("minRiskScore").optional().isInt({ min: 0, max: 100 }),
  ],
  locationController.getSuspiciousLocations
);

/**
 * GET /api/faceID/location/stats/countries
 * Thống kê vị trí theo quốc gia kèm face recognition
 * Yêu cầu: Admin + 2FA + Tracking đầy đủ
 */
router.get(
  "/location/stats/countries",
  require2FA,
  [
    query("startDate").optional().isISO8601(),
    query("endDate").optional().isISO8601(),
  ],
  locationController.getLocationStatsByCountry
);

// ============================================================================
// MIDDLEWARE XỬ LÝ LỖI CHO FACEID ROUTES
// ============================================================================

/**
 * Middleware xử lý lỗi cho faceID routes
 */
router.use((error, req, res, next) => {
  console.error("❌ FaceID Route Error:", {
    error: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
    timestamp: new Date(),
  });

  // Track lỗi bảo mật
  trackUserActivity(req, res, () => {});

  return res.status(500).json({
    success: false,
    message: "Lỗi server trong hệ thống Face Recognition",
    ...(process.env.NODE_ENV === "development" && {
      error: error.message,
      stack: error.stack,
    }),
    securityLevel: "critical",
    timestamp: new Date(),
  });
});

/**
 * Middleware xử lý 404 cho faceID routes
 */
router.use((req, res) => {
  // Track request không hợp lệ
  trackUserActivity(req, res, () => {});

  return res.status(404).json({
    success: false,
    message: "Face Recognition endpoint không tồn tại",
    availableEndpoints: [
      "POST /api/faceID/encode",
      "POST /api/faceID/decode",
      "POST /api/faceID/compare",
      "GET /api/faceID/user/:userId",
      "GET /api/faceID/:faceId",
      "PUT /api/faceID/:faceId",
      "DELETE /api/faceID/:faceId",
      "POST /api/faceID/:faceId/verify",
      "GET /api/faceID/stats/overview",
      "POST /api/faceID/rotate-key",
      "GET /api/faceID/security/info",
      "POST /api/faceID/2fa/*",
      "GET /api/faceID/2fa/*",
      "POST /api/faceID/location/*",
      "GET /api/faceID/location/*",
    ],
    securityLevel: "high",
    timestamp: new Date(),
  });
});

module.exports = router;
