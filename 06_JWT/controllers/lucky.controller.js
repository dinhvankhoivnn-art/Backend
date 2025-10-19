const { default: status } = require("http-status");
const { getTime } = require("../helpers/getTime");
const getLucky = async (req, res) => {
  try {
    let numberLucky = Math.floor(Math.random() * 100) + 1;
    res.status(status.OK).json({
      message: "Lucky number",
      time: getTime(),
      data: numberLucky,
    });
  } catch (error) {
    res.status(status.INTERNAL_SERVER_ERROR).json({
      message: error.message,
      time: getTime(),
    });
  }
};

module.exports = {
  getLucky,
};
