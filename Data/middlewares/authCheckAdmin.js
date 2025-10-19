/**
 * Middleware kiểm tra quyền admin
 * Chỉ cho phép user có role 'admin' truy cập
 */

const User = require("../models/User");

/**
 * Middleware kiểm tra quyền admin
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const authCheckAdmin = (req, res, next) => {
  try {
    // Kiểm tra user đã được xác thực chưa
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Chưa xác thực người dùng",
      });
    }

    // Kiểm tra role admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Không có quyền truy cập. Chỉ admin mới được phép.",
        requiredRole: "admin",
        currentRole: req.user.role,
      });
    }

    // Log hoạt động admin
    if (process.env.NODE_ENV === "development") {
      console.log(`👑 Admin access granted for: ${req.user.email}`);
    }

    next();
  } catch (error) {
    console.error("❌ Lỗi kiểm tra quyền admin:", error.message);

    return res.status(500).json({
      success: false,
      message: "Lỗi server khi kiểm tra quyền admin",
    });
  }
};

/**
 * Middleware kiểm tra quyền admin hoặc owner
 * Cho phép admin hoặc chủ sở hữu của resource truy cập
 * @param {Function} getResourceOwner - Function để lấy ID chủ sở hữu
 */
const authCheckAdminOrOwner = (getResourceOwner) => {
  return async (req, res, next) => {
    try {
      // Kiểm tra user đã được xác thực chưa
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Chưa xác thực người dùng",
        });
      }

      // Admin luôn được phép
      if (req.user.role === "admin") {
        if (process.env.NODE_ENV === "development") {
          console.log(`👑 Admin access granted for: ${req.user.email}`);
        }
        return next();
      }

      // Kiểm tra quyền owner
      const resourceOwnerId = await getResourceOwner(req);
      if (req.user.id.toString() === resourceOwnerId.toString()) {
        if (process.env.NODE_ENV === "development") {
          console.log(`👤 Owner access granted for: ${req.user.email}`);
        }
        return next();
      }

      // Không có quyền
      return res.status(403).json({
        success: false,
        message:
          "Không có quyền truy cập. Chỉ admin hoặc chủ sở hữu mới được phép.",
        requiredRole: "admin or owner",
        currentRole: req.user.role,
      });
    } catch (error) {
      console.error("❌ Lỗi kiểm tra quyền admin/owner:", error.message);

      return res.status(500).json({
        success: false,
        message: "Lỗi server khi kiểm tra quyền truy cập",
      });
    }
  };
};

/**
 * Middleware kiểm tra quyền admin với audit log
 * Ghi log khi admin truy cập tài nguyên nhạy cảm
 */
const authCheckAdminWithAudit = (resource = "unknown") => {
  return (req, res, next) => {
    try {
      // Kiểm tra user đã được xác thực chưa
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Chưa xác thực người dùng",
        });
      }

      // Kiểm tra role admin
      if (req.user.role !== "admin") {
        // Log попытку truy cập không được phép
        console.warn(`🚫 Unauthorized admin access attempt to ${resource}:`, {
          userId: req.user.id,
          email: req.user.email,
          role: req.user.role,
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.get("User-Agent"),
          timestamp: new Date().toISOString(),
        });

        return res.status(403).json({
          success: false,
          message: "Không có quyền truy cập. Chỉ admin mới được phép.",
          requiredRole: "admin",
          currentRole: req.user.role,
        });
      }

      // Log truy cập admin thành công
      console.log(`✅ Admin access to ${resource}:`, {
        adminId: req.user.id,
        adminEmail: req.user.email,
        ip: req.ip || req.connection.remoteAddress,
        timestamp: new Date().toISOString(),
      });

      next();
    } catch (error) {
      console.error("❌ Lỗi kiểm tra quyền admin với audit:", error.message);

      return res.status(500).json({
        success: false,
        message: "Lỗi server khi kiểm tra quyền admin",
      });
    }
  };
};

module.exports = {
  authCheckAdmin,
  authCheckAdminOrOwner,
  authCheckAdminWithAudit,
};
