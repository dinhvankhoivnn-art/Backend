const express = require("express");
const dotenv = require("dotenv");
const bootcamps = require("./routes/bootcamps");

dotenv.config({ path: ".env" });
const app = express();
// ! middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const PORT = process.env.PORT || 5000;
// ! use Router
app.use("/v1/bootcamps", bootcamps);

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
