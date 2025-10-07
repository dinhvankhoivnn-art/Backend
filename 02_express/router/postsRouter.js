const postsRouter = require("express").Router();
const express = require("express");

const app = express();
postsRouter.get("/", (req, res) => {
  // postsRouter code here
  console.log(app.mountpath);
  res.status(200).send("ok home :)");
});

postsRouter.get("/data", (req, res) => {
  // postsRouter code here
  res.status(200).send("ok :)");
});

module.exports = postsRouter;
