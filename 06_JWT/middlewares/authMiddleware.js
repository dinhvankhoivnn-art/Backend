const jwt = require("jsonwebtoken");

// Middleware kiểm tra JWT
const authMiddleware = (req, res, next) => {
  // Lấy token từ header Authorization (Bearer <token>) hoặc cookie
  const token = req.headers.authorization?.split(" ")[1] || req.cookies.token;

  // Kiểm tra xem token có tồn tại không
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Không có token, vui lòng đăng nhập!",
    });
  }

  try {
    // Verify token với secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Gắn thông tin user vào req để dùng trong route
    req.user = decoded;

    // Chuyển sang middleware/route tiếp theo
    next();
  } catch (error) {
    // Xử lý các lỗi cụ thể
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token đã hết hạn!",
      });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Token không hợp lệ!",
      });
    }
    // Lỗi server bất ngờ
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi xác thực token!",
      error: error.message,
    });
  }
};

module.exports = authMiddleware;
