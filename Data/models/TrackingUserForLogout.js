/**
 * Model TrackingUserForLogout - Theo dõi hoạt động đăng xuất của người dùng
 * Ghi lại thông tin khi user logout, thời gian và thời lượng phiên đăng nhập
 */

const mongoose = require("mongoose");

/**
 * Schema định nghĩa cấu trúc dữ liệu TrackingUserForLogout
 */
const trackingUserForLogoutSchema = new mongoose.Schema(
  {
    // ID người dùng (tham chiếu đến User)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "ID người dùng là bắt buộc"],
    },

    // Tên người dùng tại thời điểm logout
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: [2, "Tên phải có ít nhất 2 ký tự"],
      maxlength: [100, "Tên không được vượt quá 100 ký tự"],
    },

    // Tuổi người dùng tại thời điểm logout
    age: {
      type: Number,
      required: true,
      min: [1, "Tuổi phải lớn hơn 0"],
      max: [150, "Tuổi không được vượt quá 150"],
    },

    // Email người dùng
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

    // Vai trò của user tại thời điểm logout
    role: {
      type: String,
      required: true,
      enum: {
        values: ["admin", "user"],
        message: "Vai trò phải là admin hoặc user",
      },
    },

    // Thời gian đăng nhập (login time)
    loginTime: {
      type: Date,
      required: [true, "Thời gian đăng nhập là bắt buộc"],
    },

    // Thời gian đăng xuất (logout time)
    logoutTime: {
      type: Date,
      required: [true, "Thời gian đăng xuất là bắt buộc"],
      default: Date.now,
    },

    // Thời lượng phiên đăng nhập (tính bằng phút)
    sessionDuration: {
      type: Number,
      required: true,
      min: [0, "Thời lượng phiên không được âm"],
    },

    // Lý do đăng xuất
    logoutReason: {
      type: String,
      enum: {
        values: [
          "user_initiated",
          "session_expired",
          "admin_forced",
          "security_logout",
          "browser_closed",
          "other",
        ],
        message: "Lý do đăng xuất không hợp lệ",
      },
      default: "user_initiated",
    },

    // Thông tin thiết bị và trình duyệt
    deviceInfo: {
      userAgent: {
        type: String,
        maxlength: [500, "User Agent quá dài"],
      },
      ipAddress: {
        type: String,
        trim: true,
      },
      platform: {
        type: String,
        enum: {
          values: ["desktop", "mobile", "tablet", "unknown"],
          message: "Platform không hợp lệ",
        },
      },
      browser: {
        type: String,
        maxlength: [100, "Tên trình duyệt quá dài"],
      },
    },

    // Vị trí địa lý (nếu có thể lấy từ IP)
    location: {
      country: String,
      city: String,
      region: String,
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },

    // Token ID đã logout (để tránh sử dụng lại)
    tokenId: {
      type: String,
      required: true,
      unique: true,
    },

    // Trạng thái phiên đăng nhập
    sessionStatus: {
      type: String,
      enum: {
        values: ["normal", "suspicious", "forced"],
        message: "Trạng thái phiên không hợp lệ",
      },
      default: "normal",
    },

    // Ghi chú bổ sung (nếu có)
    notes: {
      type: String,
      maxlength: [500, "Ghi chú không được vượt quá 500 ký tự"],
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
 * Virtual field: Thời lượng phiên tính bằng giờ
 */
trackingUserForLogoutSchema.virtual("sessionDurationHours").get(function () {
  return (this.sessionDuration / 60).toFixed(2);
});

/**
 * Virtual field: Thời lượng phiên tính bằng ngày
 */
trackingUserForLogoutSchema.virtual("sessionDurationDays").get(function () {
  return (this.sessionDuration / (60 * 24)).toFixed(2);
});

/**
 * Virtual field: Kiểm tra phiên đăng nhập kéo dài
 */
trackingUserForLogoutSchema.virtual("isLongSession").get(function () {
  // Phiên dài nếu > 8 giờ
  return this.sessionDuration > 8 * 60;
});

/**
 * Virtual field: Kiểm tra phiên đăng nhập ngắn
 */
trackingUserForLogoutSchema.virtual("isShortSession").get(function () {
  // Phiên ngắn nếu < 5 phút
  return this.sessionDuration < 5;
});

/**
 * Virtual field: Thời gian đăng nhập format
 */
trackingUserForLogoutSchema.virtual("loginTimeFormatted").get(function () {
  return this.loginTime.toLocaleString("vi-VN");
});

/**
 * Virtual field: Thời gian đăng xuất format
 */
trackingUserForLogoutSchema.virtual("logoutTimeFormatted").get(function () {
  return this.logoutTime.toLocaleString("vi-VN");
});

/**
 * Pre-save middleware: Tự động tính session duration
 */
trackingUserForLogoutSchema.pre("save", function (next) {
  // Tính thời lượng phiên nếu chưa có
  if (!this.sessionDuration && this.loginTime && this.logoutTime) {
    const durationMs = this.logoutTime - this.loginTime;
    this.sessionDuration = Math.max(0, Math.floor(durationMs / (1000 * 60))); // Chuyển sang phút
  }

  next();
});

/**
 * Instance method: Cập nhật thông tin location từ IP
 */
trackingUserForLogoutSchema.methods.updateLocationFromIP = function (ip) {
  // Logic lấy thông tin địa lý từ IP
  // Có thể tích hợp với service như ip-api.com hoặc maxmind
  // Ví dụ đơn giản:
  this.deviceInfo.ipAddress = ip;

  // Mock location data (thay thế bằng API thật)
  if (ip === "127.0.0.1" || ip === "::1") {
    this.location = {
      country: "Vietnam",
      city: "Local",
      region: "Local",
      coordinates: { latitude: 21.0285, longitude: 105.8542 },
    };
  }
};

/**
 * Instance method: Phân tích user agent để lấy thông tin thiết bị
 */
trackingUserForLogoutSchema.methods.parseUserAgent = function (userAgent) {
  if (!userAgent) return;

  this.deviceInfo.userAgent = userAgent;

  // Phân tích đơn giản (có thể dùng thư viện như ua-parser-js)
  if (
    userAgent.includes("Mobile") ||
    userAgent.includes("Android") ||
    userAgent.includes("iPhone")
  ) {
    this.deviceInfo.platform = "mobile";
  } else if (userAgent.includes("Tablet") || userAgent.includes("iPad")) {
    this.deviceInfo.platform = "tablet";
  } else {
    this.deviceInfo.platform = "desktop";
  }

  // Phân tích trình duyệt
  if (userAgent.includes("Chrome")) {
    this.deviceInfo.browser = "Chrome";
  } else if (userAgent.includes("Firefox")) {
    this.deviceInfo.browser = "Firefox";
  } else if (userAgent.includes("Safari")) {
    this.deviceInfo.browser = "Safari";
  } else if (userAgent.includes("Edge")) {
    this.deviceInfo.browser = "Edge";
  } else {
    this.deviceInfo.browser = "Unknown";
  }
};

/**
 * Static method: Lấy lịch sử đăng xuất của user
 */
trackingUserForLogoutSchema.statics.getUserLogoutHistory = function (
  userId,
  limit = 20
) {
  return this.find({ userId: userId }).sort({ logoutTime: -1 }).limit(limit);
};

/**
 * Static method: Thống kê thời lượng phiên trung bình theo role
 */
trackingUserForLogoutSchema.statics.getAverageSessionDuration =
  async function () {
    const stats = await this.aggregate([
      {
        $group: {
          _id: "$role",
          avgDuration: { $avg: "$sessionDuration" },
          totalSessions: { $sum: 1 },
          totalDuration: { $sum: "$sessionDuration" },
        },
      },
    ]);

    return stats.reduce((acc, stat) => {
      acc[stat._id] = {
        averageDuration: Math.round(stat.avgDuration),
        totalSessions: stat.totalSessions,
        totalDuration: stat.totalDuration,
      };
      return acc;
    }, {});
  };

/**
 * Static method: Phát hiện phiên đăng nhập đáng ngờ
 */
trackingUserForLogoutSchema.statics.getSuspiciousSessions = function (
  hours = 24
) {
  const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);

  return this.find({
    logoutTime: { $gte: cutoffDate },
    $or: [
      { sessionStatus: "suspicious" },
      { sessionDuration: { $lt: 1 } }, // Phiên < 1 phút
      { logoutReason: "security_logout" },
    ],
  }).sort({ logoutTime: -1 });
};

/**
 * Static method: Thống kê đăng xuất theo lý do
 */
trackingUserForLogoutSchema.statics.getLogoutReasonStats = async function (
  days = 30
) {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const stats = await this.aggregate([
    {
      $match: { logoutTime: { $gte: cutoffDate } },
    },
    {
      $group: {
        _id: "$logoutReason",
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
 * Static method: Lấy danh sách user đang online (phiên chưa logout)
 */
trackingUserForLogoutSchema.statics.getActiveUsers = async function () {
  const activeLogins = await this.aggregate([
    {
      $sort: { userId: 1, loginTime: -1 },
    },
    {
      $group: {
        _id: "$userId",
        latestLogin: { $first: "$loginTime" },
        userInfo: { $first: { name: "$name", email: "$email", role: "$role" } },
      },
    },
  ]);

  return activeLogins.map((login) => ({
    userId: login._id,
    ...login.userInfo,
    lastActivity: login.latestLogin,
  }));
};

/**
 * Index để tối ưu hiệu suất
 */
trackingUserForLogoutSchema.index({ userId: 1 }); // Index cho user ID
trackingUserForLogoutSchema.index({ email: 1 }); // Index cho email
trackingUserForLogoutSchema.index({ logoutTime: -1 }); // Index cho thời gian logout
trackingUserForLogoutSchema.index({ loginTime: -1 }); // Index cho thời gian login
trackingUserForLogoutSchema.index({ tokenId: 1 }); // Index cho token ID
trackingUserForLogoutSchema.index({ sessionDuration: -1 }); // Index cho thời lượng phiên
trackingUserForLogoutSchema.index({ logoutReason: 1 }); // Index cho lý do logout
trackingUserForLogoutSchema.index({ "deviceInfo.ipAddress": 1 }); // Index cho IP
trackingUserForLogoutSchema.index({ createdAt: -1 }); // Index cho thời gian tạo

/**
 * Export model TrackingUserForLogout
 */
module.exports = mongoose.model(
  "TrackingUserForLogout",
  trackingUserForLogoutSchema
);
