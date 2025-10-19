const express = require("express");
const { connectDB } = require("./db/connectDB");
const {
  errorHandleRouter,
  errorHandleServer,
} = require("./middlewares/errorHandleRouter");
const { userRouter } = require("./routes/userRouter");
const { nanoid } = require("nanoid");
const { loginRouter } = require("./routes/loginRouter");
const { luckyNumberRouter } = require("./routes/luckyNumberRouter");
const authMiddleware = require("./middlewares/authMiddleware");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;
// todo middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
// todo connectDB
connectDB();
// console.log(nanoid(128));
app.get("/", (req, res) => {
  res.send("hello from simple server :)");
});

// todo: Router
app.use("/api/v1/", userRouter);
app.use("/login", loginRouter);
app.use("/lucky", authMiddleware, luckyNumberRouter);
app.use(errorHandleRouter);
app.use(errorHandleServer);
app.listen(port, () =>
  console.log("> Server is up and running on port : " + port)
);
