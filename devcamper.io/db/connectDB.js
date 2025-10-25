const { default: mongoose } = require("mongoose");

const connectDB = async () => {
  try {
    const connect = await mongoose.connect(process.env.MONGO_URI);
    console.log(`success DB !`);
    console.log(`Connected to DB ${connect.connection.host}`);
  } catch (error) {
    throw new Error("Lỗi kết nối DB !" + error);
  }
};
module.exports = {
  connectDB,
};
