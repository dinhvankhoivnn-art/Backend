const moment = require("moment");

/**
 * Returns the current time in the format "YYYY-MM-DD HH:mm:ss"
 * @return {string} The current time in the specified format
 */
const getTime = () => {
  return moment().format("YYYY-MM-DD HH:mm:ss");
};
module.exports = getTime;
