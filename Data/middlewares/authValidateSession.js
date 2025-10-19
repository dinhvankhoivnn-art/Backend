/**
 * Middleware xác thực session và trạng thái user
 * Kiểm tra tính hợp lệ của session và trạng thái tài khoản
 */

const User = require("../models/User");
const CreateNewUser = require("../models/CreateNewUser");

/**
 * Middleware xác thực session và kiểm tra trạng thái user
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const authValidateSession = async (req, res, next) => {
  try {
    // Kiểm tra user đã được xác thực từ middleware trước
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Session không hợp lệ",
      });
    }

    const userId = req.user.id;

    // Kiểm tra user có tồn tại trong DB không
    const user = await User.findById(userId);
    if (!user) {
      // Xóa cookie và trả về lỗi
      res.clearCookie("token");
      return res.status(401).json({
        success: false,
        message: "Tài khoản không tồn tại hoặc đã bị xóa",
      });
    }

    // Kiểm tra thông tin user có thay đổi không (security check)
    if (user.email !== req.user.email || user.role !== req.user.role) {
      // Thông tin không khớp, có thể bị hack
      console.warn(`🚨 Session data mismatch for user ${userId}:`, {
        sessionEmail: req.user.email,
        dbEmail: user.email,
        sessionRole: req.user.role,
        dbRole: user.role,
        ip: req.ip || req.connection.remoteAddress,
        timestamp: new Date().toISOString(),
      });

      // Xóa cookie và yêu cầu đăng nhập lại
      res.clearCookie("token");
      return res.status(401).json({
        success: false,
        message: "Session không hợp lệ. Vui lòng đăng nhập lại.",
      });
    }

    // Cập nhật thông tin user mới nhất vào request
    req.user = {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
      age: user.age,
      address: user.address,
      lastActivity: new Date(),
    };

    next();
  } catch (error) {
    console.error("❌ Lỗi xác thực session:", error.message);

    // Xóa cookie trong trường hợp lỗi
    res.clearCookie("token");

    return res.status(500).json({
      success: false,
      message: "Lỗi server khi xác thực session",
    });
  }
};

/**
 * Middleware kiểm tra tài khoản user đã được duyệt (cho CreateNewUser)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const authCheckApprovedAccount = async (req, res, next) => {
  try {
    // Kiểm tra user đã được xác thực chưa
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Chưa xác thực người dùng",
      });
    }

    // Admin không cần kiểm tra
    if (req.user.role === "admin") {
      return next();
    }

    // Kiểm tra trạng thái tài khoản từ CreateNewUser
    const createNewUser = await CreateNewUser.findOne({
      email: req.user.email,
    });

    if (!createNewUser) {
      return res.status(403).json({
        success: false,
        message: "Tài khoản chưa được đăng ký đúng cách",
      });
    }

    if (createNewUser.status !== "active") {
      let message = "Tài khoản chưa được duyệt bởi admin";

      if (createNewUser.status === "blocked") {
        message = "Tài khoản đã bị khóa";
      } else if (createNewUser.status === "suspended") {
        message = "Tài khoản đã bị tạm ngừng";
      }

      return res.status(403).json({
        success: false,
        message: message,
        status: createNewUser.status,
        rejectionReason: createNewUser.rejectionReason,
      });
    }

    next();
  } catch (error) {
    console.error("❌ Lỗi kiểm tra tài khoản approved:", error.message);

    return res.status(500).json({
      success: false,
      message: "Lỗi server khi kiểm tra trạng thái tài khoản",
    });
  }
};

/**
 * Middleware kiểm tra hoạt động gần đây của user
 * Phát hiện tài khoản bị idle quá lâu
 */
const authCheckRecentActivity = (maxIdleMinutes = 60) => {
  return async (req, res, next) => {
    try {
      // Kiểm tra user đã được xác thực chưa
      if (!req.user) {
        return next(); // Để middleware khác xử lý
      }

      const userId = req.user.id;
      const user = await User.findById(userId);

      if (!user) {
        return next();
      }

      const lastActivity = user.updatedAt || user.createdAt;
      const now = new Date();
      const timeDiff = (now - lastActivity) / (1000 * 60); // phút

      // Nếu hoạt động cuối quá lâu
      if (timeDiff > maxIdleMinutes) {
        console.warn(
          `⏰ User inactive too long: ${req.user.email}, last activity: ${lastActivity}`
        );

        // Có thể logout hoặc yêu cầu xác thực lại
        // Hiện tại chỉ log, không block
      }

      // Cập nhật thời gian hoạt động cuối
      await User.findByIdAndUpdate(userId, { updatedAt: now });

      next();
    } catch (error) {
      console.error("❌ Lỗi kiểm tra hoạt động gần đây:", error.message);
      // Không block request nếu có lỗi
      next();
    }
  };
};

/**
 * Middleware kiểm tra số lượng đăng nhập thất bại
 * Chặn tài khoản nếu có quá nhiều lần đăng nhập sai
 */
const authCheckLoginAttempts = async (req, res, next) => {
  try {
    // Kiểm tra user đã được xác thực chưa
    if (!req.user) {
      return next();
    }

    // Logic kiểm tra số lần đăng nhập thất bại
    // Có thể thêm field failedLoginAttempts vào User model
    // Hiện tại bỏ qua, chỉ làm placeholder

    next();
  } catch (error) {
    console.error("❌ Lỗi kiểm tra login attempts:", error.message);
    next();
  }
};

module.exports = {
  authValidateSession,
  authCheckApprovedAccount,
  authCheckRecentActivity,
  authCheckLoginAttempts,
};
