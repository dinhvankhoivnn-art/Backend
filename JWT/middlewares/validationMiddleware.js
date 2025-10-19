const { default: status } = require("http-status");
const { validationResult } = require("express-validator");
const { getTime } = require("../helpers/getTime");

// Middleware xử lý lỗi validation
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Format errors để dễ đọc hơn
    const formattedErrors = errors.array().map((error) => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
      location: error.location,
    }));

    return res.status(status.BAD_REQUEST).json({
      success: false,
      message: "Dữ liệu đầu vào không hợp lệ",
      errors: formattedErrors,
      time: getTime(),
    });
  }
  next();
};

// Middleware validation cho pagination
const validatePagination = (req, res, next) => {
  const { page, limit } = req.query;

  if (page && (isNaN(page) || parseInt(page) < 1)) {
    return res.status(status.BAD_REQUEST).json({
      success: false,
      message: "Page phải là số nguyên dương",
      time: getTime(),
    });
  }

  if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
    return res.status(status.BAD_REQUEST).json({
      success: false,
      message: "Limit phải là số từ 1 đến 100",
      time: getTime(),
    });
  }

  next();
};

// Middleware validation cho search query
const validateSearchQuery = (req, res, next) => {
  const { query } = req.query;

  if (query && query.trim().length < 1) {
    return res.status(status.BAD_REQUEST).json({
      success: false,
      message: "Từ khóa tìm kiếm không được để trống",
      time: getTime(),
    });
  }

  if (query && query.trim().length > 50) {
    return res.status(status.BAD_REQUEST).json({
      success: false,
      message: "Từ khóa tìm kiếm không được vượt quá 50 ký tự",
      time: getTime(),
    });
  }

  next();
};

module.exports = {
  handleValidationErrors,
  validatePagination,
  validateSearchQuery,
};
