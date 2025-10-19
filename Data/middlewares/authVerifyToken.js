/**
 * Middleware xác thực JWT token
 * Kiểm tra token trong cookie và xác minh tính hợp lệ
 */

const { verifyToken } = require("../utils/auth");
const User = require("../models/User");

/**
 * Middleware xác thực JWT token từ cookie
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const authVerifyToken = async (req, res, next) => {
  try {
    // Lấy token từ cookie
    const token =
      req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy token xác thực",
      });
    }

    // Xác minh token
    const decoded = verifyToken(token);
    if (!decoded) {
      // Xóa cookie không hợp lệ
      res.clearCookie("token");
      return res.status(401).json({
        success: false,
        message: "Token không hợp lệ hoặc đã hết hạn",
      });
    }

    // Kiểm tra user có tồn tại không
    const user = await User.findById(decoded.id).select("+pass");
    if (!user) {
      // Xóa cookie nếu user không tồn tại
      res.clearCookie("token");
      return res.status(401).json({
        success: false,
        message: "Người dùng không tồn tại",
      });
    }

    // Thêm thông tin user vào request
    req.user = {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
      age: user.age,
    };

    // Log hoạt động (có thể tắt trong production)
    if (process.env.NODE_ENV === "development") {
      console.log(`🔐 Token verified for user: ${user.email} (${user.role})`);
    }

    next();
  } catch (error) {
    console.error("❌ Lỗi xác thực token:", error.message);

    // Xóa cookie trong trường hợp lỗi
    res.clearCookie("token");

    return res.status(500).json({
      success: false,
      message: "Lỗi server khi xác thực token",
    });
  }
};

/**
 * Middleware xác thực JWT token (không bắt buộc)
 * Cho phép request tiếp tục ngay cả khi không có token
 */
const authVerifyTokenOptional = async (req, res, next) => {
  try {
    const token =
      req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        const user = await User.findById(decoded.id);
        if (user) {
          req.user = {
            id: user._id,
            email: user.email,
            role: user.role,
            name: user.name,
            age: user.age,
          };
        }
      }
    }

    next();
  } catch (error) {
    // Không làm gián đoạn request nếu có lỗi
    console.error("⚠️ Lỗi xác thực token tùy chọn:", error.message);
    next();
  }
};

module.exports = {
  authVerifyToken,
  authVerifyTokenOptional,
};
