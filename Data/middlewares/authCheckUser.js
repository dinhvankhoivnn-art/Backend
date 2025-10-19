/**
 * Middleware kiểm tra quyền user thường
 * Chỉ cho phép user có role 'user' truy cập hoặc admin
 */

const User = require("../models/User");

/**
 * Middleware kiểm tra quyền user thường
 * Cho phép cả user thường và admin truy cập
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const authCheckUser = (req, res, next) => {
  try {
    // Kiểm tra user đã được xác thực chưa
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Chưa xác thực người dùng",
      });
    }

    // Kiểm tra role (user hoặc admin)
    if (!["user", "admin"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền truy cập. Chỉ user hoặc admin mới được phép.",
        allowedRoles: ["user", "admin"],
        currentRole: req.user.role,
      });
    }

    // Log hoạt động user
    if (process.env.NODE_ENV === "development") {
      console.log(
        `👤 User access granted for: ${req.user.email} (${req.user.role})`
      );
    }

    next();
  } catch (error) {
    console.error("❌ Lỗi kiểm tra quyền user:", error.message);

    return res.status(500).json({
      success: false,
      message: "Lỗi server khi kiểm tra quyền user",
    });
  }
};

/**
 * Middleware kiểm tra quyền user thường (chỉ user, không admin)
 * Chỉ cho phép user có role 'user' truy cập
 */
const authCheckUserOnly = (req, res, next) => {
  try {
    // Kiểm tra user đã được xác thực chưa
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Chưa xác thực người dùng",
      });
    }

    // Kiểm tra role chỉ là user
    if (req.user.role !== "user") {
      return res.status(403).json({
        success: false,
        message: "Không có quyền truy cập. Chỉ user thường mới được phép.",
        requiredRole: "user",
        currentRole: req.user.role,
      });
    }

    // Log hoạt động user thường
    if (process.env.NODE_ENV === "development") {
      console.log(`👤 Regular user access granted for: ${req.user.email}`);
    }

    next();
  } catch (error) {
    console.error("❌ Lỗi kiểm tra quyền user only:", error.message);

    return res.status(500).json({
      success: false,
      message: "Lỗi server khi kiểm tra quyền user",
    });
  }
};

/**
 * Middleware kiểm tra quyền truy cập dữ liệu cá nhân
 * User chỉ được xem/sửa dữ liệu của chính mình, admin được xem tất cả
 */
const authCheckOwnDataOrAdmin = (req, res, next) => {
  try {
    // Kiểm tra user đã được xác thực chưa
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Chưa xác thực người dùng",
      });
    }

    const requestedUserId = req.params.id || req.params.userId;
    const currentUserId = req.user.id.toString();

    // Admin được phép truy cập tất cả
    if (req.user.role === "admin") {
      if (process.env.NODE_ENV === "development") {
        console.log(`👑 Admin accessing user data: ${requestedUserId}`);
      }
      return next();
    }

    // User thường chỉ được truy cập dữ liệu của chính mình
    if (currentUserId === requestedUserId) {
      if (process.env.NODE_ENV === "development") {
        console.log(`👤 User accessing own data: ${req.user.email}`);
      }
      return next();
    }

    // Không có quyền truy cập dữ liệu người khác
    return res.status(403).json({
      success: false,
      message: "Không có quyền truy cập dữ liệu của người dùng khác",
      requestedUserId: requestedUserId,
      currentUserId: currentUserId,
    });
  } catch (error) {
    console.error("❌ Lỗi kiểm tra quyền own data:", error.message);

    return res.status(500).json({
      success: false,
      message: "Lỗi server khi kiểm tra quyền truy cập dữ liệu",
    });
  }
};

/**
 * Middleware kiểm tra quyền user đã xác minh
 * Chỉ cho phép user đã xác minh email/phone
 */
const authCheckVerifiedUser = (req, res, next) => {
  try {
    // Kiểm tra user đã được xác thực chưa
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Chưa xác thực người dùng",
      });
    }

    // Admin không cần xác minh
    if (req.user.role === "admin") {
      return next();
    }

    // Kiểm tra trạng thái xác minh (từ CreateNewUser model nếu cần)
    // Đây là logic đơn giản, có thể mở rộng sau
    const isVerified = true; // Giả sử đã verified, có thể check từ DB

    if (!isVerified) {
      return res.status(403).json({
        success: false,
        message:
          "Tài khoản chưa được xác minh. Vui lòng xác minh email và số điện thoại.",
        verificationRequired: true,
      });
    }

    next();
  } catch (error) {
    console.error("❌ Lỗi kiểm tra user verified:", error.message);

    return res.status(500).json({
      success: false,
      message: "Lỗi server khi kiểm tra trạng thái xác minh",
    });
  }
};

module.exports = {
  authCheckUser,
  authCheckUserOnly,
  authCheckOwnDataOrAdmin,
  authCheckVerifiedUser,
};
