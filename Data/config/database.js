/**
 * File cấu hình kết nối cơ sở dữ liệu MongoDB
 * Sử dụng Mongoose ODM để kết nối và quản lý MongoDB
 */

const mongoose = require("mongoose");
require("dotenv").config();

/**
 * Hàm kết nối đến MongoDB
 * Thiết lập kết nối an toàn với retry logic và xử lý lỗi
 */
const connectDB = async () => {
  try {
    // Lấy URI từ biến môi trường
    const mongoURI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/backend_data";

    // Cấu hình kết nối MongoDB với các tùy chọn tối ưu
    const options = {
      // Timeout kết nối (ms)
      connectTimeoutMS: 10000,
      // Timeout socket (ms)
      socketTimeoutMS: 45000,
    };

    // Thực hiện kết nối
    const conn = await mongoose.connect(mongoURI, options);

    console.log(`✅ Kết nối MongoDB thành công: ${conn.connection.host}`);

    // Lắng nghe sự kiện kết nối
    mongoose.connection.on("connected", () => {
      console.log("📊 Mongoose đã kết nối đến MongoDB");
    });

    // Lắng nghe sự kiện ngắt kết nối
    mongoose.connection.on("disconnected", () => {
      console.log("📊 Mongoose đã ngắt kết nối với MongoDB");
    });

    // Lắng nghe lỗi kết nối
    mongoose.connection.on("error", (err) => {
      console.error("❌ Lỗi kết nối MongoDB:", err);
    });

    // Xử lý khi ứng dụng tắt - đóng kết nối gracefully
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("📊 Đã đóng kết nối MongoDB do ứng dụng tắt");
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ Lỗi kết nối MongoDB:", error.message);
    // Thoát ứng dụng nếu không thể kết nối DB
    process.exit(1);
  }
};

/**
 * Hàm kiểm tra trạng thái kết nối MongoDB
 * Trả về thông tin chi tiết về kết nối hiện tại
 */
const getConnectionStatus = () => {
  const state = mongoose.connection.readyState;
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  return {
    state: state,
    status: states[state] || "unknown",
    host: mongoose.connection.host || "unknown",
    port: mongoose.connection.port || "unknown",
    name: mongoose.connection.name || "unknown",
  };
};

/**
 * Hàm đóng kết nối MongoDB
 * Sử dụng khi cần đóng kết nối thủ công
 */
const closeConnection = async () => {
  try {
    await mongoose.connection.close();
    console.log("📊 Đã đóng kết nối MongoDB thành công");
  } catch (error) {
    console.error("❌ Lỗi khi đóng kết nối MongoDB:", error.message);
    throw error;
  }
};

// Export các hàm để sử dụng ở nơi khác
module.exports = {
  connectDB,
  getConnectionStatus,
  closeConnection,
};
