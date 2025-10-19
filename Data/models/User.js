/**
 * Model User - Quản lý thông tin người dùng
 * Bao gồm các field: name, age, address, email, pass, role
 * Role có thể là 'admin' hoặc 'user'
 */

const mongoose = require("mongoose");
const { hashPassword } = require("../utils/auth");

/**
 * Schema định nghĩa cấu trúc dữ liệu User
 */
const userSchema = new mongoose.Schema(
  {
    // Tên người dùng (bắt buộc)
    name: {
      type: String,
      required: [true, "Tên người dùng là bắt buộc"],
      trim: true,
      minlength: [2, "Tên phải có ít nhất 2 ký tự"],
      maxlength: [100, "Tên không được vượt quá 100 ký tự"],
    },

    // Tuổi người dùng (bắt buộc, từ 1-150)
    age: {
      type: Number,
      required: [true, "Tuổi là bắt buộc"],
      min: [1, "Tuổi phải lớn hơn 0"],
      max: [150, "Tuổi không được vượt quá 150"],
    },

    // Địa chỉ người dùng (bắt buộc)
    address: {
      type: String,
      required: [true, "Địa chỉ là bắt buộc"],
      trim: true,
      minlength: [5, "Địa chỉ phải có ít nhất 5 ký tự"],
      maxlength: [500, "Địa chỉ không được vượt quá 500 ký tự"],
    },

    // Email người dùng (bắt buộc, duy nhất, định dạng email)
    email: {
      type: String,
      required: [true, "Email là bắt buộc"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Vui lòng nhập email hợp lệ",
      ],
    },

    // Mật khẩu người dùng (bắt buộc, sẽ được hash trước khi lưu)
    pass: {
      type: String,
      required: [true, "Mật khẩu là bắt buộc"],
      minlength: [8, "Mật khẩu phải có ít nhất 8 ký tự"],
      select: false, // Không bao gồm trong query mặc định (ẩn mật khẩu)
    },

    // Vai trò người dùng (bắt buộc, enum: admin hoặc user)
    role: {
      type: String,
      required: [true, "Vai trò là bắt buộc"],
      enum: {
        values: ["admin", "user"],
        message: "Vai trò phải là admin hoặc user",
      },
      default: "user",
    },
  },
  {
    // Tự động thêm createdAt và updatedAt
    timestamps: true,

    // Tùy chọn cho JSON output
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        // Ẩn các field nhạy cảm khi convert sang JSON
        delete ret.pass; // Luôn ẩn mật khẩu
        delete ret.__v; // Ẩn version key
        return ret;
      },
    },

    // Tùy chọn cho Object output
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        // Ẩn các field nhạy cảm khi convert sang Object
        delete ret.pass; // Luôn ẩn mật khẩu
        delete ret.__v; // Ẩn version key
        return ret;
      },
    },
  }
);

/**
 * Virtual field cho tuổi theo nhóm
 * Tự động tính toán dựa trên field age
 */
userSchema.virtual("ageGroup").get(function () {
  if (this.age < 18) return "teenager";
  if (this.age < 30) return "young_adult";
  if (this.age < 50) return "adult";
  if (this.age < 65) return "middle_aged";
  return "senior";
});

/**
 * Pre-save middleware: Hash mật khẩu trước khi lưu
 * Chỉ hash khi mật khẩu được thay đổi
 */
userSchema.pre("save", async function (next) {
  try {
    // Chỉ hash mật khẩu nếu nó được thay đổi
    if (!this.isModified("pass")) {
      return next();
    }

    // Hash mật khẩu mới
    this.pass = await hashPassword(this.pass);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Pre-update middleware: Hash mật khẩu khi update
 * Đảm bảo mật khẩu luôn được hash khi update
 */
userSchema.pre(["updateOne", "findOneAndUpdate"], async function (next) {
  try {
    const update = this.getUpdate();

    // Kiểm tra xem có update mật khẩu không
    if (update.pass) {
      // Hash mật khẩu mới
      update.pass = await hashPassword(update.pass);
      this.setUpdate(update);
    }

    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Instance method: So sánh mật khẩu
 * So sánh mật khẩu nhập vào với mật khẩu đã hash trong DB
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    const isMatch = await require("../utils/auth").comparePassword(
      candidatePassword,
      this.pass
    );
    return isMatch;
  } catch (error) {
    throw new Error("Lỗi khi so sánh mật khẩu");
  }
};

/**
 * Instance method: Tạo JWT token cho user
 * Tạo token chứa thông tin cần thiết của user
 */
userSchema.methods.generateAuthToken = function () {
  const { generateToken } = require("../utils/auth");

  return generateToken({
    id: this._id,
    email: this.email,
    role: this.role,
    name: this.name,
  });
};

/**
 * Instance method: Kiểm tra quyền admin
 * Trả về true nếu user có role admin
 */
userSchema.methods.isAdmin = function () {
  return this.role === "admin";
};

/**
 * Instance method: Kiểm tra quyền user thường
 * Trả về true nếu user có role user
 */
userSchema.methods.isUser = function () {
  return this.role === "user";
};

/**
 * Static method: Tìm user theo email
 * Tiện ích để tìm user nhanh bằng email
 */
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

/**
 * Static method: Lấy danh sách admin
 * Lấy tất cả users có role admin
 */
userSchema.statics.getAdmins = function () {
  return this.find({ role: "admin" });
};

/**
 * Static method: Lấy danh sách user thường
 * Lấy tất cả users có role user
 */
userSchema.statics.getUsers = function () {
  return this.find({ role: "user" });
};

/**
 * Static method: Đếm số lượng user theo role
 * Thống kê số lượng admin và user
 */
userSchema.statics.countByRole = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: "$role",
        count: { $sum: 1 },
      },
    },
  ]);

  return stats.reduce(
    (acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    },
    { admin: 0, user: 0 }
  );
};

/**
 * Index để tối ưu hiệu suất query - Chỉ định nghĩa index một lần
 */
userSchema.index({ role: 1 }); // Index cho role
userSchema.index({ createdAt: -1 }); // Index cho thời gian tạo
userSchema.index({ name: "text" }); // Index text cho tìm kiếm theo tên

/**
 * Export model User
 */
module.exports = mongoose.model("User", userSchema);
