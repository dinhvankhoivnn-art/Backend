/**
 * Middleware theo dõi hoạt động của người dùng trên web
 * Ghi lại mọi URL truy cập, IP, tọa độ GPS, thông tin user
 */

const TrackingUserForWeb = require("../models/TrackingUserForWeb");
const User = require("../models/User");

/**
 * Middleware chính để track user activities
 * Được sử dụng cho tất cả routes
 */
const trackUserActivity = async (req, res, next) => {
  const startTime = Date.now();

  try {
    // Thu thập thông tin cơ bản
    const trackingData = {
      url: req.originalUrl || req.url,
      method: req.method,
      userAgent: req.get("User-Agent"),
      referer: req.get("Referer"),
      ipAddress: getClientIP(req),
      timestamp: new Date(),
      metadata: {},
    };

    // Thêm thông tin user nếu đã đăng nhập
    if (req.user) {
      trackingData.userId = req.user.id;
      trackingData.name = req.user.name;
      trackingData.email = req.user.email;
    }

    // Detect device info từ user agent
    trackingData.deviceInfo = detectDeviceInfo(req.get("User-Agent"));

    // Detect bot
    const botInfo = detectBot(req.get("User-Agent"));
    if (botInfo.isBot) {
      trackingData.botDetection = botInfo;
    }

    // Tạo tracking record
    const trackingRecord = new TrackingUserForWeb(trackingData);
    await trackingRecord.save();

    // Attach tracking ID to request để có thể update sau
    req.trackingId = trackingRecord._id;

    console.log(
      `📊 Tracked user activity: ${trackingData.url} (${trackingData.ipAddress})`
    );

    // Override res.end để update timeSpent khi response hoàn thành
    const originalEnd = res.end;
    res.end = function (chunk, encoding) {
      const timeSpent = Date.now() - startTime;

      // Update timeSpent asynchronously (không block response)
      if (req.trackingId) {
        TrackingUserForWeb.findByIdAndUpdate(req.trackingId, {
          timeSpent: timeSpent,
          status: "completed",
        }).catch((err) =>
          console.error("❌ Error updating tracking time:", err)
        );
      }

      // Gọi original end
      originalEnd.call(this, chunk, encoding);
    };

    next();
  } catch (error) {
    console.error("❌ Error tracking user activity:", error);
    // Không block request nếu tracking lỗi
    next();
  }
};

/**
 * Middleware để track GPS location khi user gửi
 * POST /api/track-location
 */
const trackGPSLocation = async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      accuracy,
      altitude,
      altitudeAccuracy,
      heading,
      speed,
    } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude và longitude là bắt buộc",
        code: "MISSING_COORDINATES",
      });
    }

    // Validate coordinates
    if (
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return res.status(400).json({
        success: false,
        message: "Tọa độ GPS không hợp lệ",
        code: "INVALID_COORDINATES",
      });
    }

    // Reverse geocode để lấy địa chỉ
    const address = await reverseGeocode(latitude, longitude);

    // Update tracking record gần nhất của user này
    const updateData = {
      latitude,
      longitude,
      address,
      "location.accuracy": accuracy,
      "location.altitude": altitude,
      "location.altitudeAccuracy": altitudeAccuracy,
      "location.heading": heading,
      "location.speed": speed,
    };

    // Tìm và update record gần nhất trong 5 phút
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const result = await TrackingUserForWeb.findOneAndUpdate(
      {
        $or: [{ userId: req.user?.id }, { ipAddress: getClientIP(req) }],
        timestamp: { $gte: fiveMinutesAgo },
        latitude: null, // Chỉ update records chưa có location
      },
      updateData,
      { sort: { timestamp: -1 }, new: true }
    );

    if (result) {
      console.log(
        `📍 Updated GPS location for user: ${latitude}, ${longitude}`
      );
    }

    res.json({
      success: true,
      message: "GPS location đã được cập nhật",
      data: {
        address: address?.fullAddress || `${latitude}, ${longitude}`,
      },
    });
  } catch (error) {
    console.error("❌ Error tracking GPS location:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi cập nhật vị trí GPS",
      code: "GPS_TRACKING_ERROR",
    });
  }
};

/**
 * Middleware để track device info và network info
 * POST /api/track-device-info
 */
const trackDeviceInfo = async (req, res) => {
  try {
    const deviceInfo = req.body.deviceInfo || {};
    const networkInfo = req.body.networkInfo || {};

    const updateData = {
      "deviceInfo.screenResolution": deviceInfo.screenResolution,
      "deviceInfo.viewportSize": deviceInfo.viewportSize,
      "deviceInfo.colorDepth": deviceInfo.colorDepth,
      "deviceInfo.pixelRatio": deviceInfo.pixelRatio,
      "deviceInfo.touchSupport": deviceInfo.touchSupport,
      "deviceInfo.cookiesEnabled": deviceInfo.cookiesEnabled,
      "deviceInfo.javascriptEnabled": deviceInfo.javascriptEnabled,
      "deviceInfo.language": deviceInfo.language,
      "networkInfo.connectionType": networkInfo.connectionType,
      "networkInfo.effectiveType": networkInfo.effectiveType,
      "networkInfo.downlink": networkInfo.downlink,
      "networkInfo.rtt": networkInfo.rtt,
      "networkInfo.saveData": networkInfo.saveData,
    };

    // Update record gần nhất
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const result = await TrackingUserForWeb.findOneAndUpdate(
      {
        $or: [{ userId: req.user?.id }, { ipAddress: getClientIP(req) }],
        timestamp: { $gte: fiveMinutesAgo },
      },
      updateData,
      { sort: { timestamp: -1 }, new: true }
    );

    if (result) {
      console.log(`📱 Updated device info for user`);
    }

    res.json({
      success: true,
      message: "Device info đã được cập nhật",
    });
  } catch (error) {
    console.error("❌ Error tracking device info:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi cập nhật device info",
      code: "DEVICE_TRACKING_ERROR",
    });
  }
};

/**
 * Middleware để track session và navigation
 * POST /api/track-session
 */
const trackSession = async (req, res) => {
  try {
    const { sessionId, pageViewId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "Session ID là bắt buộc",
        code: "MISSING_SESSION_ID",
      });
    }

    // Update tất cả records trong session này
    const result = await TrackingUserForWeb.updateMany(
      {
        $or: [{ userId: req.user?.id }, { ipAddress: getClientIP(req) }],
        timestamp: {
          $gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 giờ
        },
      },
      { sessionId: sessionId }
    );

    console.log(
      `🎯 Updated session tracking: ${sessionId} (${result.modifiedCount} records)`
    );

    res.json({
      success: true,
      message: "Session tracking đã được cập nhật",
      data: {
        sessionId,
        updatedRecords: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error("❌ Error tracking session:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi cập nhật session tracking",
      code: "SESSION_TRACKING_ERROR",
    });
  }
};

/**
 * API để lấy thống kê tracking
 * GET /api/tracking/stats
 */
const getTrackingStats = async (req, res) => {
  try {
    const { type, days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    let stats;

    switch (type) {
      case "user":
        if (!req.user) {
          return res.status(401).json({
            success: false,
            message: "Cần đăng nhập để xem stats cá nhân",
            code: "AUTH_REQUIRED",
          });
        }
        stats = await TrackingUserForWeb.getStatsByUser(
          req.user.id,
          parseInt(days)
        );
        break;

      case "ip":
        const ip = req.query.ip || getClientIP(req);
        stats = await TrackingUserForWeb.getStatsByIP(ip, parseInt(days));
        break;

      case "urls":
        stats = await TrackingUserForWeb.getTopUrls(20, parseInt(days));
        break;

      case "bots":
        const bots = await TrackingUserForWeb.detectBots();
        stats = {
          totalBots: bots.length,
          bots: bots.slice(0, 10), // Top 10
        };
        break;

      default:
        // General stats
        const totalRecords = await TrackingUserForWeb.countDocuments({
          timestamp: { $gte: startDate },
        });

        const uniqueIPs = await TrackingUserForWeb.distinct("ipAddress", {
          timestamp: { $gte: startDate },
        });

        const uniqueUsers = await TrackingUserForWeb.distinct("userId", {
          timestamp: { $gte: startDate },
          userId: { $ne: null },
        });

        stats = {
          totalRecords,
          uniqueIPs: uniqueIPs.length,
          uniqueUsers: uniqueUsers.length,
          period: `${days} ngày`,
        };
    }

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("❌ Error getting tracking stats:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi lấy thống kê tracking",
      code: "TRACKING_STATS_ERROR",
    });
  }
};

/**
 * API để export tracking data
 * GET /api/tracking/export
 */
const exportTrackingData = async (req, res) => {
  try {
    const { startDate, endDate, format = "json" } = req.query;

    const query = {};
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Admin only hoặc user chỉ xem data của mình
    if (!req.user?.role === "admin") {
      query.$or = [{ userId: req.user?.id }, { ipAddress: getClientIP(req) }];
    }

    const data = await TrackingUserForWeb.find(query)
      .sort({ timestamp: -1 })
      .limit(1000); // Limit để tránh overload

    if (format === "csv") {
      // Convert to CSV format
      const csvData = convertToCSV(data);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="tracking-data.csv"'
      );
      res.send(csvData);
    } else {
      res.json({
        success: true,
        data: data,
        count: data.length,
      });
    }
  } catch (error) {
    console.error("❌ Error exporting tracking data:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi export tracking data",
      code: "TRACKING_EXPORT_ERROR",
    });
  }
};

/**
 * Helper functions
 */

function getClientIP(req) {
  // Check for proxy headers
  const forwarded = req.headers["x-forwarded-for"];
  const realIP = req.headers["x-real-ip"];
  const clientIP = req.headers["x-client-ip"];

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (clientIP) {
    return clientIP;
  }

  return req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
}

function detectDeviceInfo(userAgent) {
  if (!userAgent) {
    return {
      type: "unknown",
      os: "unknown",
      browser: "unknown",
    };
  }

  const ua = userAgent.toLowerCase();

  let deviceType = "desktop";
  let os = "unknown";
  let browser = "unknown";

  // Detect device type
  if (
    ua.includes("mobile") ||
    (ua.includes("android") && ua.includes("mobile"))
  ) {
    deviceType = "mobile";
  } else if (ua.includes("tablet") || ua.includes("ipad")) {
    deviceType = "tablet";
  }

  // Detect OS
  if (ua.includes("windows")) {
    os = "Windows";
  } else if (ua.includes("mac os x") || ua.includes("macos")) {
    os = "macOS";
  } else if (ua.includes("linux")) {
    os = "Linux";
  } else if (ua.includes("android")) {
    os = "Android";
  } else if (
    ua.includes("ios") ||
    ua.includes("iphone") ||
    ua.includes("ipad")
  ) {
    os = "iOS";
  }

  // Detect browser
  if (ua.includes("chrome") && !ua.includes("edg")) {
    browser = "Chrome";
  } else if (ua.includes("firefox")) {
    browser = "Firefox";
  } else if (ua.includes("safari") && !ua.includes("chrome")) {
    browser = "Safari";
  } else if (ua.includes("edg")) {
    browser = "Edge";
  } else if (ua.includes("opera")) {
    browser = "Opera";
  }

  return { type: deviceType, os, browser };
}

function detectBot(userAgent) {
  if (!userAgent) return { isBot: false };

  const ua = userAgent.toLowerCase();
  let isBot = false;
  let botType = "unknown";
  let confidence = 0;

  // Common bot patterns
  const botPatterns = [
    "bot",
    "crawler",
    "spider",
    "scraper",
    "googlebot",
    "bingbot",
    "yahoo",
    "baidu",
    "yandex",
    "duckduckbot",
    "facebookexternalhit",
    "twitterbot",
    "linkedinbot",
    "whatsapp",
    "telegram",
  ];

  for (const pattern of botPatterns) {
    if (ua.includes(pattern)) {
      isBot = true;
      confidence = 90;
      if (pattern.includes("google")) botType = "search_engine";
      else if (pattern.includes("bing") || pattern.includes("yahoo"))
        botType = "search_engine";
      else if (pattern.includes("facebook") || pattern.includes("twitter"))
        botType = "social_media";
      else botType = "crawler";
      break;
    }
  }

  // Additional checks for suspicious patterns
  if (!isBot) {
    if (ua.length < 20 || !ua.includes("mozilla")) {
      isBot = true;
      botType = "suspicious";
      confidence = 70;
    }
  }

  return { isBot, botType, confidence };
}

async function reverseGeocode(lat, lng) {
  try {
    // Sử dụng OpenStreetMap Nominatim API (free)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          "User-Agent": "WebTrackingApp/1.0",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Geocoding API error");
    }

    const data = await response.json();

    if (data && data.address) {
      return {
        street:
          data.address.road || data.address.pedestrian || data.address.path,
        city: data.address.city || data.address.town || data.address.village,
        state: data.address.state,
        country: data.address.country,
        postalCode: data.address.postcode,
        fullAddress: data.display_name,
      };
    }

    return null;
  } catch (error) {
    console.error("❌ Geocoding error:", error);
    return null;
  }
}

function convertToCSV(data) {
  if (!data || data.length === 0) return "";

  const headers = [
    "timestamp",
    "url",
    "method",
    "ipAddress",
    "userAgent",
    "latitude",
    "longitude",
    "country",
    "city",
    "browser",
    "os",
    "userId",
    "name",
    "email",
    "isBot",
  ];

  const csvRows = [headers.join(",")];

  for (const record of data) {
    const row = [
      record.timestamp?.toISOString() || "",
      `"${record.url || ""}"`,
      record.method || "",
      record.ipAddress || "",
      `"${record.userAgent || ""}"`,
      record.latitude || "",
      record.longitude || "",
      record.address?.country || "",
      record.address?.city || "",
      record.deviceInfo?.browser || "",
      record.deviceInfo?.os || "",
      record.userId || "",
      `"${record.name || ""}"`,
      record.email || "",
      record.botDetection?.isBot || false,
    ];
    csvRows.push(row.join(","));
  }

  return csvRows.join("\n");
}

module.exports = {
  trackUserActivity,
  trackGPSLocation,
  trackDeviceInfo,
  trackSession,
  getTrackingStats,
  exportTrackingData,
};
