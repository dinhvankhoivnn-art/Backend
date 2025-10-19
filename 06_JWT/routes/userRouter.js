const { Router } = require("express");
const {
  getAllUsers,
  createUserNew,
  getUserForID,
  updatedForID,
  deleteUserForID,
  searchUser,
} = require("../controllers/user.controller");

const userRouter = Router();

// Route tìm kiếm người dùng (searchUser) sử dụng phương thức GET
userRouter.get("/search", searchUser);

userRouter.get("/", getAllUsers);
userRouter.post("/", createUserNew);
userRouter.get("/:id", getUserForID);
userRouter.put("/:id", updatedForID);
userRouter.delete("/:id", deleteUserForID);

module.exports = {
  userRouter,
};
