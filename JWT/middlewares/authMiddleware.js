const { default: status } = require("http-status");
const jsonwebtoken = require("jsonwebtoken");
const { getTime } = require("../helpers/getTime");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  try {
    // Kiểm tra header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(status.UNAUTHORIZED).json({
        success: false,
        message: "Không tìm thấy token hoặc token không hợp lệ",
        time: getTime(),
      });
    }

    // Lấy token từ header
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(status.UNAUTHORIZED).json({
        success: false,
        message: "Token không được cung cấp",
        time: getTime(),
      });
    }

    // Kiểm tra JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET không được định nghĩa");
      return res.status(status.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Lỗi cấu hình server",
        time: getTime(),
      });
    }

    // Xác minh token
    const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET);

    // Kiểm tra thông tin cần thiết trong token
    if (!decoded.id || !decoded.role) {
      return res.status(status.UNAUTHORIZED).json({
        success: false,
        message: "Token không hợp lệ",
        time: getTime(),
      });
    }

    // Tìm user trong database để đảm bảo user vẫn tồn tại và active
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(status.UNAUTHORIZED).json({
        success: false,
        message: "User không tồn tại",
        time: getTime(),
      });
    }

    if (!user.isActive) {
      return res.status(status.UNAUTHORIZED).json({
        success: false,
        message: "Tài khoản đã bị vô hiệu hóa",
        time: getTime(),
      });
    }

    // Gán thông tin user vào req.user
    req.user = {
      id: user._id,
      role: user.role,
      name: user.name,
      email: user.email,
      isActive: user.isActive,
      ...decoded, // Bao gồm time, uuid từ token
    };

    // Chuyển tiếp đến middleware hoặc route tiếp theo
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);

    // Xử lý các loại lỗi khác nhau
    if (error.name === "TokenExpiredError") {
      return res.status(status.UNAUTHORIZED).json({
        success: false,
        message: "Token đã hết hạn",
        time: getTime(),
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(status.UNAUTHORIZED).json({
        success: false,
        message: "Token không hợp lệ",
        time: getTime(),
      });
    }

    if (error.name === "NotBeforeError") {
      return res.status(status.UNAUTHORIZED).json({
        success: false,
        message: "Token chưa có hiệu lực",
        time: getTime(),
      });
    }

    return res.status(status.UNAUTHORIZED).json({
      success: false,
      message: "Lỗi xác thực token",
      time: getTime(),
    });
  }
};

module.exports = {
  authMiddleware,
};
