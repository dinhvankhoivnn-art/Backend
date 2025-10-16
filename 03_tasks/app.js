const express = require("express");
const cors = require("cors");

const connectDB = require("./db/connectDB");
const bodyParser = require("./config/bodyParser");
const tasksRouter = require("./router/tasksRouter");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;
// ? Kết nối DB
connectDB();
// ! cấu hình
app.use(cors());
bodyParser(app, express);
// ! cấu hình router
app.use("/api/v1/tasks/", tasksRouter);
app.get("/", (req, res) => {
  res.send("hello from simple server :)");
});

app.listen(port, () =>
  console.log("> Server is up and running on port : " + port)
);
