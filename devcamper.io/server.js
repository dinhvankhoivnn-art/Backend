const express = require("express");
const env = require("dotenv");
// ! cấu hình env
env.config({ path: "./config/config.env" });
const app = express();

const PORT = process.env.PORT || 5000;
// ! cấu hình app
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
//  ACRUD
app.get("/v1/bootcamps", (req, res) => {
  res.status(200).send({
    status: true,
    message: `Get all bootcamps success`,
  });
});
app.post("/v1/bootcamps", (req, res) => {
  res.status(200).send({
    status: true,
    message: `Create bootcamps success`,
  });
});
app.get("/v1/bootcamps/:id", (req, res) => {
  res.status(200).send({
    status: true,
    message: `Get bootcamps for ID ${req.params.id} success`,
  });
});
app.put("/v1/bootcamps/:id", (req, res) => {
  res.status(200).send({
    status: true,
    message: `Update bootcamps for ID ${req.params.id} success`,
  });
});
app.delete("/v1/bootcamps/:id", (req, res) => {
  res.status(200).send({
    status: true,
    message: `Delete bootcamps for ID ${req.params.id} success`,
  });
});
app.listen(PORT, () => {
  console.log(
    `Server đang chạy trên cổng ${PORT} trên môi trường ${process.env.NODE_ENV}`
  );
});
