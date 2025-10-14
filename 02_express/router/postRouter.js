const express = require("express");
const {
  getAllPosts,
  addPost,
  getPostForID,
  getPostAndUpdateForID,
  findPostForIDAndDelete,
} = require("../controller/postController");
const postRouter = express.Router();
// ! ACRUD

postRouter.get("/", getAllPosts);
postRouter.post("/", addPost);
postRouter.get("/:id", getPostForID);
postRouter.put("/:id", getPostAndUpdateForID);
postRouter.delete("/:id", findPostForIDAndDelete);

module.exports = postRouter;
