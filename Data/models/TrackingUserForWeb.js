/**
 * Model TrackingUserForWeb - Theo dõi hoạt động của người dùng trên web
 * Ghi lại mọi URL truy cập, địa chỉ IP, tọa độ GPS, và thông tin user
 */

const mongoose = require("mongoose");

/**
 * Schema định nghĩa cấu trúc dữ liệu TrackingUserForWeb
 */
const trackingUserForWebSchema = new mongoose.Schema(
  {
    // Thông tin người dùng (nếu đã đăng nhập)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // Có thể null nếu chưa đăng nhập
      index: true,
    },

    // Thông tin cá nhân (thu thập khi có thể)
    name: {
      type: String,
      trim: true,
      maxlength: [100, "Tên không được vượt quá 100 ký tự"],
      default: null,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Email không hợp lệ",
      ],
      default: null,
      index: true,
    },

    // Thông tin truy cập web
    url: {
      type: String,
      required: [true, "URL là bắt buộc"],
      trim: true,
      maxlength: [2000, "URL không được vượt quá 2000 ký tự"],
      index: true,
    },

    method: {
      type: String,
      enum: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
      required: [true, "Method HTTP là bắt buộc"],
      default: "GET",
    },

    userAgent: {
      type: String,
      trim: true,
      maxlength: [500, "User Agent không được vượt quá 500 ký tự"],
    },

    referer: {
      type: String,
      trim: true,
      maxlength: [2000, "Referer không được vượt quá 2000 ký tự"],
    },

    // Thông tin địa chỉ IP và địa lý
    ipAddress: {
      type: String,
      required: [true, "IP address là bắt buộc"],
      trim: true,
      index: true,
    },

    // Địa chỉ vật lý (reverse geocode từ lat/long)
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String,
      fullAddress: String,
    },

    // Tọa độ GPS
    latitude: {
      type: Number,
      min: [-90, "Latitude phải từ -90 đến 90"],
      max: [90, "Latitude phải từ -90 đến 90"],
      index: true,
    },

    longitude: {
      type: Number,
      min: [-180, "Longitude phải từ -180 đến 180"],
      max: [180, "Longitude phải từ -180 đến 180"],
      index: true,
    },

    // Thông tin vị trí chi tiết
    location: {
      accuracy: Number, // Độ chính xác GPS (meters)
      altitude: Number, // Độ cao (meters)
      altitudeAccuracy: Number,
      heading: Number, // Hướng di chuyển (degrees)
      speed: Number, // Tốc độ (m/s)
    },

    // Thông tin thiết bị và trình duyệt
    deviceInfo: {
      type: {
        type: String,
        enum: ["desktop", "mobile", "tablet", "unknown"],
        default: "unknown",
      },
      os: String, // Windows, macOS, Linux, iOS, Android
      osVersion: String,
      browser: String, // Chrome, Firefox, Safari, Edge
      browserVersion: String,
      screenResolution: String, // 1920x1080
      viewportSize: String, // 1920x1080
      colorDepth: Number,
      pixelRatio: Number,
      touchSupport: Boolean,
      cookiesEnabled: Boolean,
      javascriptEnabled: Boolean,
      language: String, // vi-VN, en-US
    },

    // Thông tin mạng
    networkInfo: {
      connectionType: {
        type: String,
        enum: ["wifi", "cellular", "ethernet", "bluetooth", "unknown"],
        default: "unknown",
      },
      effectiveType: {
        type: String,
        enum: ["slow-2g", "2g", "3g", "4g", "5g", "unknown"],
        default: "unknown",
      },
      downlink: Number, // Mbps
      rtt: Number, // ms
      saveData: Boolean,
    },

    // Thông tin session
    sessionId: {
      type: String,
      index: true,
      default: null,
    },

    // Thời gian truy cập
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },

    // Thời gian ở lại trang (milliseconds) - cập nhật khi rời đi
    timeSpent: {
      type: Number,
      default: 0,
      min: [0, "Thời gian ở lại không thể âm"],
    },

    // URL tiếp theo (để track navigation)
    nextUrl: {
      type: String,
      trim: true,
      maxlength: [2000, "Next URL không được vượt quá 2000 ký tự"],
    },

    // Trạng thái của tracking record
    status: {
      type: String,
      enum: ["active", "completed", "abandoned"],
      default: "active",
    },

    // Metadata bổ sung
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Flag để đánh dấu các hoạt động đáng ngờ
    suspiciousFlags: [
      {
        type: {
          type: String,
          enum: [
            "rapid_clicking",
            "unusual_navigation",
            "suspicious_ip",
            "vpn_detected",
            "proxy_detected",
          ],
        },
        severity: {
          type: String,
          enum: ["low", "medium", "high", "critical"],
          default: "low",
        },
        description: String,
        detectedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Bot detection
    botDetection: {
      isBot: {
        type: Boolean,
        default: false,
      },
      botType: {
        type: String,
        enum: ["search_engine", "crawler", "scraper", "malicious", "suspicious", "unknown"],
        default: null,
      },
      confidence: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
    },
  },
  {
    // Tự động thêm createdAt và updatedAt
    timestamps: true,

    // Tùy chọn cho JSON output
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },

    // Tùy chọn cho Object output
    toObject: {
      virtuals: true,
    },
  }
);

/**
 * Virtual field: Kiểm tra xem record có tọa độ GPS không
 */
trackingUserForWebSchema.virtual("hasLocation").get(function () {
  return this.latitude !== undefined && this.longitude !== undefined;
});

/**
 * Virtual field: Tính khoảng cách từ một điểm
 */
trackingUserForWebSchema
  .virtual("distanceFrom", {
    ref: "TrackingUserForWeb",
    localField: "_id",
    foreignField: "_id",
  })
  .get(function () {
    // Hàm tính khoảng cách giữa 2 điểm GPS (Haversine formula)
    return function (targetLat, targetLng) {
      if (!this.hasLocation || !targetLat || !targetLng) return null;

      const R = 6371; // Earth's radius in kilometers
      const dLat = ((targetLat - this.latitude) * Math.PI) / 180;
      const dLng = ((targetLng - this.longitude) * Math.PI) / 180;

      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((this.latitude * Math.PI) / 180) *
          Math.cos((targetLat * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c; // Distance in kilometers

      return distance;
    };
  });

/**
 * Pre-save middleware: Validation và enrichment
 */
trackingUserForWebSchema.pre("save", function (next) {
  // Auto-detect device type from user agent
  if (this.userAgent && !this.deviceInfo.type) {
    this.deviceInfo.type = this.detectDeviceType();
  }

  // Mark as suspicious if rapid requests from same IP
  if (this.ipAddress) {
    this.checkForSuspiciousActivity();
  }

  next();
});

/**
 * Instance method: Phát hiện loại thiết bị
 */
trackingUserForWebSchema.methods.detectDeviceType = function () {
  if (!this.userAgent) return "unknown";

  const ua = this.userAgent.toLowerCase();

  if (
    ua.includes("mobile") ||
    ua.includes("android") ||
    ua.includes("iphone")
  ) {
    return "mobile";
  } else if (ua.includes("tablet") || ua.includes("ipad")) {
    return "tablet";
  } else if (
    ua.includes("windows") ||
    ua.includes("macintosh") ||
    ua.includes("linux")
  ) {
    return "desktop";
  }

  return "unknown";
};

/**
 * Instance method: Kiểm tra hoạt động đáng ngờ
 */
trackingUserForWebSchema.methods.checkForSuspiciousActivity = function () {
  // Kiểm tra VPN/Proxy IPs (simple check - có thể mở rộng)
  const suspiciousIPs = [
    // Có thể load từ database hoặc config
    // '192.168.1.1', etc.
  ];

  if (suspiciousIPs.includes(this.ipAddress)) {
    this.suspiciousFlags.push({
      type: "suspicious_ip",
      severity: "medium",
      description: "IP address flagged as suspicious",
    });
  }

  // Kiểm tra tọa độ GPS bất thường (nếu có)
  if (this.hasLocation) {
    // Ví dụ: tọa độ ở Bắc Cực hoặc Nam Cực
    if (Math.abs(this.latitude) > 85) {
      this.suspiciousFlags.push({
        type: "unusual_navigation",
        severity: "low",
        description: "Unusual GPS coordinates",
      });
    }
  }
};

/**
 * Instance method: Cập nhật thời gian ở lại trang
 */
trackingUserForWebSchema.methods.updateTimeSpent = function (timeSpentMs) {
  this.timeSpent = timeSpentMs;
  this.status = "completed";
  return this.save();
};

/**
 * Instance method: Đánh dấu bot
 */
trackingUserForWebSchema.methods.markAsBot = function (
  botType = "unknown",
  confidence = 50
) {
  this.botDetection.isBot = true;
  this.botDetection.botType = botType;
  this.botDetection.confidence = confidence;
  return this.save();
};

/**
 * Static method: Lấy thống kê truy cập theo IP
 */
trackingUserForWebSchema.statics.getStatsByIP = function (ipAddress, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        ipAddress: ipAddress,
        timestamp: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: null,
        totalVisits: { $sum: 1 },
        uniqueUrls: { $addToSet: "$url" },
        avgTimeSpent: { $avg: "$timeSpent" },
        lastVisit: { $max: "$timestamp" },
        suspiciousFlags: { $push: "$suspiciousFlags" },
      },
    },
    {
      $project: {
        totalVisits: 1,
        uniqueUrlsCount: { $size: "$uniqueUrls" },
        avgTimeSpent: { $round: ["$avgTimeSpent", 2] },
        lastVisit: 1,
        suspiciousActivities: {
          $reduce: {
            input: "$suspiciousFlags",
            initialValue: [],
            in: { $concatArrays: ["$$value", "$$this"] },
          },
        },
      },
    },
  ]);
};

/**
 * Static method: Lấy thống kê theo user
 */
trackingUserForWebSchema.statics.getStatsByUser = function (userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        timestamp: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: "$userId",
        totalSessions: { $sum: 1 },
        uniqueIPs: { $addToSet: "$ipAddress" },
        visitedUrls: { $addToSet: "$url" },
        totalTimeSpent: { $sum: "$timeSpent" },
        avgTimeSpent: { $avg: "$timeSpent" },
        firstVisit: { $min: "$timestamp" },
        lastVisit: { $max: "$timestamp" },
        deviceTypes: { $addToSet: "$deviceInfo.type" },
      },
    },
    {
      $project: {
        totalSessions: 1,
        uniqueIPsCount: { $size: "$uniqueIPs" },
        visitedUrlsCount: { $size: "$visitedUrls" },
        totalTimeSpent: { $round: ["$totalTimeSpent", 2] },
        avgTimeSpent: { $round: ["$avgTimeSpent", 2] },
        firstVisit: 1,
        lastVisit: 1,
        deviceTypes: 1,
        activityPeriod: {
          $divide: [
            { $subtract: ["$lastVisit", "$firstVisit"] },
            1000 * 60 * 60 * 24, // Convert to days
          ],
        },
      },
    },
  ]);
};

/**
 * Static method: Phát hiện bots
 */
trackingUserForWebSchema.statics.detectBots = function (threshold = 70) {
  return this.find({
    "botDetection.confidence": { $gte: threshold },
    "botDetection.isBot": true,
  }).select("ipAddress userAgent url botDetection");
};

/**
 * Static method: Lấy top URLs được truy cập
 */
trackingUserForWebSchema.statics.getTopUrls = function (limit = 10, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate },
        status: { $ne: "abandoned" },
      },
    },
    {
      $group: {
        _id: "$url",
        visitCount: { $sum: 1 },
        uniqueVisitors: { $addToSet: "$ipAddress" },
        avgTimeSpent: { $avg: "$timeSpent" },
        lastVisit: { $max: "$timestamp" },
      },
    },
    {
      $project: {
        url: "$_id",
        visitCount: 1,
        uniqueVisitorsCount: { $size: "$uniqueVisitors" },
        avgTimeSpent: { $round: ["$avgTimeSpent", 2] },
        lastVisit: 1,
      },
    },
    {
      $sort: { visitCount: -1 },
    },
    {
      $limit: limit,
    },
  ]);
};

/**
 * Indexes để tối ưu hiệu suất
 */
trackingUserForWebSchema.index({ ipAddress: 1, timestamp: -1 }); // IP + thời gian
trackingUserForWebSchema.index({ userId: 1, timestamp: -1 }); // User + thời gian
trackingUserForWebSchema.index({ url: 1, timestamp: -1 }); // URL + thời gian
trackingUserForWebSchema.index({ latitude: 1, longitude: 1 }); // GPS coordinates
trackingUserForWebSchema.index({ "deviceInfo.type": 1 }); // Device type
trackingUserForWebSchema.index({ sessionId: 1 }); // Session tracking
trackingUserForWebSchema.index({ timestamp: -1 }); // Thời gian
trackingUserForWebSchema.index({ "botDetection.isBot": 1 }); // Bot detection

/**
 * Export model TrackingUserForWeb
 */
module.exports = mongoose.model("TrackingUserForWeb", trackingUserForWebSchema);
