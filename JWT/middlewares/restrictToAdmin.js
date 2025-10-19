const { default: status } = require("http-status");
const { getTime } = require("../helpers/getTime");

const restrictToAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(status.FORBIDDEN).json({
      message: "Chỉ admin mới có quyền truy cập",
      time: getTime(),
    });
  }
  next();
};

module.exports = {
  restrictToAdmin,
};
