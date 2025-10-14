/**
 * Kiểm tra xác thực
 *
 * @param {Object} req - đối tượng request
 * @param {Object} res - đối tượng response
 * @param {Function} next - hàm next
 *
 * @description
 * Hàm kiểm tra xác thực và gắn các thông tin user và timeYear vào request
 */
const checkAuth = (req, res, next) => {
  // ! xác thực
  let user = {
    name: "Đinh Văn Khôi",
    age: 27,
    address: "Hà Nội",
  };
  req.user = user;
  let timeYear = new Date().getFullYear();
  req.timeYear = timeYear;
  next();
};

module.exports = checkAuth;
