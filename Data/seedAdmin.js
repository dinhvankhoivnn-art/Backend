/**
 * Script tạo admin mặc định
 * Chạy một lần khi khởi tạo database
 */

require("dotenv").config();
const mongoose = require("mongoose");
const { connectDB } = require("./config/database");
const User = require("./models/User");

/**
 * Tạo admin mặc định
 */
async function createDefaultAdmin() {
  try {
    // Kết nối database
    await connectDB();

    // Kiểm tra xem đã có admin nào chưa
    const existingAdmin = await User.findOne({ role: "admin" });

    if (existingAdmin) {
      console.log("✅ Admin đã tồn tại:", existingAdmin.email);
      return;
    }

    // Tạo admin mặc định từ env hoặc giá trị mặc định
    const adminData = {
      name: "Administrator",
      age: 30,
      address: "System Default",
      email: process.env.DEFAULT_ADMIN_EMAIL || "admin@example.com",
      pass: process.env.DEFAULT_ADMIN_PASSWORD || "Admin@123456",
      role: "admin",
    };

    const admin = new User(adminData);
    await admin.save();

    console.log("🎉 Admin mặc định đã được tạo thành công!");
    console.log("📧 Email:", admin.email);
    console.log("🔑 Mật khẩu:", adminData.pass);
    console.log("⚠️  Vui lòng đổi mật khẩu sau khi đăng nhập lần đầu!");
  } catch (error) {
    console.error("❌ Lỗi tạo admin mặc định:", error.message);
    process.exit(1);
  }
}

/**
 * Xóa tất cả data (chỉ dùng trong development)
 */
async function clearAllData() {
  try {
    if (process.env.NODE_ENV !== "development") {
      console.error("❌ Chỉ được xóa data trong môi trường development!");
      return;
    }

    await User.deleteMany({});
    await mongoose.connection.db.dropDatabase();

    console.log("🗑️  Đã xóa tất cả data");
  } catch (error) {
    console.error("❌ Lỗi xóa data:", error.message);
  }
}

/**
 * Hiển thị thống kê database
 */
async function showDatabaseStats() {
  try {
    const userStats = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);

    console.log("📊 Thống kê Database:");
    console.log(
      "👥 Users:",
      userStats.reduce((acc, stat) => acc + stat.count, 0)
    );
    userStats.forEach((stat) => {
      console.log(`  ${stat._id}: ${stat.count}`);
    });
  } catch (error) {
    console.error("❌ Lỗi lấy thống kê:", error.message);
  }
}

// Xử lý command line arguments
const command = process.argv[2];

async function main() {
  console.log("🌱 Database Seeder");

  switch (command) {
    case "create-admin":
      await createDefaultAdmin();
      break;

    case "clear":
      await clearAllData();
      break;

    case "stats":
      await connectDB();
      await showDatabaseStats();
      break;

    case "reset":
      await connectDB();
      console.log("🔄 Reset database...");
      await clearAllData();
      await createDefaultAdmin();
      break;

    default:
      console.log("📖 Cách sử dụng:");
      console.log("  npm run seed:admin create-admin  - Tạo admin mặc định");
      console.log(
        "  npm run seed:admin clear         - Xóa tất cả data (dev only)"
      );
      console.log("  npm run seed:admin stats         - Hiển thị thống kê");
      console.log(
        "  npm run seed:admin reset         - Reset và tạo admin mới"
      );
      break;
  }

  // Đóng kết nối
  await mongoose.connection.close();
  console.log("📪 Đã đóng kết nối database");
  process.exit(0);
}

// Chạy main function
main().catch((error) => {
  console.error("💥 Lỗi không mong muốn:", error);
  process.exit(1);
});
