/**
 * Model LocationsClient - Lưu thông tin vị trí và thiết bị của client
 * Bao gồm GPS coordinates, IP, device info, và tracking data
 */

const mongoose = require("mongoose");

/**
 * Schema định nghĩa cấu trúc dữ liệu LocationsClient
 */
const locationsClientSchema = new mongoose.Schema(
  {
    // IP address của client
    ip: {
      type: String,
      required: [true, "IP address là bắt buộc"],
      trim: true,
      maxlength: [45, "IP không được vượt quá 45 ký tự"], // IPv6 max length
    },

    // Địa chỉ IP thực (nếu có proxy)
    realIp: {
      type: String,
      trim: true,
      maxlength: [45, "Real IP không được vượt quá 45 ký tự"],
    },

    // Tọa độ GPS
    latitude: {
      type: Number,
      required: [true, "Latitude là bắt buộc"],
      min: [-90, "Latitude phải từ -90 đến 90"],
      max: [90, "Latitude phải từ -90 đến 90"],
    },

    longitude: {
      type: Number,
      required: [true, "Longitude là bắt buộc"],
      min: [-180, "Longitude phải từ -180 đến 180"],
      max: [180, "Longitude phải từ -180 đến 180"],
    },

    // Độ chính xác của GPS (metres)
    accuracy: {
      type: Number,
      min: [0, "Accuracy không được âm"],
      max: [10000, "Accuracy không được vượt quá 10000m"],
    },

    // Thông tin quốc gia từ IP
    country: {
      type: String,
      trim: true,
      maxlength: [100, "Country không được vượt quá 100 ký tự"],
    },

    // Thông tin thành phố từ IP
    city: {
      type: String,
      trim: true,
      maxlength: [100, "City không được vượt quá 100 ký tự"],
    },

    // Thông tin vùng/miền từ IP
    region: {
      type: String,
      trim: true,
      maxlength: [100, "Region không được vượt quá 100 ký tự"],
    },

    // Thông tin thiết bị chi tiết
    deviceInfo: {
      // Thông tin cơ bản
      userAgent: {
        type: String,
        trim: true,
        maxlength: [500, "User agent không được vượt quá 500 ký tự"],
      },

      platform: {
        type: String,
        trim: true,
        maxlength: [100, "Platform không được vượt quá 100 ký tự"],
      },

      browser: {
        type: String,
        trim: true,
        maxlength: [100, "Browser không được vượt quá 100 ký tự"],
      },

      browserVersion: {
        type: String,
        trim: true,
        maxlength: [50, "Browser version không được vượt quá 50 ký tự"],
      },

      os: {
        type: String,
        trim: true,
        maxlength: [100, "OS không được vượt quá 100 ký tự"],
      },

      osVersion: {
        type: String,
        trim: true,
        maxlength: [100, "OS version không được vượt quá 100 ký tự"],
      },

      // Thông tin màn hình và hiển thị
      screenResolution: {
        type: String,
        trim: true,
        maxlength: [50, "Screen resolution không được vượt quá 50 ký tự"],
      },

      viewportSize: {
        type: String,
        trim: true,
        maxlength: [50, "Viewport size không được vượt quá 50 ký tự"],
      },

      colorDepth: {
        type: Number,
        min: [1, "Color depth phải lớn hơn 0"],
        max: [32, "Color depth không được vượt quá 32"],
      },

      pixelRatio: {
        type: Number,
        min: [0.5, "Pixel ratio phải lớn hơn 0.5"],
        max: [5, "Pixel ratio không được vượt quá 5"],
      },

      // Thông tin địa phương và ngôn ngữ
      timezone: {
        type: String,
        trim: true,
        maxlength: [50, "Timezone không được vượt quá 50 ký tự"],
      },

      language: {
        type: String,
        trim: true,
        maxlength: [10, "Language không được vượt quá 10 ký tự"],
      },

      languages: [
        {
          type: String,
          trim: true,
          maxlength: [10, "Language không được vượt quá 10 ký tự"],
        },
      ],

      // Thông tin phần cứng
      hardwareConcurrency: {
        type: Number,
        min: [1, "Hardware concurrency phải lớn hơn 0"],
        max: [128, "Hardware concurrency không được vượt quá 128"],
      },

      deviceMemory: {
        type: Number,
        min: [0.5, "Device memory phải lớn hơn 0.5 GB"],
        max: [64, "Device memory không được vượt quá 64 GB"],
      },

      // Thông tin kết nối và mạng
      connectionType: {
        type: String,
        enum: {
          values: [
            "wifi",
            "cellular",
            "ethernet",
            "bluetooth",
            "usb",
            "unknown",
          ],
          message: "Connection type không hợp lệ",
        },
      },

      connectionSpeed: {
        type: String,
        enum: {
          values: ["slow", "fast", "4g", "3g", "2g", "unknown"],
          message: "Connection speed không hợp lệ",
        },
      },

      // Thông tin bảo mật thiết bị
      isIncognito: {
        type: Boolean,
        default: false,
      },

      isVirtualMachine: {
        type: Boolean,
        default: false,
      },

      isEmulated: {
        type: Boolean,
        default: false,
      },

      // Thông tin cảm biến và khả năng
      hasTouchSupport: {
        type: Boolean,
        default: false,
      },

      hasCamera: {
        type: Boolean,
        default: false,
      },

      hasMicrophone: {
        type: Boolean,
        default: false,
      },

      hasGPS: {
        type: Boolean,
        default: false,
      },

      hasBluetooth: {
        type: Boolean,
        default: false,
      },

      hasNFC: {
        type: Boolean,
        default: false,
      },

      // Thông tin ứng dụng và môi trường
      appName: {
        type: String,
        trim: true,
        maxlength: [100, "App name không được vượt quá 100 ký tự"],
      },

      appVersion: {
        type: String,
        trim: true,
        maxlength: [50, "App version không được vượt quá 50 ký tự"],
      },

      // Thông tin bổ sung
      fingerprint: {
        type: String,
        trim: true,
        maxlength: [200, "Device fingerprint không được vượt quá 200 ký tự"],
      },

      trustScore: {
        type: Number,
        min: [0, "Trust score không được âm"],
        max: [100, "Trust score không được vượt quá 100"],
        default: 50,
      },
    },

    // Thông tin mạng
    networkInfo: {
      isp: {
        type: String,
        trim: true,
        maxlength: [200, "ISP không được vượt quá 200 ký tự"],
      },

      organization: {
        type: String,
        trim: true,
        maxlength: [200, "Organization không được vượt quá 200 ký tự"],
      },

      asn: {
        type: String,
        trim: true,
        maxlength: [50, "ASN không được vượt quá 50 ký tự"],
      },
    },

    // Thông tin truy cập
    accessInfo: {
      url: {
        type: String,
        required: [true, "URL là bắt buộc"],
        trim: true,
        maxlength: [500, "URL không được vượt quá 500 ký tự"],
      },

      referrer: {
        type: String,
        trim: true,
        maxlength: [500, "Referrer không được vượt quá 500 ký tự"],
      },

      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User ID là bắt buộc"],
      },

      sessionId: {
        type: String,
        required: [true, "Session ID là bắt buộc"],
        trim: true,
      },

      endpoint: {
        type: String,
        required: [true, "Endpoint là bắt buộc"],
        trim: true,
        maxlength: [200, "Endpoint không được vượt quá 200 ký tự"],
      },

      method: {
        type: String,
        required: [true, "HTTP method là bắt buộc"],
        enum: {
          values: ["GET", "POST", "PUT", "DELETE", "PATCH"],
          message: "HTTP method không hợp lệ",
        },
      },
    },

    // Thông tin bảo mật
    securityInfo: {
      isVpn: {
        type: Boolean,
        default: false,
      },

      isProxy: {
        type: Boolean,
        default: false,
      },

      isTor: {
        type: Boolean,
        default: false,
      },

      isDatacenter: {
        type: Boolean,
        default: false,
      },

      riskScore: {
        type: Number,
        min: [0, "Risk score không được âm"],
        max: [100, "Risk score không được vượt quá 100"],
        default: 0,
      },
    },

    // Metadata
    metadata: {
      source: {
        type: String,
        enum: {
          values: ["gps", "ip_geolocation", "manual", "browser"],
          message: "Source không hợp lệ",
        },
        default: "browser",
      },

      confidence: {
        type: Number,
        min: [0, "Confidence không được âm"],
        max: [100, "Confidence không được vượt quá 100"],
        default: 50,
      },

      notes: {
        type: String,
        trim: true,
        maxlength: [1000, "Notes không được vượt quá 1000 ký tự"],
      },
    },

    // Trạng thái hoạt động
    isActive: {
      type: Boolean,
      default: true,
    },

    // Thời gian hết hạn (optional)
    expiresAt: {
      type: Date,
    },
  },
  {
    // Tự động thêm createdAt và updatedAt
    timestamps: true,

    // Tùy chọn cho JSON output
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        // Ẩn các field nhạy cảm nếu cần
        delete ret.__v;
        return ret;
      },
    },

    // Tùy chọn cho Object output
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

/**
 * Virtual field: Tính khoảng cách từ một điểm GPS khác
 */
locationsClientSchema.virtual("distanceFrom").get(function (lat, lng) {
  if (!lat || !lng) return null;

  const R = 6371; // Radius of the Earth in kilometers
  const dLat = ((lat - this.latitude) * Math.PI) / 180;
  const dLng = ((lng - this.longitude) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((this.latitude * Math.PI) / 180) *
      Math.cos((lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers

  return Math.round(distance * 1000); // Return in meters
});

/**
 * Virtual field: Kiểm tra vị trí có trong phạm vi cho phép không
 */
locationsClientSchema
  .virtual("isWithinRange")
  .get(function (centerLat, centerLng, radiusKm) {
    if (!centerLat || !centerLng || !radiusKm) return null;

    const distance = this.distanceFrom(centerLat, centerLng);
    return distance <= radiusKm * 1000; // Convert km to meters
  });

/**
 * Virtual field: Định dạng địa chỉ đầy đủ
 */
locationsClientSchema.virtual("fullAddress").get(function () {
  const parts = [this.city, this.region, this.country].filter(Boolean);
  return parts.join(", ");
});

/**
 * Virtual field: Kiểm tra có phải vị trí đáng ngờ không
 */
locationsClientSchema.virtual("isSuspicious").get(function () {
  return (
    this.securityInfo.isVpn ||
    this.securityInfo.isProxy ||
    this.securityInfo.isTor ||
    this.securityInfo.riskScore > 70
  );
});

/**
 * Index để tối ưu hiệu suất
 */
locationsClientSchema.index({ ip: 1 }); // Index cho IP
locationsClientSchema.index({ latitude: 1, longitude: 1 }); // Index cho GPS
locationsClientSchema.index({ "accessInfo.userId": 1 }); // Index cho user
locationsClientSchema.index({ "accessInfo.sessionId": 1 }); // Index cho session
locationsClientSchema.index({ createdAt: -1 }); // Index cho thời gian tạo
locationsClientSchema.index({ country: 1, city: 1 }); // Index cho location
locationsClientSchema.index({ "securityInfo.riskScore": -1 }); // Index cho risk score

/**
 * Static method: Tìm theo IP
 */
locationsClientSchema.statics.findByIp = function (ip) {
  return this.findOne({ ip: ip });
};

/**
 * Static method: Tìm theo user ID
 */
locationsClientSchema.statics.findByUserId = function (userId) {
  return this.find({ "accessInfo.userId": userId }).sort({ createdAt: -1 });
};

/**
 * Static method: Tìm theo khoảng thời gian
 */
locationsClientSchema.statics.findByDateRange = function (startDate, endDate) {
  return this.find({
    createdAt: {
      $gte: startDate,
      $lte: endDate,
    },
  }).sort({ createdAt: -1 });
};

/**
 * Static method: Thống kê theo quốc gia
 */
locationsClientSchema.statics.getStatsByCountry = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: "$country",
        count: { $sum: 1 },
        avgRiskScore: { $avg: "$securityInfo.riskScore" },
        uniqueUsers: { $addToSet: "$accessInfo.userId" },
        latestAccess: { $max: "$createdAt" },
      },
    },
    {
      $project: {
        country: "$_id",
        count: 1,
        avgRiskScore: { $round: ["$avgRiskScore", 2] },
        uniqueUsersCount: { $size: "$uniqueUsers" },
        latestAccess: 1,
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);

  return stats;
};

/**
 * Static method: Lấy vị trí gần đây nhất của user
 */
locationsClientSchema.statics.getLatestLocation = function (userId) {
  return this.findOne({
    "accessInfo.userId": userId,
    isActive: true,
  }).sort({ createdAt: -1 });
};

/**
 * Static method: Tìm vị trí đáng ngờ
 */
locationsClientSchema.statics.getSuspiciousLocations = function (limit = 100) {
  return this.find({
    $or: [
      { "securityInfo.isVpn": true },
      { "securityInfo.isProxy": true },
      { "securityInfo.isTor": true },
      { "securityInfo.riskScore": { $gt: 70 } },
    ],
    isActive: true,
  })
    .sort({ "securityInfo.riskScore": -1, createdAt: -1 })
    .limit(limit);
};

/**
 * Instance method: Cập nhật vị trí mới
 */
locationsClientSchema.methods.updateLocation = function (
  newLat,
  newLng,
  newAccuracy
) {
  this.latitude = newLat;
  this.longitude = newLng;
  if (newAccuracy !== undefined) {
    this.accuracy = newAccuracy;
  }
  this.updatedAt = new Date();
  return this.save();
};

/**
 * Instance method: Đánh dấu là không hoạt động
 */
locationsClientSchema.methods.deactivate = function () {
  this.isActive = false;
  return this.save();
};

/**
 * Instance method: Cập nhật thông tin bảo mật
 */
locationsClientSchema.methods.updateSecurityInfo = function (securityData) {
  Object.assign(this.securityInfo, securityData);
  return this.save();
};

/**
 * Instance method: Kiểm tra có cùng quốc gia không
 */
locationsClientSchema.methods.isSameCountry = function (country) {
  return this.country === country;
};

/**
 * Instance method: Kiểm tra có cùng thành phố không
 */
locationsClientSchema.methods.isSameCity = function (city) {
  return this.city === city;
};

/**
 * Pre-save middleware: Validate GPS coordinates
 */
locationsClientSchema.pre("save", function (next) {
  // Validate GPS coordinates are reasonable
  if (this.latitude === 0 && this.longitude === 0) {
    // Có thể là vị trí mặc định, cần kiểm tra kỹ hơn
    console.warn(
      "⚠️ Warning: GPS coordinates are 0,0 - may be default location"
    );
  }

  // Validate IP format (basic check)
  const ipRegex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  if (this.ip && !ipRegex.test(this.ip)) {
    return next(new Error("Invalid IP address format"));
  }

  next();
});

/**
 * Export model LocationsClient
 */
module.exports = mongoose.model("LocationsClient", locationsClientSchema);
