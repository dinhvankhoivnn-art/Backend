const moment = require("moment");

const getTime = () => {
  return moment().format("YYYY-MM-DD HH:mm:ss");
};
module.exports = {
  getTime,
};
