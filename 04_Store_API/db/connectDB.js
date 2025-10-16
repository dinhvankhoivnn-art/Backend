const { default: mongoose } = require("mongoose");

/**
 * Kết nối database
 * @returns {Promise<void>}
 * @throws {Error} Lỗi kết nối database
 */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URL, {});
    console.log(`Kết nối database success !`);
    mongoose.set("strictQuery", true);
  } catch (error) {
    throw new Error("Lỗi kết nối database !" + error);
  }
};

module.exports = connectDB;
