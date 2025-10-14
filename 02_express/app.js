const express = require("express");
const bodyParser = require("./config/bodyParser");
const blogRouter = require("./router/blogRouter");
const checkAuth = require("./middleware/checkAuth");
const connectDB = require("./config/connectDB");
const postRouter = require("./router/postRouter");
const { nanoid } = require("nanoid");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;

// ! cấu hình database
connectDB();
// ! cấu hình
bodyParser(app, express);
// ! cấu hình router
app.use("/api/blog/", checkAuth, blogRouter);
app.use("/api/posts", postRouter);
app.get("/", (req, res) => {
  res.send("hello from simple server :)");
});

app.listen(port, () =>
  console.log("> Server is up and running on port : " + port)
);
