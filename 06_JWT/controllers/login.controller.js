const { default: status } = require("http-status");
const jsonwebtoken = require("jsonwebtoken");

const User = require("../models/User");
const { getTime } = require("../helpers/getTime");

const loginUser = async (req, res) => {
  try {
    let { email, password } = req.body;
    const data = await User.findOne({ email, password });
    if (!data) {
      return res.status(status.UNAUTHORIZED).json({
        message: "Sai tài khoản hoặc mật khẩu",
        time: getTime(),
      });
    } else {
      // ! tạo token
      const token = jsonwebtoken.sign(
        {
          id: data._id,
          username: data.username,
          email: data.email,
          role: data.role,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "1d",
        }
      );
      res.status(status.OK).json({
        message: "Đăng nhập thành công !",
        token,
        time: getTime(),
      });
    }
  } catch (error) {
    res.status(status.INTERNAL_SERVER_ERROR).json({
      message: "Lỗi đăng nhập",
      time: getTime(),
      error: error.message,
    });
  }
};

module.exports = { loginUser };
