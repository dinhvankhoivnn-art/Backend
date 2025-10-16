const { default: status } = require("http-status");
const getTime = require("../helper/getTime");

/**
 * Router này sẽ trả về lỗi NOT_IMPLEMENTED khi gọi
 * và trả về thông tin lỗi
 * @param {Request} req - Request object
 * @param {Response} res - Response object
 * @param {NextFunction} next - Next function
 */
const errorRouterMiddleware = (req, res, next) => {
  res.status(status.NOT_IMPLEMENTED).json({
    status: false,
    message: "Router này không có trên server !",
    time: getTime(),
  });
};
module.exports = errorRouterMiddleware;
