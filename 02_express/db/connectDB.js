const mongoose = require("mongoose");

/**
 * Kết nối đến database
 *
 * @returns {Promise<void>} Kết quả kết nối
 * @throws {Error} Lỗi kết nối database
 */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URL, {});
    console.log(`Kết nối DB thành công !`);
  } catch (error) {
    throw new Error("Lỗi kết nối database !");
  }
};
// ! câu hình nâng cao nghiêm ngặt
mongoose.set("strictQuery", true);
module.exports = connectDB;
