const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Kiểm tra MONGO_URI
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI không được định nghĩa trong file .env");
    }

    // Cấu hình kết nối MongoDB
    const options = {
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
      // maxPoolSize: 10, // Maintain up to 10 socket connections
      // serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      // socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      // bufferMaxEntries: 0, // Disable mongoose buffering
      // bufferCommands: false, // Disable mongoose buffering
    };

    await mongoose.connect(process.env.MONGO_URI, options);

    console.log(`✅ Kết nối MongoDB thành công: ${mongoose.connection.host}`);

    // Xử lý sự kiện kết nối
    mongoose.connection.on("error", (err) => {
      console.error("❌ Lỗi kết nối MongoDB:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("⚠️ MongoDB đã ngắt kết nối");
    });

    // Xử lý tắt ứng dụng
    process.on("SIGINT", async () => {
      try {
        await mongoose.connection.close();
        console.log("🔌 Đã đóng kết nối MongoDB");
        process.exit(0);
      } catch (error) {
        console.error("❌ Lỗi khi đóng kết nối MongoDB:", error);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error("❌ Lỗi kết nối MongoDB:", error.message);
    process.exit(1);
  }
};

module.exports = {
  connectDB,
};
