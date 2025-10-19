const { default: status } = require("http-status/cloudflare");
const { getTime } = require("../helpers/getTime");

const errorHandleRouter = (req, res) => {
  res.status(status.NOT_FOUND).json({
    message: `Route  ${req.originalUrl} not found !`,
    time: getTime(),
  });
};

const errorHandleServer = (error, req, res) => {
  res.status(status.INTERNAL_SERVER_ERROR).json({
    message: error.message,
    time: getTime(),
  });
};

module.exports = { errorHandleRouter, errorHandleServer };
