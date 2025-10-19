/**
 * Controller xử lý Location và GPS tracking
 * Cung cấp các API để lấy vị trí, lưu trữ và quản lý dữ liệu vị trí
 * Bảo mật cao với nhiều lớp xác thực
 */

const LocationsClient = require("../models/LocationsClient");
const User = require("../models/User");
const { validationResult } = require("express-validator");

/**
 * Controller lấy vị trí hiện tại của client
 * POST /api/location/current
 */
const getCurrentLocation = async (req, res) => {
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
      latitude,
      longitude,
      accuracy,
      country,
      city,
      region,
      deviceInfo,
      networkInfo,
      accessInfo,
      securityInfo,
      metadata,
    } = req.body;

    // Validate GPS coordinates
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Tọa độ GPS là bắt buộc",
      });
    }

    // Validate tọa độ hợp lệ
    if (
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return res.status(400).json({
        success: false,
        message: "Tọa độ GPS không hợp lệ",
      });
    }

    // Lấy thông tin từ request headers và middleware
    const clientIP =
      req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    const userAgent = req.get("User-Agent");
    const referrer = req.get("Referer");

    // Chuẩn bị dữ liệu location
    const locationData = {
      ip: clientIP,
      realIp: req.realIp || clientIP,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      accuracy: accuracy ? parseFloat(accuracy) : null,
      country: country || req.country || null,
      city: city || req.city || null,
      region: region || req.region || null,
      deviceInfo: {
        userAgent: userAgent,
        platform: deviceInfo?.platform || this.detectPlatform(userAgent),
        browser: deviceInfo?.browser || this.detectBrowser(userAgent),
        browserVersion:
          deviceInfo?.browserVersion || this.detectBrowserVersion(userAgent),
        os: deviceInfo?.os || this.detectOS(userAgent),
        screenResolution: deviceInfo?.screenResolution || null,
        timezone:
          deviceInfo?.timezone ||
          Intl.DateTimeFormat().resolvedOptions().timeZone,
        language:
          deviceInfo?.language ||
          req.get("Accept-Language")?.split(",")[0] ||
          "en-US",
      },
      networkInfo: {
        isp: networkInfo?.isp || req.isp || null,
        organization: networkInfo?.organization || req.organization || null,
        asn: networkInfo?.asn || req.asn || null,
      },
      accessInfo: {
        url: accessInfo?.url || req.originalUrl,
        referrer: referrer,
        userId: req.user?.id,
        sessionId: req.sessionId || this.generateSessionId(),
        endpoint: req.route?.path || req.path,
        method: req.method,
      },
      securityInfo: {
        isVpn: securityInfo?.isVpn || req.isVpn || false,
        isProxy: securityInfo?.isProxy || req.isProxy || false,
        isTor: securityInfo?.isTor || req.isTor || false,
        isDatacenter: securityInfo?.isDatacenter || req.isDatacenter || false,
        riskScore: securityInfo?.riskScore || req.riskScore || 0,
      },
      metadata: {
        source: metadata?.source || "browser",
        confidence: metadata?.confidence || 50,
        notes: metadata?.notes || null,
      },
    };

    // Tạo location record mới
    const location = await LocationsClient.create(locationData);

    // Log thông tin location thành công
    console.log(`📍 Location recorded:`, {
      locationId: location._id,
      userId: location.accessInfo.userId,
      ip: location.ip,
      country: location.country,
      city: location.city,
      coordinates: `${location.latitude}, ${location.longitude}`,
      riskScore: location.securityInfo.riskScore,
      timestamp: location.createdAt,
    });

    // Trả về thông tin location (ẩn thông tin nhạy cảm)
    const locationResponse = {
      id: location._id,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      country: location.country,
      city: location.city,
      region: location.region,
      fullAddress: location.fullAddress,
      isSuspicious: location.isSuspicious,
      riskScore: location.securityInfo.riskScore,
      createdAt: location.createdAt,
      metadata: {
        source: location.metadata.source,
        confidence: location.metadata.confidence,
      },
    };

    return res.status(201).json({
      success: true,
      message: "Vị trí đã được ghi nhận thành công",
      data: {
        location: locationResponse,
      },
    });
  } catch (error) {
    console.error("❌ Get current location error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy vị trí",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

/**
 * Controller lấy lịch sử vị trí của user
 * GET /api/location/history/:userId
 */
const getLocationHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      page = 1,
      limit = 50,
      startDate,
      endDate,
      country,
      city,
      minRiskScore,
      maxRiskScore,
    } = req.query;

    // Kiểm tra quyền truy cập
    if (req.user.role !== "admin" && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền truy cập lịch sử vị trí của user khác",
      });
    }

    // Tạo query filter
    const filter = {
      "accessInfo.userId": userId,
      isActive: true,
    };

    // Thêm filter theo khoảng thời gian
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Thêm filter theo location
    if (country) filter.country = country;
    if (city) filter.city = city;

    // Thêm filter theo risk score
    if (minRiskScore || maxRiskScore) {
      filter["securityInfo.riskScore"] = {};
      if (minRiskScore)
        filter["securityInfo.riskScore"].$gte = parseInt(minRiskScore);
      if (maxRiskScore)
        filter["securityInfo.riskScore"].$lte = parseInt(maxRiskScore);
    }

    // Tính pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = Math.min(parseInt(limit), 100); // Giới hạn tối đa 100 records

    // Lấy dữ liệu với pagination
    const locations = await LocationsClient.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .select("-__v");

    // Đếm tổng số records
    const totalCount = await LocationsClient.countDocuments(filter);

    // Tính thống kê
    const stats = await this.calculateLocationStats(userId, filter);

    // Log truy cập lịch sử location
    console.log(`📊 Location history accessed:`, {
      accessedBy: req.user.id,
      targetUserId: userId,
      filters: filter,
      resultCount: locations.length,
      ip: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: "Lấy lịch sử vị trí thành công",
      data: {
        locations: locations,
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
    console.error("❌ Get location history error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy lịch sử vị trí",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

/**
 * Controller lấy thống kê vị trí theo quốc gia
 * GET /api/location/stats/countries
 */
const getLocationStatsByCountry = async (req, res) => {
  try {
    // Chỉ admin mới có quyền truy cập
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Chỉ admin mới có quyền truy cập thống kê vị trí",
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

    // Lấy thống kê theo quốc gia
    const stats = await LocationsClient.getStatsByCountry();

    // Lấy thêm thống kê tổng thể
    const totalStats = await this.calculateOverallStats(filter);

    // Log truy cập thống kê
    console.log(`📈 Location stats accessed by admin:`, {
      adminId: req.user.id,
      filters: filter,
      resultCount: stats.length,
      ip: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: "Lấy thống kê vị trí theo quốc gia thành công",
      data: {
        countryStats: stats,
        overallStats: totalStats,
        filters: filter,
        generatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("❌ Get location stats error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thống kê vị trí",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

/**
 * Controller lấy vị trí đáng ngờ
 * GET /api/location/suspicious
 */
const getSuspiciousLocations = async (req, res) => {
  try {
    // Chỉ admin mới có quyền truy cập
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Chỉ admin mới có quyền truy cập vị trí đáng ngờ",
      });
    }

    const { limit = 50, minRiskScore = 70 } = req.query;

    // Lấy vị trí đáng ngờ
    const suspiciousLocations = await LocationsClient.getSuspiciousLocations(
      parseInt(limit)
    );

    // Nhóm theo loại nghi ngờ
    const groupedByRisk = this.groupLocationsByRisk(suspiciousLocations);

    // Log truy cập suspicious locations
    console.log(`🚨 Suspicious locations accessed by admin:`, {
      adminId: req.user.id,
      count: suspiciousLocations.length,
      minRiskScore: minRiskScore,
      ip: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách vị trí đáng ngờ thành công",
      data: {
        suspiciousLocations: suspiciousLocations,
        groupedByRisk: groupedByRisk,
        totalCount: suspiciousLocations.length,
        filters: {
          minRiskScore: parseInt(minRiskScore),
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("❌ Get suspicious locations error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy vị trí đáng ngờ",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

/**
 * Controller cập nhật vị trí hiện tại
 * PUT /api/location/:locationId
 */
const updateLocation = async (req, res) => {
  try {
    const { locationId } = req.params;

    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu đầu vào không hợp lệ",
        errors: errors.array(),
      });
    }

    const { latitude, longitude, accuracy, notes } = req.body;

    // Tìm location record
    const location = await LocationsClient.findById(locationId);
    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bản ghi vị trí",
      });
    }

    // Kiểm tra quyền truy cập
    if (
      req.user.role !== "admin" &&
      location.accessInfo.userId.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền cập nhật vị trí này",
      });
    }

    // Cập nhật vị trí
    if (latitude !== undefined && longitude !== undefined) {
      location.latitude = parseFloat(latitude);
      location.longitude = parseFloat(longitude);
    }

    if (accuracy !== undefined) {
      location.accuracy = parseFloat(accuracy);
    }

    if (notes !== undefined) {
      location.metadata.notes = notes;
    }

    await location.save();

    // Log cập nhật location
    console.log(`📝 Location updated:`, {
      locationId: location._id,
      updatedBy: req.user.id,
      oldCoordinates: `${location.latitude}, ${location.longitude}`,
      newCoordinates: `${latitude}, ${longitude}`,
      ip: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: "Cập nhật vị trí thành công",
      data: {
        location: {
          id: location._id,
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          updatedAt: location.updatedAt,
          metadata: location.metadata,
        },
      },
    });
  } catch (error) {
    console.error("❌ Update location error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật vị trí",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

/**
 * Controller xóa vị trí
 * DELETE /api/location/:locationId
 */
const deleteLocation = async (req, res) => {
  try {
    const { locationId } = req.params;

    // Tìm location record
    const location = await LocationsClient.findById(locationId);
    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bản ghi vị trí",
      });
    }

    // Kiểm tra quyền truy cập
    if (
      req.user.role !== "admin" &&
      location.accessInfo.userId.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền xóa vị trí này",
      });
    }

    // Đánh dấu là không hoạt động thay vì xóa hoàn toàn
    await location.deactivate();

    // Log xóa location
    console.log(`🗑️ Location deleted:`, {
      locationId: location._id,
      deletedBy: req.user.id,
      userId: location.accessInfo.userId,
      coordinates: `${location.latitude}, ${location.longitude}`,
      ip: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: "Xóa vị trí thành công",
    });
  } catch (error) {
    console.error("❌ Delete location error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa vị trí",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

/**
 * Controller lấy vị trí gần đây nhất của user
 * GET /api/location/latest/:userId
 */
const getLatestLocation = async (req, res) => {
  try {
    const { userId } = req.params;

    // Kiểm tra quyền truy cập
    if (req.user.role !== "admin" && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền truy cập vị trí của user khác",
      });
    }

    // Lấy vị trí gần đây nhất
    const latestLocation = await LocationsClient.getLatestLocation(userId);

    if (!latestLocation) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy vị trí nào của user này",
      });
    }

    // Log truy cập latest location
    console.log(`🎯 Latest location accessed:`, {
      accessedBy: req.user.id,
      targetUserId: userId,
      locationId: latestLocation._id,
      coordinates: `${latestLocation.latitude}, ${latestLocation.longitude}`,
      ip: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: "Lấy vị trí gần đây nhất thành công",
      data: {
        location: {
          id: latestLocation._id,
          latitude: latestLocation.latitude,
          longitude: latestLocation.longitude,
          accuracy: latestLocation.accuracy,
          country: latestLocation.country,
          city: latestLocation.city,
          region: latestLocation.region,
          fullAddress: latestLocation.fullAddress,
          isSuspicious: latestLocation.isSuspicious,
          riskScore: latestLocation.securityInfo.riskScore,
          createdAt: latestLocation.createdAt,
          metadata: latestLocation.metadata,
        },
      },
    });
  } catch (error) {
    console.error("❌ Get latest location error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy vị trí gần đây nhất",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

/**
 * Controller tìm kiếm vị trí theo khoảng cách
 * GET /api/location/nearby
 */
const findNearbyLocations = async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      radiusKm = 10,
      userId,
      startDate,
      endDate,
    } = req.query;

    // Validate input
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Tọa độ trung tâm là bắt buộc",
      });
    }

    const centerLat = parseFloat(latitude);
    const centerLng = parseFloat(longitude);
    const radius = parseFloat(radiusKm);

    // Validate tọa độ
    if (
      centerLat < -90 ||
      centerLat > 90 ||
      centerLng < -180 ||
      centerLng > 180
    ) {
      return res.status(400).json({
        success: false,
        message: "Tọa độ trung tâm không hợp lệ",
      });
    }

    // Tạo filter cơ bản
    const filter = { isActive: true };

    // Thêm filter theo user nếu có
    if (userId) {
      if (req.user.role !== "admin" && req.user.id !== userId) {
        return res.status(403).json({
          success: false,
          message: "Không có quyền truy cập vị trí của user khác",
        });
      }
      filter["accessInfo.userId"] = userId;
    }

    // Thêm filter theo khoảng thời gian
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Lấy tất cả locations phù hợp filter
    const allLocations = await LocationsClient.find(filter);

    // Lọc theo khoảng cách
    const nearbyLocations = allLocations.filter((location) => {
      const distance = location.distanceFrom(centerLat, centerLng);
      return distance && distance <= radius * 1000; // Convert km to meters
    });

    // Sắp xếp theo khoảng cách
    nearbyLocations.sort((a, b) => {
      const distanceA = a.distanceFrom(centerLat, centerLng);
      const distanceB = b.distanceFrom(centerLat, centerLng);
      return distanceA - distanceB;
    });

    // Log tìm kiếm nearby locations
    console.log(`🔍 Nearby locations searched:`, {
      searchedBy: req.user.id,
      centerCoordinates: `${centerLat}, ${centerLng}`,
      radiusKm: radius,
      userId: userId || "all",
      resultCount: nearbyLocations.length,
      ip: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: "Tìm kiếm vị trí lân cận thành công",
      data: {
        center: {
          latitude: centerLat,
          longitude: centerLng,
          radiusKm: radius,
        },
        nearbyLocations: nearbyLocations.map((location) => ({
          id: location._id,
          latitude: location.latitude,
          longitude: location.longitude,
          distance: location.distanceFrom(centerLat, centerLng),
          country: location.country,
          city: location.city,
          isSuspicious: location.isSuspicious,
          riskScore: location.securityInfo.riskScore,
          createdAt: location.createdAt,
        })),
        totalCount: nearbyLocations.length,
      },
    });
  } catch (error) {
    console.error("❌ Find nearby locations error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Lỗi server khi tìm kiếm vị trí lân cận",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

/**
 * Controller lấy thống kê tổng thể
 * GET /api/location/stats/overview
 */
const getLocationOverviewStats = async (req, res) => {
  try {
    // Chỉ admin mới có quyền truy cập
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Chỉ admin mới có quyền truy cập thống kê tổng thể",
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

    // Lấy thống kê tổng thể
    const overviewStats = await this.calculateOverviewStats(filter);

    // Lấy top countries
    const topCountries = await LocationsClient.getStatsByCountry();

    // Lấy suspicious locations
    const suspiciousCount = await LocationsClient.countDocuments({
      $or: [
        { "securityInfo.isVpn": true },
        { "securityInfo.isProxy": true },
        { "securityInfo.riskScore": { $gt: 70 } },
      ],
      isActive: true,
    });

    // Log truy cập overview stats
    console.log(`📊 Location overview stats accessed by admin:`, {
      adminId: req.user.id,
      filters: filter,
      ip: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: "Lấy thống kê tổng thể vị trí thành công",
      data: {
        overview: overviewStats,
        topCountries: topCountries.slice(0, 10), // Top 10 countries
        suspiciousCount: suspiciousCount,
        generatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("❌ Get location overview stats error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thống kê tổng thể",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

/**
 * Utility: Phát hiện platform từ user agent
 */
detectPlatform = (userAgent) => {
  if (!userAgent) return "Unknown";

  if (userAgent.includes("Windows")) return "Windows";
  if (userAgent.includes("Mac")) return "macOS";
  if (userAgent.includes("Linux")) return "Linux";
  if (userAgent.includes("Android")) return "Android";
  if (
    userAgent.includes("iOS") ||
    userAgent.includes("iPhone") ||
    userAgent.includes("iPad")
  )
    return "iOS";

  return "Unknown";
};

/**
 * Utility: Phát hiện browser từ user agent
 */
detectBrowser = (userAgent) => {
  if (!userAgent) return "Unknown";

  if (userAgent.includes("Chrome")) return "Chrome";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Safari")) return "Safari";
  if (userAgent.includes("Edge")) return "Edge";
  if (userAgent.includes("Opera")) return "Opera";

  return "Unknown";
};

/**
 * Utility: Phát hiện version browser từ user agent
 */
detectBrowserVersion = (userAgent) => {
  if (!userAgent) return "Unknown";

  const chromeMatch = userAgent.match(/Chrome\/(\d+)/);
  if (chromeMatch) return chromeMatch[1];

  const firefoxMatch = userAgent.match(/Firefox\/(\d+)/);
  if (firefoxMatch) return firefoxMatch[1];

  const safariMatch = userAgent.match(/Safari\/(\d+)/);
  if (safariMatch) return safariMatch[1];

  return "Unknown";
};

/**
 * Utility: Phát hiện OS từ user agent
 */
detectOS = (userAgent) => {
  if (!userAgent) return "Unknown";

  if (userAgent.includes("Windows NT")) return "Windows";
  if (userAgent.includes("Mac OS X")) return "macOS";
  if (userAgent.includes("Linux")) return "Linux";
  if (userAgent.includes("Android")) return "Android";
  if (
    userAgent.includes("iOS") ||
    userAgent.includes("iPhone") ||
    userAgent.includes("iPad")
  )
    return "iOS";

  return "Unknown";
};

/**
 * Utility: Tạo session ID
 */
generateSessionId = () => {
  return require("crypto").randomBytes(32).toString("hex");
};

/**
 * Utility: Tính toán thống kê location của user
 */
calculateLocationStats = async (userId, filter) => {
  try {
    const locations = await LocationsClient.find({
      "accessInfo.userId": userId,
      ...filter,
    });

    const stats = {
      totalLocations: locations.length,
      countries: [...new Set(locations.map((l) => l.country).filter(Boolean))],
      cities: [...new Set(locations.map((l) => l.city).filter(Boolean))],
      avgRiskScore: 0,
      suspiciousCount: 0,
      dateRange: {
        earliest: null,
        latest: null,
      },
    };

    if (locations.length > 0) {
      stats.avgRiskScore =
        locations.reduce((sum, l) => sum + l.securityInfo.riskScore, 0) /
        locations.length;
      stats.suspiciousCount = locations.filter((l) => l.isSuspicious).length;
      stats.dateRange.earliest = locations[locations.length - 1].createdAt;
      stats.dateRange.latest = locations[0].createdAt;
    }

    return stats;
  } catch (error) {
    console.error("❌ Calculate location stats error:", error);
    return null;
  }
};

/**
 * Utility: Tính toán thống kê tổng thể
 */
calculateOverallStats = async (filter) => {
  try {
    const totalLocations = await LocationsClient.countDocuments(filter);
    const uniqueUsers = await LocationsClient.distinct(
      "accessInfo.userId",
      filter
    );
    const uniqueCountries = await LocationsClient.distinct("country", filter);
    const avgRiskScore = await LocationsClient.aggregate([
      { $match: filter },
      { $group: { _id: null, avg: { $avg: "$securityInfo.riskScore" } } },
    ]);

    return {
      totalLocations,
      uniqueUsers: uniqueUsers.length,
      uniqueCountries: uniqueCountries.length,
      avgRiskScore: avgRiskScore[0]?.avg || 0,
    };
  } catch (error) {
    console.error("❌ Calculate overall stats error:", error);
    return null;
  }
};

/**
 * Utility: Nhóm locations theo mức độ rủi ro
 */
groupLocationsByRisk = (locations) => {
  const groups = {
    vpn: [],
    proxy: [],
    tor: [],
    highRisk: [],
    datacenter: [],
  };

  locations.forEach((location) => {
    if (location.securityInfo.isVpn) groups.vpn.push(location);
    if (location.securityInfo.isProxy) groups.proxy.push(location);
    if (location.securityInfo.isTor) groups.tor.push(location);
    if (location.securityInfo.isDatacenter) groups.datacenter.push(location);
    if (location.securityInfo.riskScore > 70) groups.highRisk.push(location);
  });

  return groups;
};

/**
 * Utility: Tính toán overview stats
 */
calculateOverviewStats = async (filter) => {
  try {
    const totalLocations = await LocationsClient.countDocuments(filter);
    const uniqueUsers = await LocationsClient.distinct(
      "accessInfo.userId",
      filter
    );
    const uniqueCountries = await LocationsClient.distinct("country", filter);

    const riskStats = await LocationsClient.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          avgRiskScore: { $avg: "$securityInfo.riskScore" },
          highRiskCount: {
            $sum: { $cond: [{ $gt: ["$securityInfo.riskScore", 70] }, 1, 0] },
          },
          suspiciousCount: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ["$securityInfo.isVpn", true] },
                    { $eq: ["$securityInfo.isProxy", true] },
                    { $eq: ["$securityInfo.isTor", true] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const stats = riskStats[0] || {
      avgRiskScore: 0,
      highRiskCount: 0,
      suspiciousCount: 0,
    };

    return {
      totalLocations,
      uniqueUsers: uniqueUsers.length,
      uniqueCountries: uniqueCountries.length,
      avgRiskScore: Math.round(stats.avgRiskScore * 100) / 100,
      highRiskCount: stats.highRiskCount,
      suspiciousCount: stats.suspiciousCount,
      safeCount: totalLocations - stats.highRiskCount,
    };
  } catch (error) {
    console.error("❌ Calculate overview stats error:", error);
    return null;
  }
};

module.exports = {
  getCurrentLocation,
  getLocationHistory,
  getLocationStatsByCountry,
  getSuspiciousLocations,
  updateLocation,
  deleteLocation,
  getLatestLocation,
  findNearbyLocations,
  getLocationOverviewStats,
};
