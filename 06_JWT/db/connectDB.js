const { default: mongoose } = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("> Connected to DB successfully !");
  } catch (error) {
    throw new Error("Lỗi kết nối DB !" + error);
  }
};
module.exports = {
  connectDB,
};
