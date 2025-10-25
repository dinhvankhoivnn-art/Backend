const express = require("express");
const env = require("dotenv");
// ! cấu hình env
env.config({ path: "./config/config.env" });
const app = express();

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.status(200).send({
    status: true,
    message: "Show all  bootcamps",
  });
});
app.listen(PORT, () => {
  console.log(
    `Server đang chạy trên cổng ${PORT} trên môi trường ${process.env.NODE_ENV}`
  );
});
