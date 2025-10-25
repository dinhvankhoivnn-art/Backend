const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");

const bootcamps = require("./routes/bootcamps");
const { logger } = require("./middleware/logger");

dotenv.config({ path: ".env" });
const app = express();
// ! middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// ! kiểm tra điều kiện
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
app.use(logger);
const PORT = process.env.PORT || 5000;
// ! cấu hình middleware
// ! use Router
app.use("/v1/bootcamps", bootcamps);

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
