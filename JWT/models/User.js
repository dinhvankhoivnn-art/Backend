const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tên là bắt buộc"],
      trim: true,
      minlength: [2, "Tên phải có ít nhất 2 ký tự"],
      maxlength: [50, "Tên không được vượt quá 50 ký tự"],
    },
    age: {
      type: Number,
      required: [true, "Tuổi là bắt buộc"],
      min: [18, "Tuổi phải lớn hơn hoặc bằng 18"],
      max: [80, "Tuổi phải nhỏ hơn hoặc bằng 80"],
    },
    phone: {
      type: String,
      required: [true, "Số điện thoại là bắt buộc"],
      trim: true,
      unique: true,
      match: [/^[0-9]{10,11}$/, "Số điện thoại phải có 10-11 chữ số"],
    },
    email: {
      type: String,
      required: [true, "Email là bắt buộc"],
      trim: true,
      unique: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email không hợp lệ"],
    },
    password: {
      type: String,
      required: [true, "Mật khẩu là bắt buộc"],
      minlength: [6, "Mật khẩu phải có ít nhất 6 ký tự"],
      select: false, // Không trả về password trong query mặc định
    },
    role: {
      type: String,
      enum: {
        values: ["admin", "user"],
        message: "Role phải là 'admin' hoặc 'user'",
      },
      default: "user",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    collection: process.env.COLLECTION_NAME || "users",
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Mã hóa mật khẩu trước khi lưu
UserSchema.pre("save", async function (next) {
  try {
    // Chỉ hash password nếu nó được modify và không phải là hash
    if (this.isModified("password") && !this.password.startsWith("$2")) {
      const saltRounds = 12; // Tăng độ bảo mật
      this.password = await bcrypt.hash(this.password, saltRounds);
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Method để so sánh password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Lỗi khi so sánh mật khẩu");
  }
};

// Method để cập nhật lastLogin
UserSchema.methods.updateLastLogin = function () {
  this.lastLogin = new Date();
  return this.save();
};

// Static method để tìm user theo email với password
UserSchema.statics.findByCredentials = async function (email, password) {
  const user = await this.findOne({ email, isActive: true }).select(
    "+password"
  );
  if (!user) {
    throw new Error("Email hoặc mật khẩu không đúng");
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error("Email hoặc mật khẩu không đúng");
  }

  return user;
};

const User = mongoose.model("User", UserSchema);

module.exports = User;
