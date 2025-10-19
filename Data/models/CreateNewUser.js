/**
 * Model CreateNewUser - Model cho việc đăng ký user mới
 * Dùng cho endpoint /api/v1/signIn để tạo tài khoản mới
 */

const mongoose = require("mongoose");
const { hashPassword } = require("../utils/auth");

/**
 * Schema định nghĩa cấu trúc dữ liệu CreateNewUser
 */
const createNewUserSchema = new mongoose.Schema(
  {
    // Tên người dùng (bắt buộc)
    name: {
      type: String,
      required: [true, "Tên người dùng là bắt buộc"],
      trim: true,
      minlength: [2, "Tên phải có ít nhất 2 ký tự"],
      maxlength: [100, "Tên không được vượt quá 100 ký tự"],
    },

    // Tuổi người dùng (bắt buộc, từ 13-150 - theo quy định GDPR)
    age: {
      type: Number,
      required: [true, "Tuổi là bắt buộc"],
      min: [13, "Tuổi phải từ 13 trở lên"],
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

    // Nghề nghiệp (bắt buộc)
    job: {
      type: String,
      required: [true, "Nghề nghiệp là bắt buộc"],
      trim: true,
      minlength: [2, "Nghề nghiệp phải có ít nhất 2 ký tự"],
      maxlength: [100, "Nghề nghiệp không được vượt quá 100 ký tự"],
    },

    // Số điện thoại (bắt buộc, định dạng Việt Nam)
    phone: {
      type: String,
      required: [true, "Số điện thoại là bắt buộc"],
      unique: true,
      trim: true,
      match: [
        /^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/,
        "Số điện thoại không hợp lệ (định dạng Việt Nam)",
      ],
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
    password: {
      type: String,
      required: [true, "Mật khẩu là bắt buộc"],
      minlength: [8, "Mật khẩu phải có ít nhất 8 ký tự"],
      select: false, // Không bao gồm trong query mặc định
    },

    // Mã xác minh email (OTP) - tạo khi đăng ký
    emailVerificationToken: {
      type: String,
      select: false,
    },

    // Thời gian hết hạn của mã xác minh
    emailVerificationExpires: {
      type: Date,
      select: false,
    },

    // Trạng thái xác minh email
    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    // Mã xác minh số điện thoại (OTP)
    phoneVerificationToken: {
      type: String,
      select: false,
    },

    // Thời gian hết hạn của mã xác minh phone
    phoneVerificationExpires: {
      type: Date,
      select: false,
    },

    // Trạng thái xác minh số điện thoại
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },

    // Trạng thái tài khoản
    status: {
      type: String,
      enum: {
        values: ["pending", "active", "suspended", "blocked"],
        message: "Trạng thái không hợp lệ",
      },
      default: "pending",
    },

    // Lý do từ chối (nếu có)
    rejectionReason: {
      type: String,
      maxlength: [500, "Lý do từ chối không được vượt quá 500 ký tự"],
      trim: true,
    },

    // ID của admin duyệt đăng ký (nếu có)
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Thời gian duyệt
    approvedAt: {
      type: Date,
    },

    // Ghi chú của admin
    adminNotes: {
      type: String,
      maxlength: [1000, "Ghi chú không được vượt quá 1000 ký tự"],
      trim: true,
    },
  },
  {
    // Tự động thêm createdAt và updatedAt
    timestamps: true,

    // Tùy chọn cho JSON output
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        // Ẩn các field nhạy cảm
        delete ret.password;
        delete ret.emailVerificationToken;
        delete ret.emailVerificationExpires;
        delete ret.phoneVerificationToken;
        delete ret.phoneVerificationExpires;
        delete ret.__v;
        return ret;
      },
    },

    // Tùy chọn cho Object output
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        // Ẩn các field nhạy cảm
        delete ret.password;
        delete ret.emailVerificationToken;
        delete ret.emailVerificationExpires;
        delete ret.phoneVerificationToken;
        delete ret.phoneVerificationExpires;
        delete ret.__v;
        return ret;
      },
    },
  }
);

/**
 * Virtual field: Kiểm tra tài khoản có thể đăng nhập
 */
createNewUserSchema.virtual("canLogin").get(function () {
  return (
    this.status === "active" && this.isEmailVerified && this.isPhoneVerified
  );
});

/**
 * Virtual field: Thời gian chờ duyệt (tính từ createdAt)
 */
createNewUserSchema.virtual("waitingTime").get(function () {
  if (this.status !== "pending") return null;

  const now = new Date();
  const createdAt = this.createdAt;
  const diffTime = Math.abs(now - createdAt);
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));

  if (diffHours < 1) return "Vừa đăng ký";
  if (diffHours < 24) return `${diffHours} giờ trước`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ngày trước`;
});

/**
 * Pre-save middleware: Hash mật khẩu và tạo verification tokens
 */
createNewUserSchema.pre("save", async function (next) {
  try {
    // Hash mật khẩu nếu được thay đổi
    if (this.isModified("password")) {
      this.password = await hashPassword(this.password);
    }

    // Tạo email verification token nếu chưa có
    if (this.isModified("email") && !this.emailVerificationToken) {
      this.emailVerificationToken = require("../utils/auth").generateOTP(6);
      this.emailVerificationExpires = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ); // 24 giờ
    }

    // Tạo phone verification token nếu chưa có
    if (this.isModified("phone") && !this.phoneVerificationToken) {
      this.phoneVerificationToken = require("../utils/auth").generateOTP(6);
      this.phoneVerificationExpires = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ); // 24 giờ
    }

    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Instance method: So sánh mật khẩu
 */
createNewUserSchema.methods.comparePassword = async function (
  candidatePassword
) {
  try {
    const isMatch = await require("../utils/auth").comparePassword(
      candidatePassword,
      this.password
    );
    return isMatch;
  } catch (error) {
    throw new Error("Lỗi khi so sánh mật khẩu");
  }
};

/**
 * Instance method: Tạo JWT token (sau khi được duyệt)
 */
createNewUserSchema.methods.generateAuthToken = function () {
  if (this.status !== "active") {
    throw new Error("Tài khoản chưa được duyệt");
  }

  const { generateToken } = require("../utils/auth");

  return generateToken({
    id: this._id,
    email: this.email,
    name: this.name,
    role: "user", // Mặc định là user, có thể nâng cấp sau
  });
};

/**
 * Instance method: Gửi mã xác minh email
 */
createNewUserSchema.methods.sendEmailVerification = function () {
  // Logic gửi email verification code
  // Có thể tích hợp với service gửi email
  console.log(
    `Mã xác minh email cho ${this.email}: ${this.emailVerificationToken}`
  );
  return this.emailVerificationToken;
};

/**
 * Instance method: Gửi mã xác minh SMS
 */
createNewUserSchema.methods.sendPhoneVerification = function () {
  // Logic gửi SMS verification code
  // Có thể tích hợp với service gửi SMS
  console.log(
    `Mã xác minh SMS cho ${this.phone}: ${this.phoneVerificationToken}`
  );
  return this.phoneVerificationToken;
};

/**
 * Instance method: Xác minh email
 */
createNewUserSchema.methods.verifyEmail = function (token) {
  if (this.emailVerificationToken !== token) {
    return false;
  }

  if (this.emailVerificationExpires < new Date()) {
    return false; // Token đã hết hạn
  }

  this.isEmailVerified = true;
  this.emailVerificationToken = undefined;
  this.emailVerificationExpires = undefined;

  return true;
};

/**
 * Instance method: Xác minh số điện thoại
 */
createNewUserSchema.methods.verifyPhone = function (token) {
  if (this.phoneVerificationToken !== token) {
    return false;
  }

  if (this.phoneVerificationExpires < new Date()) {
    return false; // Token đã hết hạn
  }

  this.isPhoneVerified = true;
  this.phoneVerificationToken = undefined;
  this.phoneVerificationExpires = undefined;

  return true;
};

/**
 * Instance method: Duyệt đăng ký (chỉ admin)
 */
createNewUserSchema.methods.approve = function (adminId, notes = "") {
  this.status = "active";
  this.approvedBy = adminId;
  this.approvedAt = new Date();
  this.adminNotes = notes;
};

/**
 * Instance method: Từ chối đăng ký
 */
createNewUserSchema.methods.reject = function (reason) {
  this.status = "blocked";
  this.rejectionReason = reason;
};

/**
 * Static method: Tìm theo email
 */
createNewUserSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

/**
 * Static method: Tìm theo số điện thoại
 */
createNewUserSchema.statics.findByPhone = function (phone) {
  return this.findOne({ phone: phone });
};

/**
 * Static method: Lấy danh sách đăng ký đang chờ duyệt
 */
createNewUserSchema.statics.getPendingRegistrations = function () {
  return this.find({ status: "pending" }).sort({ createdAt: -1 });
};

/**
 * Static method: Thống kê đăng ký theo trạng thái
 */
createNewUserSchema.statics.getRegistrationStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  return stats.reduce(
    (acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    },
    { pending: 0, active: 0, suspended: 0, blocked: 0 }
  );
};

/**
 * Index để tối ưu hiệu suất
 * Lưu ý: email và phone đã có unique: true nên không cần định nghĩa lại index
 */
createNewUserSchema.index({ status: 1 }); // Index cho status
createNewUserSchema.index({ createdAt: -1 }); // Index cho thời gian tạo
createNewUserSchema.index({ name: "text" }); // Index text cho tìm kiếm theo tên
createNewUserSchema.index({ job: "text" }); // Index text cho tìm kiếm theo nghề nghiệp

/**
 * Export model CreateNewUser
 */
module.exports = mongoose.model("CreateNewUser", createNewUserSchema);
