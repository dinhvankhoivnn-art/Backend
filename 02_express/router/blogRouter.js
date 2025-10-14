const express = require("express");
const {
  getAllBlog,
  getBlogForID,
  blogPost,
  editBlogForID,
  deleteForID,
} = require("../controller/blogController");

const blogRouter = express.Router();
// ! tạo router
blogRouter.get("/", getAllBlog);
// ! lấy theo id
blogRouter.get("/:id", getBlogForID);
// ! thêm dữ liệu
blogRouter.post("/", blogPost);
// ! sửa dữ liệu theo id
blogRouter.put("/:id", editBlogForID);
// ! xoá theo id
blogRouter.delete("/:id", deleteForID);
// ! xuất router
module.exports = blogRouter;
