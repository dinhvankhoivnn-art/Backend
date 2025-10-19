const { default: status } = require("http-status");
const jsonwebtoken = require("jsonwebtoken");
const { getTime } = require("../helpers/getTime");
const { nanoid } = require("nanoid");
const User = require("../models/User");

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!email || !password) {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: "Vui lòng cung cấp email và password",
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

    // Sử dụng method findByCredentials từ User model
    const user = await User.findByCredentials(email, password);

    // Cập nhật lastLogin
    await user.updateLastLogin();

    // Tạo token với thông tin cần thiết
    const token = jsonwebtoken.sign(
      {
        id: user._id,
        role: user.role,
        time: getTime(),
        uuid: nanoid(32), // Giảm độ dài UUID
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "1d",
      }
    );

    return res.status(status.OK).json({
      success: true,
      message: "Đăng nhập thành công!",
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          lastLogin: user.lastLogin,
        },
      },
      time: getTime(),
    });
  } catch (error) {
    console.error("Login error:", error);

    // Xử lý lỗi từ User.findByCredentials
    if (error.message === "Email hoặc mật khẩu không đúng") {
      return res.status(status.UNAUTHORIZED).json({
        success: false,
        message: error.message,
        time: getTime(),
      });
    }

    return res.status(status.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Lỗi đăng nhập",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
      time: getTime(),
    });
  }
};

const registerUser = async (req, res) => {
  try {
    const { name, age, phone, email, password } = req.body;

    // Kiểm tra xem email đã tồn tại chưa
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      const field = existingUser.email === email ? "email" : "số điện thoại";
      return res.status(status.CONFLICT).json({
        success: false,
        message: `${field} đã được sử dụng`,
        time: getTime(),
      });
    }

    // Tạo user mới (role mặc định là "user")
    const user = await User.create({
      name,
      age,
      phone,
      email,
      password,
      role: "user",
    });

    return res.status(status.CREATED).json({
      success: true,
      message: "Đăng ký user thành công",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        age: user.age,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
      time: getTime(),
    });
  } catch (error) {
    console.error("Register error:", error);

    // Xử lý lỗi validation từ Mongoose
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors,
        time: getTime(),
      });
    }

    // Xử lý lỗi duplicate key
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(status.CONFLICT).json({
        success: false,
        message: `${field} đã được sử dụng`,
        time: getTime(),
      });
    }

    return res.status(status.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Lỗi đăng ký user",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
      time: getTime(),
    });
  }
};

module.exports = {
  loginUser,
  registerUser,
};
