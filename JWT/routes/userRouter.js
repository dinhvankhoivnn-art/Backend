const express = require("express");
const {
  getAllUser,
  getUserForID,
  createUserNew,
  updateUserForID,
  deleteUserForID,
  searchUser,
} = require("../controllers/user.controller");
const {
  getAllUserValidation,
  getUserForIDValidation,
  createUserValidation,
  updateUserValidation,
  deleteUserValidation,
  searchUserValidation,
} = require("../middlewares/userValidation");
const {
  handleValidationErrors,
  validatePagination,
  validateSearchQuery,
} = require("../middlewares/validationMiddleware");
const { restrictToAdmin } = require("../middlewares/restrictToAdmin");

const userRouter = express.Router();

// Endpoint lấy tất cả user (chỉ admin)
userRouter.get(
  "/",
  validatePagination,
  [...getAllUserValidation, handleValidationErrors, restrictToAdmin],
  getAllUser
);

// Endpoint tìm kiếm user (chỉ admin)
userRouter.get(
  "/search",
  validateSearchQuery,
  [...searchUserValidation, handleValidationErrors, restrictToAdmin],
  searchUser
);

// Endpoint tạo user mới
userRouter.post(
  "/",
  [...createUserValidation, handleValidationErrors],
  createUserNew
);

// Endpoint lấy user theo ID
userRouter.get(
  "/:id",
  [...getUserForIDValidation, handleValidationErrors],
  getUserForID
);

// Endpoint cập nhật user theo ID
userRouter.put(
  "/:id",
  [...updateUserValidation, handleValidationErrors],
  updateUserForID
);

// Endpoint xóa user theo ID (chỉ admin)
userRouter.delete(
  "/:id",
  [...deleteUserValidation, handleValidationErrors, restrictToAdmin],
  deleteUserForID
);

module.exports = {
  userRouter,
};
