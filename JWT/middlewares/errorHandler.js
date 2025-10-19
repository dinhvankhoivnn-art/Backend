const { default: status } = require("http-status");
const { getTime } = require("../helpers/getTime");

// Middleware xử lý route không tìm thấy
const notFound = (req, res, next) => {
  // Bỏ qua các request từ browser dev tools và favicon
  if (req.originalUrl.includes('.well-known') || 
      req.originalUrl.includes('favicon.ico') ||
      req.originalUrl.includes('robots.txt')) {
    return res.status(404).end();
  }
  
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.status = status.NOT_FOUND;
  next(error);
};

// Middleware xử lý lỗi chung
const errorHandler = (error, req, res, next) => {
  let err = { ...error };
  err.message = error.message;

  // Log error
  console.error("Error:", error);

  // Mongoose bad ObjectId
  if (error.name === "CastError") {
    const message = "Resource not found";
    err = new Error(message);
    err.status = status.NOT_FOUND;
  }

  // Mongoose duplicate key
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    const message = `${field} already exists`;
    err = new Error(message);
    err.status = status.CONFLICT;
  }

  // Mongoose validation error
  if (error.name === "ValidationError") {
    const message = Object.values(error.errors)
      .map((val) => val.message)
      .join(", ");
    err = new Error(message);
    err.status = status.BAD_REQUEST;
  }

  // JWT errors
  if (error.name === "JsonWebTokenError") {
    const message = "Invalid token";
    err = new Error(message);
    err.status = status.UNAUTHORIZED;
  }

  if (error.name === "TokenExpiredError") {
    const message = "Token expired";
    err = new Error(message);
    err.status = status.UNAUTHORIZED;
  }

  // Default error
  const statusCode = err.status || status.INTERNAL_SERVER_ERROR;
  const message = err.message || "Server Error";

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    time: getTime(),
  });
};

module.exports = { notFound, errorHandler };
