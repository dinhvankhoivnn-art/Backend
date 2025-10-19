/**
 * Controller xử lý authentication
 * Quản lý đăng nhập, đăng xuất và xác thực người dùng
 */

const User = require("../models/User");
const CreateNewUser = require("../models/CreateNewUser");
const TrackingUserForLogout = require("../models/TrackingUserForLogout");
const { comparePassword, generateToken } = require("../utils/auth");
const { validationResult } = require("express-validator");

/**
 * Controller đăng nhập
 * Xử lý POST /login
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const login = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu đầu vào không hợp lệ",
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Tìm user theo email
    const user = await User.findOne({ email }).select("+pass");
    if (!user) {
      console.warn(`🚫 Login failed - User not found: ${email}`, {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });

      return res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không đúng",
      });
    }

    // Kiểm tra mật khẩu
    const isPasswordValid = await comparePassword(password, user.pass);
    if (!isPasswordValid) {
      console.warn(`🚫 Login failed - Invalid password: ${email}`, {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });

      return res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không đúng",
      });
    }

    // Tạo JWT token
    const token = user.generateAuthToken();

    // Thiết lập cookie với token
    const cookieOptions = {
      httpOnly: true, // Không thể truy cập từ JavaScript
      secure: process.env.NODE_ENV === "production", // Chỉ HTTPS trong production
      sameSite: "strict", // Ngăn CSRF
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
    };

    res.cookie("token", token, cookieOptions);

    // Log thông tin đăng nhập thành công
    console.log(`✅ Login successful: ${email} (${user.role})`, {
      userId: user._id,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });

    // Trả về thông tin user (ẩn password)
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      age: user.age,
      address: user.address,
    };

    // Lưu thông tin login tracking
    res.locals.loggedInUser = user;

    return res.status(200).json({
      success: true,
      message: "Đăng nhập thành công",
      data: {
        user: userResponse,
        token: token, // Có thể trả về token trong response nếu cần
      },
    });
  } catch (error) {
    console.error("❌ Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Lỗi server khi đăng nhập",
    });
  }
};

/**
 * Controller hiển thị trang login (SSR EJS)
 * Xử lý GET /login
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const showLoginPage = (req, res) => {
  try {
    // Nếu đã đăng nhập, redirect về dashboard
    if (req.user) {
      return res.redirect("/dashboard");
    }

    // Hiển thị trang login với EJS
    res.render("login", {
      title: "Đăng nhập",
      csrfToken: req.csrfToken ? req.csrfToken() : null,
      error: req.query.error,
      success: req.query.success,
    });
  } catch (error) {
    console.error("❌ Show login page error:", error.message);

    res.status(500).render("error", {
      title: "Lỗi",
      message: "Không thể tải trang đăng nhập",
      error: process.env.NODE_ENV === "development" ? error : null,
    });
  }
};

/**
 * Controller đăng xuất
 * Xử lý POST /logout
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const logout = async (req, res) => {
  try {
    if (req.user) {
      const logoutReason = req.body?.reason || "user_initiated";

      // Tìm bản ghi login gần nhất để cập nhật logout
      const lastLoginRecord = await TrackingUserForLogout.findOne({
        userId: req.user.id,
        logoutTime: { $exists: false },
      }).sort({ loginTime: -1 });

      if (lastLoginRecord) {
        const sessionDuration = Math.floor(
          (new Date() - lastLoginRecord.loginTime) / (1000 * 60)
        );

        await TrackingUserForLogout.findByIdAndUpdate(lastLoginRecord._id, {
          logoutTime: new Date(),
          sessionDuration: sessionDuration,
          logoutReason: logoutReason,
          notes: `Logged out at ${new Date().toISOString()}`,
        });
      }

      console.log(`📝 Logout successful: ${req.user.email}`, {
        userId: req.user.id,
        reason: logoutReason,
        ip: req.ip,
      });
    }

    // Xóa cookie
    res.clearCookie("token");

    // Redirect về trang login hoặc trả về JSON
    if (req.accepts("html")) {
      return res.redirect("/login?success=logout");
    }

    return res.status(200).json({
      success: true,
      message: "Đăng xuất thành công",
    });
  } catch (error) {
    console.error("❌ Logout error:", error.message);

    // Vẫn xóa cookie ngay cả khi có lỗi
    res.clearCookie("token");

    return res.status(500).json({
      success: false,
      message: "Lỗi server khi đăng xuất",
    });
  }
};

/**
 * Controller kiểm tra trạng thái đăng nhập
 * Xử lý GET /auth/status
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const checkAuthStatus = (req, res) => {
  try {
    if (req.user) {
      return res.status(200).json({
        success: true,
        message: "Đã đăng nhập",
        data: {
          user: {
            id: req.user.id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
            age: req.user.age,
          },
          authenticated: true,
        },
      });
    }

    return res.status(401).json({
      success: false,
      message: "Chưa đăng nhập",
      authenticated: false,
    });
  } catch (error) {
    console.error("❌ Check auth status error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Lỗi server khi kiểm tra trạng thái đăng nhập",
    });
  }
};

/**
 * Controller làm mới token
 * Xử lý POST /auth/refresh
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const refreshToken = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Chưa xác thực",
      });
    }

    // Tạo token mới
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Người dùng không tồn tại",
      });
    }

    const newToken = user.generateAuthToken();

    // Cập nhật cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    res.cookie("token", newToken, cookieOptions);

    console.log(`🔄 Token refreshed for user: ${user.email}`, {
      userId: user._id,
      ip: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: "Token đã được làm mới",
      data: {
        token: newToken,
      },
    });
  } catch (error) {
    console.error("❌ Refresh token error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Lỗi server khi làm mới token",
    });
  }
};

/**
 * Controller lấy thông tin profile
 * Xử lý GET /auth/profile
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Chưa xác thực",
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Người dùng không tồn tại",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lấy thông tin profile thành công",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          age: user.age,
          address: user.address,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error("❌ Get profile error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thông tin profile",
    });
  }
};

module.exports = {
  login,
  showLoginPage,
  logout,
  checkAuthStatus,
  refreshToken,
  getProfile,
};
