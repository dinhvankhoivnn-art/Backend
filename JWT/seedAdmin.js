const mongoose = require("mongoose");
const { connectDB } = require("./db/connectDB");
require("dotenv").config();
const User = require("./models/User");

const seedAdmin = async () => {
  try {
    console.log("🌱 Bắt đầu tạo admin user...");

    // Kiểm tra các biến môi trường cần thiết
    const requiredEnvVars = [
      "ADMIN_EMAIL",
      "ADMIN_PASSWORD",
      "ADMIN_NAME",
      "ADMIN_PHONE",
      "ADMIN_AGE",
    ];
    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    );

    if (missingVars.length > 0) {
      console.error(`❌ Thiếu các biến môi trường: ${missingVars.join(", ")}`);
      console.log(
        "💡 Vui lòng kiểm tra file .env và đảm bảo có đầy đủ thông tin admin"
      );
      process.exit(1);
    }

    // Kết nối database
    await connectDB();

    // Kiểm tra xem đã có user admin chưa
    const existingAdmin = await User.findOne({
      $or: [{ email: process.env.ADMIN_EMAIL }, { role: "admin" }],
    });

    if (existingAdmin) {
      console.log("⚠️  Admin user đã tồn tại!");
      console.log(`📧 Email: ${existingAdmin.email}`);
      console.log(`👤 Name: ${existingAdmin.name}`);
      console.log(`🔑 Role: ${existingAdmin.role}`);
      return;
    }

    // Tạo user admin
    const adminUser = new User({
      name: process.env.ADMIN_NAME,
      age: parseInt(process.env.ADMIN_AGE),
      phone: process.env.ADMIN_PHONE,
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD, // Password sẽ được hash tự động bởi pre-save hook
      role: "admin",
      isActive: true,
    });

    await adminUser.save();

    console.log("✅ Tạo admin user thành công!");
    console.log(`📧 Email: ${adminUser.email}`);
    console.log(`👤 Name: ${adminUser.name}`);
    console.log(`📱 Phone: ${adminUser.phone}`);
    console.log(`🔑 Role: ${adminUser.role}`);
    console.log("🔐 Password đã được mã hóa tự động");
  } catch (error) {
    console.error("❌ Lỗi khi tạo admin user:", error.message);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      console.error("📝 Lỗi validation:", errors.join(", "));
    }

    if (error.code === 11000) {
      console.error(
        "📝 Lỗi duplicate key:",
        Object.keys(error.keyPattern)[0] + " đã tồn tại"
      );
    }

    process.exit(1);
  } finally {
    // Đóng kết nối
    try {
      await mongoose.connection.close();
      console.log("🔌 Đã đóng kết nối database");
    } catch (closeError) {
      console.error("❌ Lỗi khi đóng kết nối:", closeError.message);
    }
  }
};

// Chạy script
seedAdmin();
