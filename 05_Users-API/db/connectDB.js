const { default: mongoose } = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log(`kết nối DB success !`);
  } catch (error) {
    throw new Error("Lỗi kết nối db !");
  }
};

module.exports = { connectDB };
