const jwt = require("jsonwebtoken");
const { nanoid } = require("nanoid");

// Tạo JWT token
const generateToken = (payload) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET không được định nghĩa");
  }

  return jwt.sign(
    {
      ...payload,
      time: new Date().toISOString(),
      uuid: nanoid(32),
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    }
  );
};

// Xác minh JWT token
const verifyToken = (token) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET không được định nghĩa");
  }

  return jwt.verify(token, process.env.JWT_SECRET);
};

// Lấy token từ header
const getTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.split(" ")[1];
};

module.exports = {
  generateToken,
  verifyToken,
  getTokenFromHeader,
};
