/**
 * Model EncodeFacedID - Lưu trữ dữ liệu mã hóa khuôn mặt
 * Chứa khoảng 100 thông số đặc trưng của khuôn mặt để nhận diện
 * Bảo mật cấp độ cao với mã hóa đặc biệt
 */

const mongoose = require("mongoose");

/**
 * Schema định nghĩa cấu trúc dữ liệu EncodeFacedID với ~100 thông số
 */
const encodeFacedIDSchema = new mongoose.Schema(
  {
    // Thông tin cơ bản
    faceId: {
      type: String,
      required: [true, "Face ID là bắt buộc"],
      unique: true,
      trim: true,
      maxlength: [100, "Face ID không được vượt quá 100 ký tự"],
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID là bắt buộc"],
    },

    // Thông tin phiên bản và metadata
    version: {
      type: String,
      required: [true, "Version là bắt buộc"],
      default: "1.0",
      maxlength: [20, "Version không được vượt quá 20 ký tự"],
    },

    algorithm: {
      type: String,
      required: [true, "Algorithm là bắt buộc"],
      enum: {
        values: [
          "dlib",
          "face_recognition",
          "deepface",
          "insightface",
          "custom",
        ],
        message: "Algorithm không hợp lệ",
      },
      default: "custom",
    },

    // Dữ liệu mã hóa khuôn mặt - 128 dimensions (chuẩn face_recognition)
    faceEncoding: {
      // Khuôn mặt chính (128 giá trị)
      primary: {
        type: [Number],
        required: [true, "Primary face encoding là bắt buộc"],
        validate: {
          validator: function (v) {
            return (
              v &&
              v.length === 128 &&
              v.every((n) => typeof n === "number" && !isNaN(n))
            );
          },
          message: "Primary face encoding phải có đúng 128 giá trị số",
        },
      },

      // Khuôn mặt phụ (nếu có)
      secondary: {
        type: [Number],
        validate: {
          validator: function (v) {
            return (
              !v ||
              (v.length === 128 &&
                v.every((n) => typeof n === "number" && !isNaN(n)))
            );
          },
          message:
            "Secondary face encoding phải có đúng 128 giá trị số hoặc rỗng",
        },
      },

      // Khuôn mặt dự phòng
      fallback: {
        type: [Number],
        validate: {
          validator: function (v) {
            return (
              !v ||
              (v.length === 128 &&
                v.every((n) => typeof n === "number" && !isNaN(n)))
            );
          },
          message:
            "Fallback face encoding phải có đúng 128 giá trị số hoặc rỗng",
        },
      },
    },

    // Đặc trưng chi tiết khuôn mặt (68 điểm landmarks chuẩn)
    facialLandmarks: {
      // Khu vực mắt (16 điểm)
      leftEye: {
        // Điểm viền mắt trái (8 điểm)
        contour: [
          { x: Number, y: Number }, // 0
          { x: Number, y: Number }, // 1
          { x: Number, y: Number }, // 2
          { x: Number, y: Number }, // 3
          { x: Number, y: Number }, // 4
          { x: Number, y: Number }, // 5
          { x: Number, y: Number }, // 6
          { x: Number, y: Number }, // 7
        ],
        // Điểm đặc trưng mắt
        leftCorner: { x: Number, y: Number },
        rightCorner: { x: Number, y: Number },
        top: { x: Number, y: Number },
        bottom: { x: Number, y: Number },
        center: { x: Number, y: Number },
        // Thông số mắt
        width: Number,
        height: Number,
        aspectRatio: Number,
        openness: Number,
      },

      rightEye: {
        // Điểm viền mắt phải (8 điểm)
        contour: [
          { x: Number, y: Number }, // 0
          { x: Number, y: Number }, // 1
          { x: Number, y: Number }, // 2
          { x: Number, y: Number }, // 3
          { x: Number, y: Number }, // 4
          { x: Number, y: Number }, // 5
          { x: Number, y: Number }, // 6
          { x: Number, y: Number }, // 7
        ],
        // Điểm đặc trưng mắt
        leftCorner: { x: Number, y: Number },
        rightCorner: { x: Number, y: Number },
        top: { x: Number, y: Number },
        bottom: { x: Number, y: Number },
        center: { x: Number, y: Number },
        // Thông số mắt
        width: Number,
        height: Number,
        aspectRatio: Number,
        openness: Number,
      },

      // Khu vực lông mày (10 điểm mỗi bên)
      leftEyebrow: {
        contour: [
          { x: Number, y: Number }, // 0
          { x: Number, y: Number }, // 1
          { x: Number, y: Number }, // 2
          { x: Number, y: Number }, // 3
          { x: Number, y: Number }, // 4
          { x: Number, y: Number }, // 5
          { x: Number, y: Number }, // 6
          { x: Number, y: Number }, // 7
          { x: Number, y: Number }, // 8
          { x: Number, y: Number }, // 9
        ],
        left: { x: Number, y: Number },
        right: { x: Number, y: Number },
        center: { x: Number, y: Number },
        // Thông số lông mày
        thickness: Number,
        arch: Number,
        length: Number,
      },

      rightEyebrow: {
        contour: [
          { x: Number, y: Number }, // 0
          { x: Number, y: Number }, // 1
          { x: Number, y: Number }, // 2
          { x: Number, y: Number }, // 3
          { x: Number, y: Number }, // 4
          { x: Number, y: Number }, // 5
          { x: Number, y: Number }, // 6
          { x: Number, y: Number }, // 7
          { x: Number, y: Number }, // 8
          { x: Number, y: Number }, // 9
        ],
        left: { x: Number, y: Number },
        right: { x: Number, y: Number },
        center: { x: Number, y: Number },
        // Thông số lông mày
        thickness: Number,
        arch: Number,
        length: Number,
      },

      // Khu vực mũi (9 điểm)
      nose: {
        contour: [
          { x: Number, y: Number }, // 0 - Bridge top
          { x: Number, y: Number }, // 1
          { x: Number, y: Number }, // 2
          { x: Number, y: Number }, // 3 - Nose tip
          { x: Number, y: Number }, // 4 - Left nostril top
          { x: Number, y: Number }, // 5 - Left nostril bottom
          { x: Number, y: Number }, // 6 - Right nostril top
          { x: Number, y: Number }, // 7 - Right nostril bottom
          { x: Number, y: Number }, // 8 - Nose bottom
        ],
        tip: { x: Number, y: Number },
        bridge: { x: Number, y: Number },
        left: { x: Number, y: Number },
        right: { x: Number, y: Number },
        // Thông số mũi
        length: Number,
        width: Number,
        height: Number,
        bridgeHeight: Number,
        tipAngle: Number,
      },

      // Khu vực miệng (20 điểm)
      mouth: {
        // Điểm viền môi ngoài (12 điểm)
        outerContour: [
          { x: Number, y: Number }, // 0 - Left corner
          { x: Number, y: Number }, // 1
          { x: Number, y: Number }, // 2
          { x: Number, y: Number }, // 3
          { x: Number, y: Number }, // 4
          { x: Number, y: Number }, // 5
          { x: Number, y: Number }, // 6
          { x: Number, y: Number }, // 7
          { x: Number, y: Number }, // 8
          { x: Number, y: Number }, // 9
          { x: Number, y: Number }, // 10
          { x: Number, y: Number }, // 11
        ],
        // Điểm viền môi trong (8 điểm)
        innerContour: [
          { x: Number, y: Number }, // 0
          { x: Number, y: Number }, // 1
          { x: Number, y: Number }, // 2
          { x: Number, y: Number }, // 3
          { x: Number, y: Number }, // 4
          { x: Number, y: Number }, // 5
          { x: Number, y: Number }, // 6
          { x: Number, y: Number }, // 7
        ],
        // Điểm đặc trưng miệng
        leftCorner: { x: Number, y: Number },
        rightCorner: { x: Number, y: Number },
        top: { x: Number, y: Number },
        bottom: { x: Number, y: Number },
        center: { x: Number, y: Number },
        // Thông số miệng
        width: Number,
        height: Number,
        aspectRatio: Number,
        openness: Number,
        smileIntensity: Number,
        lipThickness: Number,
      },

      // Khu vực cằm và đường viền mặt (17 điểm)
      chin: {
        tip: { x: Number, y: Number },
        left: { x: Number, y: Number },
        right: { x: Number, y: Number },
        // Thông số cằm
        width: Number,
        height: Number,
        protrusion: Number,
      },

      jawline: [
        { x: Number, y: Number }, // 0 - Left ear
        { x: Number, y: Number }, // 1
        { x: Number, y: Number }, // 2
        { x: Number, y: Number }, // 3
        { x: Number, y: Number }, // 4
        { x: Number, y: Number }, // 5
        { x: Number, y: Number }, // 6
        { x: Number, y: Number }, // 7
        { x: Number, y: Number }, // 8 - Chin
        { x: Number, y: Number }, // 9
        { x: Number, y: Number }, // 10
        { x: Number, y: Number }, // 11
        { x: Number, y: Number }, // 12
        { x: Number, y: Number }, // 13
        { x: Number, y: Number }, // 14
        { x: Number, y: Number }, // 15
        { x: Number, y: Number }, // 16 - Right ear
      ],

      // Điểm tổng thể khuôn mặt
      faceContour: [
        { x: Number, y: Number }, // 0 - Right ear
        { x: Number, y: Number }, // 1
        { x: Number, y: Number }, // 2
        { x: Number, y: Number }, // 3
        { x: Number, y: Number }, // 4
        { x: Number, y: Number }, // 5
        { x: Number, y: Number }, // 6
        { x: Number, y: Number }, // 7
        { x: Number, y: Number }, // 8 - Chin
        { x: Number, y: Number }, // 9
        { x: Number, y: Number }, // 10
        { x: Number, y: Number }, // 11
        { x: Number, y: Number }, // 12
        { x: Number, y: Number }, // 13
        { x: Number, y: Number }, // 14
        { x: Number, y: Number }, // 15
        { x: Number, y: Number }, // 16 - Left ear
      ],
    },

    // Đặc trưng tổng thể khuôn mặt (32 thông số)
    facialFeatures: {
      // Hình dạng khuôn mặt
      faceShape: {
        type: String,
        enum: {
          values: [
            "oval",
            "round",
            "square",
            "heart",
            "diamond",
            "oblong",
            "triangle",
          ],
          message: "Face shape không hợp lệ",
        },
      },

      // Đặc điểm nổi bật (các đặc điểm dễ nhận diện)
      prominentFeatures: [String], // Mảng các đặc điểm nổi bật

      // Tỷ lệ khuôn mặt (8 thông số chính)
      ratios: {
        faceWidthToHeight: Number, // Tỷ lệ chiều rộng/chiều cao khuôn mặt
        eyeDistanceToFaceWidth: Number, // Khoảng cách mắt / chiều rộng khuôn mặt
        noseWidthToFaceWidth: Number, // Chiều rộng mũi / chiều rộng khuôn mặt
        mouthWidthToFaceWidth: Number, // Chiều rộng miệng / chiều rộng khuôn mặt
        foreheadToFaceHeight: Number, // Chiều cao trán / chiều cao khuôn mặt
        cheekboneWidthToFaceWidth: Number, // Chiều rộng gò má / chiều rộng khuôn mặt
        jawWidthToFaceWidth: Number, // Chiều rộng hàm / chiều rộng khuôn mặt
        chinToFaceHeight: Number, // Chiều cao cằm / chiều cao khuôn mặt
      },

      // Đặc điểm riêng biệt (các đặc điểm đặc trưng)
      distinctiveMarks: {
        scars: [String], // Sẹo
        moles: [String], // Nốt ruồi
        freckles: [String], // Tàn nhang
        dimples: [String], // Lúm đồng tiền
        birthmarks: [String], // Bớt bẩm sinh
        other: [String], // Các đặc điểm khác
      },

      // Đặc trưng hình học khuôn mặt (12 thông số)
      geometry: {
        faceArea: Number, // Diện tích khuôn mặt
        facePerimeter: Number, // Chu vi khuôn mặt
        faceCompactness: Number, // Độ compact của khuôn mặt
        faceElongation: Number, // Độ dài khuôn mặt
        faceCircularity: Number, // Độ tròn khuôn mặt

        // Tỷ lệ đối xứng
        leftRightSymmetry: Number, // Đối xứng trái-phải
        topBottomSymmetry: Number, // Đối xứng trên-dưới

        // Đặc trưng góc cạnh
        faceAngles: {
          jawAngle: Number, // Góc hàm
          chinAngle: Number, // Góc cằm
          foreheadAngle: Number, // Góc trán
        },

        // Đặc trưng đường cong
        curvature: {
          jawCurvature: Number, // Độ cong hàm
          cheekCurvature: Number, // Độ cong má
          foreheadCurvature: Number, // Độ cong trán
        },
      },

      // Đặc trưng màu sắc và texture (8 thông số)
      colorTexture: {
        skinTone: {
          type: String,
          enum: ["very_light", "light", "medium", "tan", "dark", "very_dark"],
        },
        skinTexture: {
          type: String,
          enum: ["smooth", "normal", "rough", "very_rough"],
        },
        skinPores: {
          type: String,
          enum: ["fine", "medium", "large", "very_large"],
        },
        skinWrinkles: {
          forehead: Number, // Nếp nhăn trán (0-100)
          eyeCorners: Number, // Nếp nhăn khóe mắt (0-100)
          nasolabial: Number, // Nếp nhăn mũi má (0-100)
        },
        skinBlemishes: Number, // Mụn, vết thâm (0-100)
        skinRedness: Number, // Độ đỏ da (0-100)
        skinOiliness: Number, // Độ dầu da (0-100)
        skinDryness: Number, // Độ khô da (0-100)
      },

      // Đặc trưng hành vi và biểu cảm (4 thông số)
      behavioralFeatures: {
        smileLine: Number, // Đường cười (0-100)
        frownLine: Number, // Đường cau mày (0-100)
        eyeWrinkles: Number, // Nếp nhăn đuôi mắt (0-100)
        foreheadWrinkles: Number, // Nếp nhăn trán (0-100)
      },
    },

    // Thông số kỹ thuật
    technicalSpecs: {
      // Độ tin cậy của dữ liệu
      confidence: {
        type: Number,
        required: [true, "Confidence là bắt buộc"],
        min: [0, "Confidence không được âm"],
        max: [100, "Confidence không được vượt quá 100"],
      },

      // Chất lượng hình ảnh
      imageQuality: {
        type: Number,
        min: [0, "Image quality không được âm"],
        max: [100, "Image quality không được vượt quá 100"],
      },

      // Điều kiện ánh sáng
      lighting: {
        type: String,
        enum: {
          values: ["poor", "fair", "good", "excellent"],
          message: "Lighting condition không hợp lệ",
        },
      },

      // Góc chụp
      angle: {
        pitch: Number, // Góc dọc (-90 đến 90)
        yaw: Number, // Góc ngang (-90 đến 90)
        roll: Number, // Góc lăn (-180 đến 180)
      },

      // Độ sắc nét
      sharpness: {
        type: Number,
        min: [0, "Sharpness không được âm"],
        max: [100, "Sharpness không được vượt quá 100"],
      },
    },

    // Thông tin bảo mật
    securityInfo: {
      // Cấp độ bảo mật
      securityLevel: {
        type: String,
        enum: {
          values: ["low", "medium", "high", "critical"],
          message: "Security level không hợp lệ",
        },
        default: "high",
      },

      // Trạng thái mã hóa
      isEncrypted: {
        type: Boolean,
        default: true,
      },

      // Thời gian hết hạn
      expiresAt: {
        type: Date,
      },

      // Số lần sử dụng tối đa
      maxUsage: {
        type: Number,
        min: [1, "Max usage phải lớn hơn 0"],
        default: 1000,
      },

      // Số lần đã sử dụng
      usageCount: {
        type: Number,
        default: 0,
        min: [0, "Usage count không được âm"],
      },
    },

    // Thông tin phiên bản và cập nhật
    versionInfo: {
      // Phiên bản dữ liệu
      dataVersion: {
        type: String,
        default: "1.0",
      },

      // Ngày cập nhật cuối
      lastUpdated: {
        type: Date,
        default: Date.now,
      },

      // Người cập nhật cuối
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },

      // Lý do cập nhật
      updateReason: {
        type: String,
        trim: true,
        maxlength: [500, "Update reason không được vượt quá 500 ký tự"],
      },
    },

    // Thông tin liên kết
    linkedData: {
      // ID vị trí liên quan
      locationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LocationsClient",
      },

      // Session ID khi tạo
      sessionId: {
        type: String,
        required: [true, "Session ID là bắt buộc"],
      },

      // Device info khi tạo
      deviceInfo: {
        userAgent: String,
        ip: String,
        platform: String,
      },
    },

    // Thông tin xác thực
    verificationInfo: {
      // Đã xác minh chưa
      isVerified: {
        type: Boolean,
        default: false,
      },

      // Người xác minh
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },

      // Thời gian xác minh
      verifiedAt: {
        type: Date,
      },

      // Phương thức xác minh
      verificationMethod: {
        type: String,
        enum: {
          values: ["manual", "automatic", "biometric", "admin"],
          message: "Verification method không hợp lệ",
        },
      },

      // Độ tin cậy xác minh
      verificationConfidence: {
        type: Number,
        min: [0, "Verification confidence không được âm"],
        max: [100, "Verification confidence không được vượt quá 100"],
      },
    },

    // Thông tin thống kê
    stats: {
      // Số lần sử dụng thành công
      successfulMatches: {
        type: Number,
        default: 0,
        min: [0, "Successful matches không được âm"],
      },

      // Số lần sử dụng thất bại
      failedMatches: {
        type: Number,
        default: 0,
        min: [0, "Failed matches không được âm"],
      },

      // Độ chính xác trung bình
      averageAccuracy: {
        type: Number,
        min: [0, "Average accuracy không được âm"],
        max: [100, "Average accuracy không được vượt quá 100"],
      },

      // Thời gian xử lý trung bình (ms)
      averageProcessingTime: {
        type: Number,
        min: [0, "Average processing time không được âm"],
      },
    },

    // Thông tin nâng cao (tùy chọn)
    advancedFeatures: {
      // Đặc trưng 3D (nếu có)
      depthMap: [Number],

      // Đặc trưng nhiệt (nếu có)
      thermalData: [Number],

      // Đặc trưng chuyển động
      motionVectors: [Number],

      // Đặc trưng giọng nói (nếu liên kết)
      voiceSignature: [Number],

      // Đặc trưng hành vi
      behavioralPattern: [Number],
    },

    // Thông tin bổ sung
    additionalData: {
      // Ghi chú
      notes: {
        type: String,
        trim: true,
        maxlength: [1000, "Notes không được vượt quá 1000 ký tự"],
      },

      // Tags để phân loại
      tags: [String],

      // Metadata tùy chỉnh
      customFields: mongoose.Schema.Types.Mixed,
    },

    // Trạng thái hoạt động
    isActive: {
      type: Boolean,
      default: true,
    },

    // Thời gian hết hạn
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
        // Ẩn các field nhạy cảm
        delete ret.faceEncoding;
        delete ret.advancedFeatures;
        delete ret.__v;
        return ret;
      },
    },

    // Tùy chọn cho Object output
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.faceEncoding;
        delete ret.advancedFeatures;
        delete ret.__v;
        return ret;
      },
    },
  }
);

/**
 * Virtual field: Tính độ chính xác tổng thể
 */
encodeFacedIDSchema.virtual("overallAccuracy").get(function () {
  if (!this.stats.averageAccuracy) return 0;
  return this.stats.averageAccuracy;
});

/**
 * Virtual field: Tính tỷ lệ thành công
 */
encodeFacedIDSchema.virtual("successRate").get(function () {
  const total = this.stats.successfulMatches + this.stats.failedMatches;
  if (total === 0) return 0;
  return (this.stats.successfulMatches / total) * 100;
});

/**
 * Virtual field: Kiểm tra còn hạn sử dụng không
 */
encodeFacedIDSchema.virtual("isValid").get(function () {
  if (!this.isActive) return false;
  if (this.expiresAt && this.expiresAt < new Date()) return false;
  if (
    this.securityInfo.maxUsage &&
    this.securityInfo.usageCount >= this.securityInfo.maxUsage
  )
    return false;
  return true;
});

/**
 * Virtual field: Cấp độ bảo mật mô tả
 */
encodeFacedIDSchema.virtual("securityLevelDescription").get(function () {
  const levels = {
    low: "Bảo mật cơ bản",
    medium: "Bảo mật trung bình",
    high: "Bảo mật cao",
    critical: "Bảo mật nghiêm ngặt",
  };
  return levels[this.securityInfo.securityLevel] || "Không xác định";
});

/**
 * Virtual field: Thời gian còn lại trước khi hết hạn
 */
encodeFacedIDSchema.virtual("timeUntilExpiry").get(function () {
  if (!this.expiresAt) return null;
  const now = new Date();
  const expiry = new Date(this.expiresAt);
  if (expiry <= now) return 0;
  return Math.floor((expiry - now) / (1000 * 60 * 60 * 24)); // Trả về số ngày
});

/**
 * Index để tối ưu hiệu suất
 */
encodeFacedIDSchema.index({ faceId: 1 }); // Index cho face ID (unique)
encodeFacedIDSchema.index({ userId: 1 }); // Index cho user
encodeFacedIDSchema.index({ "technicalSpecs.confidence": -1 }); // Index cho confidence
encodeFacedIDSchema.index({ "securityInfo.securityLevel": 1 }); // Index cho security level
encodeFacedIDSchema.index({ isActive: 1, expiresAt: 1 }); // Index cho trạng thái hoạt động
encodeFacedIDSchema.index({ createdAt: -1 }); // Index cho thời gian tạo
encodeFacedIDSchema.index({ "verificationInfo.isVerified": 1 }); // Index cho trạng thái xác minh

/**
 * Static method: Tìm theo face ID
 */
encodeFacedIDSchema.statics.findByFaceId = function (faceId) {
  return this.findOne({ faceId: faceId });
};

/**
 * Static method: Tìm theo user ID
 */
encodeFacedIDSchema.statics.findByUserId = function (userId) {
  return this.find({ userId: userId, isActive: true }).sort({ createdAt: -1 });
};

/**
 * Static method: Tìm khuôn mặt có độ tin cậy cao nhất
 */
encodeFacedIDSchema.statics.findHighConfidenceFaces = function (
  minConfidence = 80
) {
  return this.find({
    "technicalSpecs.confidence": { $gte: minConfidence },
    isActive: true,
  }).sort({ "technicalSpecs.confidence": -1 });
};

/**
 * Static method: Tìm khuôn mặt đã hết hạn
 */
encodeFacedIDSchema.statics.findExpiredFaces = function () {
  return this.find({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { "securityInfo.usageCount": { $gte: "$securityInfo.maxUsage" } },
    ],
    isActive: true,
  });
};

/**
 * Static method: Thống kê theo cấp độ bảo mật
 */
encodeFacedIDSchema.statics.getStatsBySecurityLevel = async function () {
  const stats = await this.aggregate([
    {
      $match: { isActive: true },
    },
    {
      $group: {
        _id: "$securityInfo.securityLevel",
        count: { $sum: 1 },
        avgConfidence: { $avg: "$technicalSpecs.confidence" },
        totalUsage: { $sum: "$securityInfo.usageCount" },
      },
    },
    {
      $project: {
        securityLevel: "$_id",
        count: 1,
        avgConfidence: { $round: ["$avgConfidence", 2] },
        totalUsage: 1,
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);

  return stats;
};

/**
 * Static method: Lấy khuôn mặt mới nhất của user
 */
encodeFacedIDSchema.statics.getLatestFaceByUser = function (userId) {
  return this.findOne({
    userId: userId,
    isActive: true,
  }).sort({ createdAt: -1 });
};

/**
 * Instance method: Cập nhật số lần sử dụng
 */
encodeFacedIDSchema.methods.incrementUsage = function () {
  this.securityInfo.usageCount += 1;
  this.stats.successfulMatches += 1;
  return this.save();
};

/**
 * Instance method: Đánh dấu là đã xác minh
 */
encodeFacedIDSchema.methods.markAsVerified = function (
  verifiedBy,
  method = "admin"
) {
  this.verificationInfo.isVerified = true;
  this.verificationInfo.verifiedBy = verifiedBy;
  this.verificationInfo.verifiedAt = new Date();
  this.verificationInfo.verificationMethod = method;
  return this.save();
};

/**
 * Instance method: Cập nhật độ tin cậy
 */
encodeFacedIDSchema.methods.updateConfidence = function (newConfidence) {
  this.technicalSpecs.confidence = newConfidence;

  // Cập nhật average accuracy nếu có dữ liệu thống kê
  if (this.stats.successfulMatches > 0) {
    const total = this.stats.successfulMatches + this.stats.failedMatches;
    this.stats.averageAccuracy = (this.stats.successfulMatches / total) * 100;
  }

  return this.save();
};

/**
 * Instance method: Kiểm tra có thể sử dụng không
 */
encodeFacedIDSchema.methods.canUse = function () {
  if (!this.isActive) return false;
  if (this.expiresAt && this.expiresAt < new Date()) return false;
  if (
    this.securityInfo.maxUsage &&
    this.securityInfo.usageCount >= this.securityInfo.maxUsage
  )
    return false;
  return true;
};

/**
 * Instance method: Tính khoảng cách Euclidean với encoding khác
 */
encodeFacedIDSchema.methods.calculateDistance = function (otherEncoding) {
  if (
    !otherEncoding ||
    !Array.isArray(otherEncoding) ||
    otherEncoding.length !== 128
  ) {
    throw new Error("Invalid encoding for distance calculation");
  }

  let sum = 0;
  for (let i = 0; i < 128; i++) {
    const diff = this.faceEncoding.primary[i] - otherEncoding[i];
    sum += diff * diff;
  }

  return Math.sqrt(sum);
};

/**
 * Instance method: So sánh với encoding khác
 */
encodeFacedIDSchema.methods.compareWith = function (
  otherEncoding,
  threshold = 0.6
) {
  const distance = this.calculateDistance(otherEncoding);
  return {
    distance: distance,
    isMatch: distance < threshold,
    confidence: Math.max(0, 100 - distance * 100),
  };
};

/**
 * Instance method: Đánh dấu là không hoạt động
 */
encodeFacedIDSchema.methods.deactivate = function () {
  this.isActive = false;
  return this.save();
};

/**
 * Instance method: Cập nhật thông tin bảo mật
 */
encodeFacedIDSchema.methods.updateSecurityLevel = function (newLevel) {
  this.securityInfo.securityLevel = newLevel;
  this.securityInfo.lastUpdated = new Date();
  return this.save();
};

/**
 * Pre-save middleware: Validate face encoding
 */
encodeFacedIDSchema.pre("save", function (next) {
  // Validate primary encoding
  if (!this.faceEncoding.primary || this.faceEncoding.primary.length !== 128) {
    return next(new Error("Primary face encoding phải có đúng 128 giá trị"));
  }

  // Validate tất cả giá trị là số hợp lệ
  for (let i = 0; i < 128; i++) {
    if (
      typeof this.faceEncoding.primary[i] !== "number" ||
      isNaN(this.faceEncoding.primary[i])
    ) {
      return next(new Error(`Invalid value at position ${i} in face encoding`));
    }
  }

  // Validate confidence
  if (
    this.technicalSpecs.confidence < 0 ||
    this.technicalSpecs.confidence > 100
  ) {
    return next(new Error("Confidence phải từ 0 đến 100"));
  }

  // Set default expiry nếu chưa có (1 năm)
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  }

  next();
});

/**
 * Pre-update middleware: Validate updates
 */
encodeFacedIDSchema.pre(["updateOne", "findOneAndUpdate"], function (next) {
  const update = this.getUpdate();

  // Validate face encoding nếu được cập nhật
  if (update.faceEncoding && update.faceEncoding.primary) {
    if (update.faceEncoding.primary.length !== 128) {
      return next(new Error("Face encoding phải có đúng 128 giá trị"));
    }

    for (let i = 0; i < 128; i++) {
      if (
        typeof update.faceEncoding.primary[i] !== "number" ||
        isNaN(update.faceEncoding.primary[i])
      ) {
        return next(
          new Error(`Invalid value at position ${i} in face encoding`)
        );
      }
    }
  }

  // Validate confidence nếu được cập nhật
  if (update.technicalSpecs && update.technicalSpecs.confidence !== undefined) {
    if (
      update.technicalSpecs.confidence < 0 ||
      update.technicalSpecs.confidence > 100
    ) {
      return next(new Error("Confidence phải từ 0 đến 100"));
    }
  }

  next();
});

/**
 * Export model EncodeFacedID
 */
module.exports = mongoose.model("EncodeFacedID", encodeFacedIDSchema);
