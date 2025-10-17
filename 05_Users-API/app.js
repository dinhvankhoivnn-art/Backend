const express = require("express");
const { connectDB } = require("./db/connectDB");
const notFound = require("./middlewares/notFound");
const userRouter = require("./routes/UserRouter");

const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// todo kết nối DB
connectDB();
app.get("/", (req, res) => {
  res.send("hello from simple server :)");
});
app.use("/api/v1/users", userRouter);
app.use(notFound);
app.listen(port, () =>
  console.log("> Server is up and running on port : " + port)
);
