const express = require("express");
const configBodyParser = require("./config/configBodyParser");
const connectDB = require("./db/connectDB");
const errorRouterMiddleware = require("./middleware/errorRouter");
const storeRouter = require("./routes/storeRouter");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;
// ! cấu hình
configBodyParser(app, express);
// ! kết nối database
connectDB();
// ! router
app.get("/", (req, res) => {
  res.send("hello from simple server :)");
});
app.use("/api/v1/stores/", storeRouter);
// ! middleware
app.use(errorRouterMiddleware);
app.listen(port, () =>
  console.log("> Server is up and running on port : " + port)
);
