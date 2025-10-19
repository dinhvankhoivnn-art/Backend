/**
 * Middleware ghi log hoạt động authentication
 * Theo dõi tất cả hoạt động đăng nhập, đăng xuất, và thay đổi auth
 */

const TrackingUserForLogout = require("../models/TrackingUserForLogout");

/**
 * Middleware ghi log đăng nhập thành công
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const authLogLogin = async (req, res, next) => {
  try {
    // Lưu thông tin gốc của response để ghi log sau
    const originalSend = res.send;
    let responseData = null;
    let statusCode = 200;

    res.send = function (data) {
      responseData = data;
      return originalSend.call(this, data);
    };

    // Ghi nhận status code
    const originalStatus = res.status;
    res.status = function (code) {
      statusCode = code;
      return originalStatus.call(this, code);
    };

    // Sau khi response được gửi
    res.on("finish", async () => {
      try {
        // Chỉ ghi log khi đăng nhập thành công
        if (
          statusCode === 200 &&
          responseData &&
          JSON.parse(responseData).success
        ) {
          const user = res.locals.loggedInUser;

          if (user) {
            // Tạo bản ghi tracking với login time
            await TrackingUserForLogout.create({
              userId: user._id,
              name: user.name,
              age: user.age,
              email: user.email,
              role: user.role,
              loginTime: new Date(),
              // logoutTime sẽ được cập nhật khi đăng xuất
              deviceInfo: {
                userAgent: req.get("User-Agent"),
                ipAddress: req.ip || req.connection.remoteAddress,
                platform: getPlatformFromUserAgent(req.get("User-Agent")),
                browser: getBrowserFromUserAgent(req.get("User-Agent")),
              },
              sessionStatus: "normal",
              logoutReason: "user_initiated", // Mặc định
            });

            console.log(`📝 Login logged for user: ${user.email}`, {
              userId: user._id,
              ip: req.ip,
              userAgent: req.get("User-Agent"),
              timestamp: new Date().toISOString(),
            });
          }
        }
      } catch (error) {
        console.error("❌ Lỗi ghi log đăng nhập:", error.message);
      }
    });

    next();
  } catch (error) {
    console.error("❌ Lỗi middleware log login:", error.message);
    next();
  }
};

/**
 * Middleware ghi log đăng xuất
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const authLogLogout = async (req, res, next) => {
  try {
    // Kiểm tra user đã được xác thực
    if (!req.user) {
      return next();
    }

    const userId = req.user.id;
    const logoutReason = req.body?.reason || "user_initiated";
    const currentTime = new Date();

    // Tìm bản ghi login gần nhất chưa có logout time
    const lastLoginRecord = await TrackingUserForLogout.findOne({
      userId: userId,
      logoutTime: { $exists: false },
    }).sort({ loginTime: -1 });

    if (lastLoginRecord) {
      // Tính session duration
      const sessionDuration = Math.floor(
        (currentTime - lastLoginRecord.loginTime) / (1000 * 60)
      ); // phút

      // Cập nhật logout time và duration
      await TrackingUserForLogout.findByIdAndUpdate(lastLoginRecord._id, {
        logoutTime: currentTime,
        sessionDuration: sessionDuration,
        logoutReason: logoutReason,
        notes: `Logged out at ${currentTime.toISOString()}`,
      });

      console.log(`📝 Logout logged for user: ${req.user.email}`, {
        userId: req.user.id,
        sessionDuration: sessionDuration,
        reason: logoutReason,
        ip: req.ip,
        timestamp: currentTime.toISOString(),
      });
    } else {
      // Nếu không tìm thấy bản ghi login, tạo bản ghi logout mới
      await TrackingUserForLogout.create({
        userId: userId,
        name: req.user.name,
        age: req.user.age,
        email: req.user.email,
        role: req.user.role,
        loginTime: new Date(Date.now() - 60000), // Giả sử login 1 phút trước
        logoutTime: currentTime,
        sessionDuration: 1,
        logoutReason: logoutReason,
        deviceInfo: {
          userAgent: req.get("User-Agent"),
          ipAddress: req.ip || req.connection.remoteAddress,
          platform: getPlatformFromUserAgent(req.get("User-Agent")),
          browser: getBrowserFromUserAgent(req.get("User-Agent")),
        },
        sessionStatus: "normal",
        notes: "Logout record created without matching login",
      });

      console.warn(
        `⚠️ Logout logged without matching login for user: ${req.user.email}`
      );
    }

    next();
  } catch (error) {
    console.error("❌ Lỗi ghi log đăng xuất:", error.message);
    next();
  }
};

/**
 * Middleware ghi log hoạt động authentication thất bại
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const authLogFailedAttempt = (req, res, next) => {
  const originalSend = res.send;
  let responseData = null;
  let statusCode = 200;

  res.send = function (data) {
    responseData = data;
    return originalSend.call(this, data);
  };

  const originalStatus = res.status;
  res.status = function (code) {
    statusCode = code;
    return originalStatus.call(this, code);
  };

  res.on("finish", () => {
    try {
      // Chỉ ghi log khi có lỗi authentication (status 401, 403)
      if ([401, 403].includes(statusCode)) {
        console.warn(`🚨 Failed auth attempt:`, {
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.get("User-Agent"),
          attemptedEmail: req.body?.email,
          endpoint: req.originalUrl,
          method: req.method,
          statusCode: statusCode,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("❌ Lỗi ghi log failed attempt:", error.message);
    }
  });

  next();
};

/**
 * Middleware ghi log thay đổi mật khẩu
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const authLogPasswordChange = (req, res, next) => {
  const originalSend = res.send;
  let responseData = null;
  let statusCode = 200;

  res.send = function (data) {
    responseData = data;
    return originalSend.call(this, data);
  };

  const originalStatus = res.status;
  res.status = function (code) {
    statusCode = code;
    return originalStatus.call(this, code);
  };

  res.on("finish", () => {
    try {
      if (statusCode === 200 && req.user) {
        console.log(`🔑 Password changed for user: ${req.user.email}`, {
          userId: req.user.id,
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.get("User-Agent"),
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("❌ Lỗi ghi log password change:", error.message);
    }
  });

  next();
};

/**
 * Middleware ghi log hoạt động admin
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const authLogAdminActivity = (req, res, next) => {
  const originalSend = res.send;
  let responseData = null;
  let statusCode = 200;

  res.send = function (data) {
    responseData = data;
    return originalSend.call(this, data);
  };

  const originalStatus = res.status;
  res.status = function (code) {
    statusCode = code;
    return originalStatus.call(this, code);
  };

  res.on("finish", () => {
    try {
      if (
        req.user &&
        req.user.role === "admin" &&
        [200, 201].includes(statusCode)
      ) {
        console.log(`👑 Admin activity: ${req.user.email}`, {
          adminId: req.user.id,
          action: req.method + " " + req.originalUrl,
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.get("User-Agent"),
          statusCode: statusCode,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("❌ Lỗi ghi log admin activity:", error.message);
    }
  });

  next();
};

/**
 * Helper function: Lấy platform từ User Agent
 * @param {string} userAgent - User Agent string
 * @returns {string} Platform name
 */
function getPlatformFromUserAgent(userAgent) {
  if (!userAgent) return "unknown";

  if (
    userAgent.includes("Mobile") ||
    userAgent.includes("Android") ||
    userAgent.includes("iPhone")
  ) {
    return "mobile";
  } else if (userAgent.includes("Tablet") || userAgent.includes("iPad")) {
    return "tablet";
  } else {
    return "desktop";
  }
}

/**
 * Helper function: Lấy browser từ User Agent
 * @param {string} userAgent - User Agent string
 * @returns {string} Browser name
 */
function getBrowserFromUserAgent(userAgent) {
  if (!userAgent) return "unknown";

  if (userAgent.includes("Chrome")) return "Chrome";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Safari")) return "Safari";
  if (userAgent.includes("Edge")) return "Edge";
  if (userAgent.includes("Opera")) return "Opera";

  return "unknown";
}

module.exports = {
  authLogLogin,
  authLogLogout,
  authLogFailedAttempt,
  authLogPasswordChange,
  authLogAdminActivity,
};
