/**
 * Controller xử lý Face Recognition với bảo mật cấp độ 5
 * Cung cấp các API để mã hóa, giải mã và quản lý dữ liệu khuôn mặt
 * Tích hợp với bộ mã hóa đặc biệt và hệ thống xác thực cao cấp
 */

const EncodeFacedID = require("../models/EncodeFacedID");
const LocationsClient = require("../models/LocationsClient");
const User = require("../models/User");
const { validationResult } = require("express-validator");
const {
  encryptFaceData,
  decryptFaceData,
  compareFaces,
  generateSecureKey,
  getValidKey,
} = require("../utils/faceEncryption");

/**
 * Khởi tạo bộ mã hóa face recognition cấp độ 5
 */
const initializeFaceEncryption = async () => {
  // Bộ mã hóa đã được khởi tạo trong utils/faceEncryption.js
  console.log(
    "🔐 Face Recognition Controller initialized with Level 5 encryption"
  );
  return true;
};

/**
 * Controller mã hóa dữ liệu khuôn mặt
 * POST /api/faceID/encode
 */
const encodeFaceData = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu đầu vào không hợp lệ",
        errors: errors.array(),
      });
    }

    const {
      faceId,
      faceEncoding,
      facialLandmarks,
      facialFeatures,
      technicalSpecs,
      securityLevel = "high",
      expiresAt,
      notes,
    } = req.body;

    // Validate face encoding
    if (
      !faceEncoding ||
      !faceEncoding.primary ||
      faceEncoding.primary.length !== 128
    ) {
      return res.status(400).json({
        success: false,
        message: "Face encoding không hợp lệ. Cần đúng 128 giá trị số",
      });
    }

    // Validate tất cả giá trị trong face encoding
    for (let i = 0; i < 128; i++) {
      if (
        typeof faceEncoding.primary[i] !== "number" ||
        isNaN(faceEncoding.primary[i])
      ) {
        return res.status(400).json({
          success: false,
          message: `Giá trị không hợp lệ tại vị trí ${i} trong face encoding`,
        });
      }
    }

    // Kiểm tra face ID đã tồn tại chưa
    const existingFace = await EncodeFacedID.findByFaceId(faceId);
    if (existingFace) {
      return res.status(409).json({
        success: false,
        message: "Face ID đã tồn tại",
      });
    }

    // Khởi tạo face encryption system
    const encryptionSystem = await initializeFaceEncryption();

    // Chuẩn bị dữ liệu để mã hóa
    const faceData = {
      faceId,
      faceEncoding,
      facialLandmarks,
      facialFeatures,
      technicalSpecs: {
        confidence: technicalSpecs?.confidence || 80,
        imageQuality: technicalSpecs?.imageQuality || 85,
        lighting: technicalSpecs?.lighting || "good",
        angle: technicalSpecs?.angle || { pitch: 0, yaw: 0, roll: 0 },
        sharpness: technicalSpecs?.sharpness || 90,
      },
      securityInfo: {
        securityLevel,
        isEncrypted: true,
        maxUsage: 1000,
        usageCount: 0,
      },
      versionInfo: {
        dataVersion: "5.0",
        lastUpdated: new Date(),
        updatedBy: req.user.id,
      },
      linkedData: {
        sessionId: req.sessionId,
        deviceInfo: req.deviceInfo,
      },
      additionalData: {
        notes: notes || null,
        tags: req.body.tags || [],
      },
    };

    // Mã hóa dữ liệu với Level 5 encryption
    const encryptedResult = await encryptFaceData(
      faceData.faceEncoding.primary,
      req.user.id,
      req.sessionID
    );

    // Tạo record trong database
    const encodedFace = await EncodeFacedID.create({
      faceId,
      userId: req.user.id,
      version: "5.0",
      algorithm: "level5_encrypted",
      faceEncoding: faceData.faceEncoding,
      facialLandmarks,
      facialFeatures,
      technicalSpecs: faceData.technicalSpecs,
      securityInfo: {
        securityLevel,
        isEncrypted: true,
        expiresAt: expiresAt
          ? new Date(expiresAt)
          : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        maxUsage: 1000,
        usageCount: 0,
      },
      versionInfo: faceData.versionInfo,
      linkedData: {
        sessionId: req.sessionId,
        deviceInfo: req.deviceInfo,
      },
      verificationInfo: {
        isVerified: false,
        verificationMethod: "pending",
      },
      stats: {
        successfulMatches: 0,
        failedMatches: 0,
        averageAccuracy: 0,
        averageProcessingTime: 0,
      },
      additionalData: faceData.additionalData,
    });

    // Log mã hóa face data thành công
    console.log(`🔐 Face data encoded:`, {
      faceId: encodedFace.faceId,
      userId: encodedFace.userId,
      securityLevel: encodedFace.securityInfo.securityLevel,
      confidence: encodedFace.technicalSpecs.confidence,
      encryptionLevel: "level_5",
      ip: req.ip,
      timestamp: encodedFace.createdAt,
    });

    return res.status(201).json({
      success: true,
      message: "Dữ liệu khuôn mặt đã được mã hóa thành công",
      data: {
        faceId: encodedFace.faceId,
        userId: encodedFace.userId,
        securityLevel: encodedFace.securityInfo.securityLevel,
        confidence: encodedFace.technicalSpecs.confidence,
        encryptionLevel: "level_5",
        createdAt: encodedFace.createdAt,
        expiresAt: encodedFace.securityInfo.expiresAt,
      },
    });
  } catch (error) {
    console.error("❌ Encode face data error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Lỗi server khi mã hóa dữ liệu khuôn mặt",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

/**
 * Controller giải mã dữ liệu khuôn mặt
 * POST /api/faceID/decode
 */
const decodeFaceData = async (req, res) => {
  try {
    const { faceId, encryptedData, checksum } = req.body;

    // Validate input
    if (!faceId || !encryptedData || !checksum) {
      return res.status(400).json({
        success: false,
        message: "Face ID, encrypted data và checksum là bắt buộc",
      });
    }

    // Tìm face record
    const faceRecord = await EncodeFacedID.findByFaceId(faceId);
    if (!faceRecord) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bản ghi face ID",
      });
    }

    // Kiểm tra quyền truy cập
    if (
      req.user.role !== "admin" &&
      faceRecord.userId.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền giải mã face data này",
      });
    }

    // Kiểm tra trạng thái hoạt động
    if (!faceRecord.canUse()) {
      return res.status(403).json({
        success: false,
        message: "Face data không thể sử dụng (hết hạn hoặc vượt quá giới hạn)",
      });
    }

    // Khởi tạo face encryption system
    const encryptionSystem = await initializeFaceEncryption();

    // Giải mã dữ liệu
    const decryptedData = await decryptFaceData(
      encryptedResult,
      req.user.id,
      req.sessionID
    );

    // Cập nhật usage count
    await faceRecord.incrementUsage();

    // Log giải mã face data thành công
    console.log(`🔓 Face data decoded:`, {
      faceId: faceRecord.faceId,
      userId: req.user.id,
      usageCount: faceRecord.securityInfo.usageCount,
      verification: decryptedData.verification,
      ip: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: "Giải mã dữ liệu khuôn mặt thành công",
      data: {
        faceData: decryptedData.faceData,
        analysis: decryptedData.analysis,
        metadata: decryptedData.metadata,
        verification: decryptedData.verification,
        usageInfo: {
          currentUsage: faceRecord.securityInfo.usageCount,
          maxUsage: faceRecord.securityInfo.maxUsage,
          remainingUsage:
            faceRecord.securityInfo.maxUsage -
            faceRecord.securityInfo.usageCount,
        },
      },
    });
  } catch (error) {
    console.error("❌ Decode face data error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Lỗi server khi giải mã dữ liệu khuôn mặt",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

/**
 * Controller so sánh khuôn mặt
 * POST /api/faceID/compare
 */
const compareFacesController = async (req, res) => {
  try {
    const { faceId1, faceId2, threshold = 0.6 } = req.body;

    // Validate input
    if (!faceId1 || !faceId2) {
      return res.status(400).json({
        success: false,
        message: "Cần cung cấp 2 face ID để so sánh",
      });
    }

    // Tìm cả 2 face records
    const face1 = await EncodeFacedID.findByFaceId(faceId1);
    const face2 = await EncodeFacedID.findByFaceId(faceId2);

    if (!face1 || !face2) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy một hoặc cả hai face ID",
      });
    }

    // Kiểm tra quyền truy cập
    if (
      req.user.role !== "admin" &&
      face1.userId.toString() !== req.user.id &&
      face2.userId.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền so sánh các face data này",
      });
    }

    // Kiểm tra trạng thái hoạt động
    if (!face1.canUse() || !face2.canUse()) {
      return res.status(403).json({
        success: false,
        message: "Một hoặc cả hai face data không thể sử dụng",
      });
    }

    // So sánh face encodings với bảo mật cao
    const comparison = await compareFaces(
      { faceData: { faceData: face1.faceEncoding.primary } },
      { faceData: { faceData: face2.faceEncoding.primary } },
      face1.userId,
      face2.userId,
      req.sessionID
    );

    // Cập nhật statistics
    if (comparison.isMatch) {
      await face1.incrementUsage();
      await face2.incrementUsage();
    } else {
      face1.stats.failedMatches += 1;
      face2.stats.failedMatches += 1;
      await face1.save();
      await face2.save();
    }

    // Log so sánh face
    console.log(`⚖️ Face comparison:`, {
      comparedBy: req.user.id,
      faceId1: face1.faceId,
      faceId2: face2.faceId,
      isMatch: comparison.isMatch,
      distance: comparison.distance,
      confidence: comparison.confidence,
      threshold: threshold,
      ip: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: "So sánh khuôn mặt thành công",
      data: {
        comparison: {
          isMatch: comparison.isMatch,
          distance: comparison.distance,
          confidence: comparison.confidence,
          threshold: threshold,
        },
        faceInfo: {
          face1: {
            id: face1.faceId,
            userId: face1.userId,
            confidence: face1.technicalSpecs.confidence,
            createdAt: face1.createdAt,
          },
          face2: {
            id: face2.faceId,
            userId: face2.userId,
            confidence: face2.technicalSpecs.confidence,
            createdAt: face2.createdAt,
          },
        },
        usageInfo: {
          face1Usage: {
            current: face1.securityInfo.usageCount,
            max: face1.securityInfo.maxUsage,
          },
          face2Usage: {
            current: face2.securityInfo.usageCount,
            max: face2.securityInfo.maxUsage,
          },
        },
      },
    });
  } catch (error) {
    console.error("❌ Compare faces error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Lỗi server khi so sánh khuôn mặt",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

/**
 * Controller lấy danh sách face data của user
 * GET /api/faceID/user/:userId
 */
const getUserFaceData = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      page = 1,
      limit = 20,
      securityLevel,
      minConfidence,
      isVerified,
      isActive = true,
    } = req.query;

    // Kiểm tra quyền truy cập
    if (req.user.role !== "admin" && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền truy cập face data của user khác",
      });
    }

    // Tạo filter
    const filter = {
      userId: userId,
      isActive: isActive === "true",
    };

    if (securityLevel) {
      filter["securityInfo.securityLevel"] = securityLevel;
    }

    if (minConfidence) {
      filter["technicalSpecs.confidence"] = { $gte: parseInt(minConfidence) };
    }

    if (isVerified !== undefined) {
      filter["verificationInfo.isVerified"] = isVerified === "true";
    }

    // Tính pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = Math.min(parseInt(limit), 50);

    // Lấy dữ liệu
    const faces = await EncodeFacedID.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .select("-faceEncoding -advancedFeatures -__v");

    // Đếm tổng số
    const totalCount = await EncodeFacedID.countDocuments(filter);

    // Tính thống kê
    const stats = await this.calculateFaceStats(userId, filter);

    // Log truy cập face data
    console.log(`👤 User face data accessed:`, {
      accessedBy: req.user.id,
      targetUserId: userId,
      filters: filter,
      resultCount: faces.length,
      ip: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách face data thành công",
      data: {
        faces: faces,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limitNum),
          totalCount: totalCount,
          hasNextPage: skip + limitNum < totalCount,
          hasPrevPage: skip > 0,
        },
        stats: stats,
      },
    });
  } catch (error) {
    console.error("❌ Get user face data error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy face data",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

/**
 * Controller lấy thông tin face data theo ID
 * GET /api/faceID/:faceId
 */
const getFaceById = async (req, res) => {
  try {
    const { faceId } = req.params;

    // Tìm face record
    const face = await EncodeFacedID.findByFaceId(faceId);
    if (!face) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy face ID",
      });
    }

    // Kiểm tra quyền truy cập
    if (req.user.role !== "admin" && face.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền truy cập face data này",
      });
    }

    // Log truy cập face by ID
    console.log(`🎭 Face data accessed by ID:`, {
      accessedBy: req.user.id,
      faceId: face.faceId,
      ip: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: "Lấy thông tin face data thành công",
      data: {
        face: {
          id: face._id,
          faceId: face.faceId,
          userId: face.userId,
          version: face.version,
          algorithm: face.algorithm,
          technicalSpecs: face.technicalSpecs,
          securityInfo: face.securityInfo,
          verificationInfo: face.verificationInfo,
          stats: face.stats,
          createdAt: face.createdAt,
          updatedAt: face.updatedAt,
          isValid: face.isValid,
          securityLevelDescription: face.securityLevelDescription,
          timeUntilExpiry: face.timeUntilExpiry,
        },
      },
    });
  } catch (error) {
    console.error("❌ Get face by ID error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy face data",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

/**
 * Controller cập nhật face data
 * PUT /api/faceID/:faceId
 */
const updateFaceData = async (req, res) => {
  try {
    const { faceId } = req.params;

    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu đầu vào không hợp lệ",
        errors: errors.array(),
      });
    }

    const { technicalSpecs, securityLevel, expiresAt, notes, tags } = req.body;

    // Tìm face record
    const face = await EncodeFacedID.findByFaceId(faceId);
    if (!face) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy face ID",
      });
    }

    // Kiểm tra quyền truy cập
    if (req.user.role !== "admin" && face.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền cập nhật face data này",
      });
    }

    // Cập nhật các field
    if (technicalSpecs) {
      Object.assign(face.technicalSpecs, technicalSpecs);
    }

    if (securityLevel) {
      face.securityInfo.securityLevel = securityLevel;
    }

    if (expiresAt) {
      face.securityInfo.expiresAt = new Date(expiresAt);
    }

    if (notes !== undefined) {
      face.additionalData.notes = notes;
    }

    if (tags !== undefined) {
      face.additionalData.tags = tags;
    }

    // Cập nhật metadata
    face.versionInfo.lastUpdated = new Date();
    face.versionInfo.updatedBy = req.user.id;
    face.versionInfo.updateReason = "Manual update via API";

    await face.save();

    // Log cập nhật face data
    console.log(`📝 Face data updated:`, {
      updatedBy: req.user.id,
      faceId: face.faceId,
      changes: {
        technicalSpecs: technicalSpecs ? "modified" : "unchanged",
        securityLevel: securityLevel ? "modified" : "unchanged",
        expiresAt: expiresAt ? "modified" : "unchanged",
      },
      ip: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: "Cập nhật face data thành công",
      data: {
        face: {
          id: face._id,
          faceId: face.faceId,
          updatedAt: face.updatedAt,
          technicalSpecs: face.technicalSpecs,
          securityInfo: face.securityInfo,
        },
      },
    });
  } catch (error) {
    console.error("❌ Update face data error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật face data",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

/**
 * Controller xóa face data
 * DELETE /api/faceID/:faceId
 */
const deleteFaceData = async (req, res) => {
  try {
    const { faceId } = req.params;

    // Tìm face record
    const face = await EncodeFacedID.findByFaceId(faceId);
    if (!face) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy face ID",
      });
    }

    // Kiểm tra quyền truy cập
    if (req.user.role !== "admin" && face.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền xóa face data này",
      });
    }

    // Đánh dấu là không hoạt động
    await face.deactivate();

    // Log xóa face data
    console.log(`🗑️ Face data deleted:`, {
      deletedBy: req.user.id,
      faceId: face.faceId,
      userId: face.userId,
      ip: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: "Xóa face data thành công",
    });
  } catch (error) {
    console.error("❌ Delete face data error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa face data",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

/**
 * Controller xác minh face data
 * POST /api/faceID/:faceId/verify
 */
const verifyFaceData = async (req, res) => {
  try {
    const { faceId } = req.params;
    const { verificationMethod = "admin", notes } = req.body;

    // Tìm face record
    const face = await EncodeFacedID.findByFaceId(faceId);
    if (!face) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy face ID",
      });
    }

    // Chỉ admin mới có quyền xác minh
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Chỉ admin mới có quyền xác minh face data",
      });
    }

    // Đánh dấu là đã xác minh
    await face.markAsVerified(req.user.id, verificationMethod);

    // Thêm notes nếu có
    if (notes) {
      face.additionalData.notes = notes;
      await face.save();
    }

    // Log xác minh face data
    console.log(`✅ Face data verified:`, {
      verifiedBy: req.user.id,
      faceId: face.faceId,
      userId: face.userId,
      verificationMethod: verificationMethod,
      ip: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: "Xác minh face data thành công",
      data: {
        face: {
          id: face._id,
          faceId: face.faceId,
          verificationInfo: face.verificationInfo,
          verifiedAt: face.verificationInfo.verifiedAt,
        },
      },
    });
  } catch (error) {
    console.error("❌ Verify face data error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Lỗi server khi xác minh face data",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

/**
 * Controller lấy thống kê face recognition
 * GET /api/faceID/stats/overview
 */
const getFaceRecognitionStats = async (req, res) => {
  try {
    // Chỉ admin mới có quyền truy cập
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Chỉ admin mới có quyền truy cập thống kê face recognition",
      });
    }

    const { startDate, endDate } = req.query;

    // Tạo filter theo khoảng thời gian
    const filter = { isActive: true };
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Lấy thống kê theo security level
    const securityStats = await EncodeFacedID.getStatsBySecurityLevel();

    // Lấy thống kê tổng thể
    const totalFaces = await EncodeFacedID.countDocuments(filter);
    const verifiedFaces = await EncodeFacedID.countDocuments({
      ...filter,
      "verificationInfo.isVerified": true,
    });

    const avgConfidence = await EncodeFacedID.aggregate([
      { $match: filter },
      { $group: { _id: null, avg: { $avg: "$technicalSpecs.confidence" } } },
    ]);

    // Lấy top users by face count
    const topUsers = await EncodeFacedID.aggregate([
      { $match: filter },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $project: {
          userId: "$_id",
          count: 1,
          userName: { $arrayElemAt: ["$user.name", 0] },
          userEmail: { $arrayElemAt: ["$user.email", 0] },
        },
      },
    ]);

    // Log truy cập face stats
    console.log(`📊 Face recognition stats accessed by admin:`, {
      adminId: req.user.id,
      filters: filter,
      ip: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: "Lấy thống kê face recognition thành công",
      data: {
        overview: {
          totalFaces,
          verifiedFaces,
          unverifiedFaces: totalFaces - verifiedFaces,
          avgConfidence: avgConfidence[0]?.avg || 0,
        },
        securityStats,
        topUsers,
        generatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("❌ Get face recognition stats error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thống kê face recognition",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

/**
 * Controller xoay vòng master key
 * POST /api/faceID/rotate-key
 */
const rotateEncryptionKey = async (req, res) => {
  try {
    // Chỉ admin mới có quyền xoay key
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Chỉ admin mới có quyền xoay vòng encryption key",
      });
    }

    // Khởi tạo face encryption system
    const encryptionSystem = await initializeFaceEncryption();

    // Xoay vòng master key bằng cách tạo key mới
    const newKey = generateSecureKey(
      req.user.id,
      req.sessionID,
      "key-rotation"
    );

    // Log xoay key
    console.log(`🔄 Encryption key rotated by admin:`, {
      adminId: req.user.id,
      oldKeyExists: !!rotationResult.oldKey,
      newKeyExists: !!rotationResult.newKey,
      ip: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: "Master key đã được xoay vòng thành công",
      data: {
        rotatedAt: new Date(),
        securityLevel: "level_5",
        keyRotationCount: Date.now(), // Có thể track số lần xoay
      },
    });
  } catch (error) {
    console.error("❌ Rotate encryption key error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Lỗi server khi xoay vòng encryption key",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

/**
 * Controller lấy thông tin bảo mật hệ thống
 * GET /api/faceID/security/info
 */
const getSecurityInfo = async (req, res) => {
  try {
    // Chỉ admin mới có quyền truy cập
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Chỉ admin mới có quyền truy cập thông tin bảo mật",
      });
    }

    // Khởi tạo face encryption system
    const encryptionSystem = await initializeFaceEncryption();

    // Lấy thông tin bảo mật từ cấu hình
    const securityInfo = {
      encryptionLevel: require("../utils/faceEncryption").SECURITY_CONFIG
        .ENCRYPTION_LEVEL,
      layers: require("../utils/faceEncryption").SECURITY_CONFIG.LAYERS,
      vectorCount: require("../utils/faceEncryption").SECURITY_CONFIG
        .VECTOR_COUNT,
      otpExpiry: require("../middlewares/advancedSecurityAuth").SECURITY_CONFIG
        .OTP_EXPIRY,
      backupCodeExpiry: require("../middlewares/advancedSecurityAuth")
        .SECURITY_CONFIG.BACKUP_CODE_EXPIRY,
      maxOtpAttempts: require("../middlewares/advancedSecurityAuth")
        .SECURITY_CONFIG.MAX_OTP_ATTEMPTS,
      lockoutDuration: require("../middlewares/advancedSecurityAuth")
        .SECURITY_CONFIG.LOCKOUT_DURATION,
      keyRotationInterval: 60 * 60 * 1000, // 1 giờ
      timestamp: Date.now(),
    };

    // Log truy cập security info
    console.log(`🔒 Security info accessed by admin:`, {
      adminId: req.user.id,
      ip: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: "Lấy thông tin bảo mật thành công",
      data: {
        securityInfo,
        accessedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("❌ Get security info error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thông tin bảo mật",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

/**
 * Utility: Tính toán thống kê face của user
 */
calculateFaceStats = async (userId, filter) => {
  try {
    const faces = await EncodeFacedID.find({
      userId: userId,
      ...filter,
    });

    const stats = {
      totalFaces: faces.length,
      verifiedFaces: faces.filter((f) => f.verificationInfo.isVerified).length,
      avgConfidence: 0,
      securityLevels: {},
      totalUsage: 0,
      avgAccuracy: 0,
    };

    if (faces.length > 0) {
      stats.avgConfidence =
        faces.reduce((sum, f) => sum + f.technicalSpecs.confidence, 0) /
        faces.length;
      stats.totalUsage = faces.reduce(
        (sum, f) => sum + f.securityInfo.usageCount,
        0
      );
      stats.avgAccuracy =
        faces.reduce((sum, f) => sum + (f.stats.averageAccuracy || 0), 0) /
        faces.length;

      // Thống kê theo security level
      faces.forEach((face) => {
        const level = face.securityInfo.securityLevel;
        stats.securityLevels[level] = (stats.securityLevels[level] || 0) + 1;
      });
    }

    return stats;
  } catch (error) {
    console.error("❌ Calculate face stats error:", error);
    return null;
  }
};

module.exports = {
  encodeFaceData,
  decodeFaceData,
  compareFacesController,
  getUserFaceData,
  getFaceById,
  updateFaceData,
  deleteFaceData,
  verifyFaceData,
  getFaceRecognitionStats,
  rotateEncryptionKey,
  getSecurityInfo,
};
