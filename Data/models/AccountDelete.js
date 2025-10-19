/**
 * Model AccountDelete - Lưu trữ thông tin tài khoản đã bị xóa
 * Khi xóa user, dữ liệu sẽ được chuyển sang collection này để lưu trữ lịch sử
 */

const mongoose = require("mongoose");

/**
 * Schema định nghĩa cấu trúc dữ liệu AccountDelete
 * Lưu trữ thông tin user đã bị xóa để phục hồi nếu cần
 */
const accountDeleteSchema = new mongoose.Schema(
  {
    // ID gốc của user đã bị xóa (để tham chiếu)
    originalUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Tên người dùng
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: [2, "Tên phải có ít nhất 2 ký tự"],
      maxlength: [100, "Tên không được vượt quá 100 ký tự"],
    },

    // Tuổi người dùng tại thời điểm xóa
    age: {
      type: Number,
      required: true,
      min: [1, "Tuổi phải lớn hơn 0"],
      max: [150, "Tuổi không được vượt quá 150"],
    },

    // Địa chỉ người dùng
    address: {
      type: String,
      required: true,
      trim: true,
      minlength: [5, "Địa chỉ phải có ít nhất 5 ký tự"],
      maxlength: [500, "Địa chỉ không được vượt quá 500 ký tự"],
    },

    // Email người dùng (vẫn lưu để tham khảo)
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Email không hợp lệ",
      ],
    },

    // Vai trò của user tại thời điểm xóa
    role: {
      type: String,
      required: true,
      enum: {
        values: ["admin", "user"],
        message: "Vai trò phải là admin hoặc user",
      },
    },

    // Lý do xóa tài khoản (tùy chọn)
    deleteReason: {
      type: String,
      enum: {
        values: [
          "user_request",
          "violation",
          "inactive",
          "admin_action",
          "other",
        ],
        message: "Lý do xóa không hợp lệ",
      },
      default: "user_request",
    },

    // Chi tiết lý do xóa (text mô tả)
    deleteNote: {
      type: String,
      maxlength: [1000, "Ghi chú không được vượt quá 1000 ký tự"],
      trim: true,
    },

    // ID của admin thực hiện xóa (nếu có)
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // IP address của người thực hiện xóa
    deletedByIP: {
      type: String,
      trim: true,
    },
  },
  {
    // Tự động thêm createdAt và updatedAt
    timestamps: true,

    // Tùy chọn cho JSON output
    toJSON: {
      virtuals: true,
    },

    // Tùy chọn cho Object output
    toObject: {
      virtuals: true,
    },
  }
);

/**
 * Virtual field: Thời gian đã xóa (tính từ createdAt)
 */
accountDeleteSchema.virtual("timeSinceDeletion").get(function () {
  const now = new Date();
  const deletedAt = this.createdAt;
  const diffTime = Math.abs(now - deletedAt);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return "Hôm nay";
  if (diffDays === 1) return "1 ngày trước";
  if (diffDays < 7) return `${diffDays} ngày trước`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;

  return `${Math.floor(diffDays / 30)} tháng trước`;
});

/**
 * Pre-save middleware: Validation trước khi lưu
 */
accountDeleteSchema.pre("save", function (next) {
  // Validation logic có thể thêm ở đây nếu cần
  next();
});

/**
 * Static method: Tìm account đã xóa theo email
 */
accountDeleteSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

/**
 * Static method: Lấy thống kê xóa tài khoản theo lý do
 */
accountDeleteSchema.statics.getDeletionStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: "$deleteReason",
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);

  return stats.reduce((acc, stat) => {
    acc[stat._id] = stat.count;
    return acc;
  }, {});
};

/**
 * Static method: Lấy thống kê xóa theo tháng
 */
accountDeleteSchema.statics.getMonthlyDeletionStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { "_id.year": -1, "_id.month": -1 },
    },
    {
      $limit: 12, // Lấy 12 tháng gần nhất
    },
  ]);

  return stats.map((stat) => ({
    year: stat._id.year,
    month: stat._id.month,
    count: stat.count,
    period: `${stat._id.year}-${String(stat._id.month).padStart(2, "0")}`,
  }));
};

/**
 * Static method: Kiểm tra xem email đã bị xóa chưa
 * Hữu ích khi tạo user mới để tránh trùng email đã xóa
 */
accountDeleteSchema.statics.isEmailDeleted = function (email) {
  return this.exists({ email: email.toLowerCase() });
};

/**
 * Instance method: Phục hồi account (tạo lại user từ dữ liệu đã xóa)
 * Trả về object data để tạo user mới
 */
accountDeleteSchema.methods.getRecoveryData = function () {
  return {
    name: this.name,
    age: this.age,
    address: this.address,
    email: this.email,
    role: this.role,
    // Lưu ý: Không thể phục hồi mật khẩu vì đã được hash
    // User sẽ cần đặt lại mật khẩu
    needsPasswordReset: true,
    recoveredFrom: this._id,
    recoveryDate: new Date(),
  };
};

/**
 * Index để tối ưu hiệu suất
 */
accountDeleteSchema.index({ email: 1 }); // Index cho email
accountDeleteSchema.index({ originalUserId: 1 }); // Index cho ID gốc
accountDeleteSchema.index({ deletedBy: 1 }); // Index cho người xóa
accountDeleteSchema.index({ createdAt: -1 }); // Index cho thời gian xóa
accountDeleteSchema.index({ deleteReason: 1 }); // Index cho lý do xóa

/**
 * Export model AccountDelete
 */
module.exports = mongoose.model("AccountDelete", accountDeleteSchema);
