const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log(`Kết nối thành công DB !`);
  } catch (error) {
    throw new Error("Lỗi kết nối DB" + error);
  }
};
module.exports = connectDB;
