/**
 * Controller quản lý user
 * Xử lý CRUD operations cho User model với SSR EJS
 */

const User = require("../models/User");
const AccountDelete = require("../models/AccountDelete");
const { validationResult } = require("express-validator");

/**
 * Lấy tất cả users (SSR EJS)
 * Xử lý GET /api/v1/user
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getUserAll = async (req, res) => {
  try {
    let users;
    let title = "Danh sách Users";

    // Phân quyền: admin xem tất cả, user thường chỉ xem chính mình
    if (req.user.role === "admin") {
      users = await User.find({})
        .select("-pass") // Ẩn password
        .sort({ createdAt: -1 });

      console.log(`👑 Admin viewed all users: ${users.length} users`, {
        adminId: req.user.id,
        ip: req.ip,
      });
    } else {
      // User thường chỉ xem thông tin của chính mình
      const user = await User.findById(req.user.id).select("-pass");
      users = user ? [user] : [];
      title = "Thông tin cá nhân";

      console.log(`👤 User viewed own profile: ${req.user.email}`, {
        userId: req.user.id,
        ip: req.ip,
      });
    }

    // Render EJS template
    res.render("users", {
      title: title,
      users: users,
      currentUser: req.user,
      isAdmin: req.user.role === "admin",
      message: req.query.message,
      error: req.query.error,
    });
  } catch (error) {
    console.error("❌ Get all users error:", error.message);

    res.status(500).render("error", {
      title: "Lỗi",
      message: "Không thể tải danh sách users",
      error: process.env.NODE_ENV === "development" ? error : null,
    });
  }
};

/**
 * Lấy user theo ID (SSR EJS)
 * Xử lý GET /api/v1/user/:id
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getUserForID = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render("error", {
        title: "Lỗi",
        message: "ID không hợp lệ",
        errors: errors.array(),
      });
    }

    const user = await User.findById(id).select("-pass");
    if (!user) {
      return res.status(404).render("error", {
        title: "Không tìm thấy",
        message: "User không tồn tại",
      });
    }

    // Kiểm tra quyền: admin hoặc chính user đó
    if (req.user.role !== "admin" && req.user.id !== id) {
      return res.status(403).render("error", {
        title: "Không có quyền",
        message: "Bạn không có quyền xem thông tin của user khác",
      });
    }

    console.log(`👀 User viewed profile: ${user.email}`, {
      viewerId: req.user.id,
      targetId: id,
      ip: req.ip,
    });

    // Render trang chi tiết user
    res.render("userDetail", {
      title: `Thông tin ${user.name}`,
      user: user,
      currentUser: req.user,
      isOwner: req.user.id === id,
      isAdmin: req.user.role === "admin",
    });
  } catch (error) {
    console.error("❌ Get user by ID error:", error.message);

    res.status(500).render("error", {
      title: "Lỗi",
      message: "Không thể tải thông tin user",
      error: process.env.NODE_ENV === "development" ? error : null,
    });
  }
};

/**
 * Hiển thị form tạo user mới (SSR EJS)
 * Xử lý GET /api/v1/user/new
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const showCreateUserForm = (req, res) => {
  try {
    // Chỉ admin mới được tạo user
    if (req.user.role !== "admin") {
      return res.status(403).render("error", {
        title: "Không có quyền",
        message: "Chỉ admin mới có thể tạo user mới",
      });
    }

    res.render("createUser", {
      title: "Tạo User mới",
      currentUser: req.user,
      csrfToken: req.csrfToken ? req.csrfToken() : null,
      errors: null,
      formData: null,
    });
  } catch (error) {
    console.error("❌ Show create user form error:", error.message);

    res.status(500).render("error", {
      title: "Lỗi",
      message: "Không thể tải form tạo user",
      error: process.env.NODE_ENV === "development" ? error : null,
    });
  }
};

/**
 * Tạo user mới (SSR EJS)
 * Xử lý POST /api/v1/user
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const createUserNew = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render("createUser", {
        title: "Tạo User mới",
        currentUser: req.user,
        csrfToken: req.csrfToken ? req.csrfToken() : null,
        errors: errors.array(),
        formData: req.body,
      });
    }

    // Chỉ admin mới được tạo user
    if (req.user.role !== "admin") {
      return res.status(403).render("error", {
        title: "Không có quyền",
        message: "Chỉ admin mới có thể tạo user mới",
      });
    }

    const { name, age, address, email, pass, role } = req.body;

    // Kiểm tra email đã tồn tại
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).render("createUser", {
        title: "Tạo User mới",
        currentUser: req.user,
        csrfToken: req.csrfToken ? req.csrfToken() : null,
        errors: [{ msg: "Email đã được sử dụng" }],
        formData: req.body,
      });
    }

    // Tạo user mới
    const newUser = new User({
      name,
      age: parseInt(age),
      address,
      email,
      pass, // Sẽ được hash tự động bởi pre-save middleware
      role: role || "user",
    });

    await newUser.save();

    console.log(`✅ User created by admin: ${newUser.email}`, {
      adminId: req.user.id,
      newUserId: newUser._id,
      ip: req.ip,
    });

    // Redirect về danh sách users với thông báo thành công
    res.redirect("/api/v1/user?message=User đã được tạo thành công");
  } catch (error) {
    console.error("❌ Create user error:", error.message);

    res.status(500).render("createUser", {
      title: "Tạo User mới",
      currentUser: req.user,
      csrfToken: req.csrfToken ? req.csrfToken() : null,
      errors: [{ msg: "Lỗi server khi tạo user" }],
      formData: req.body,
    });
  }
};

/**
 * Hiển thị form chỉnh sửa user (SSR EJS)
 * Xử lý GET /api/v1/user/:id/edit
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const showEditUserForm = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-pass");
    if (!user) {
      return res.status(404).render("error", {
        title: "Không tìm thấy",
        message: "User không tồn tại",
      });
    }

    // Kiểm tra quyền: admin hoặc chính user đó
    if (req.user.role !== "admin" && req.user.id !== id) {
      return res.status(403).render("error", {
        title: "Không có quyền",
        message: "Bạn không có quyền chỉnh sửa user này",
      });
    }

    res.render("editUser", {
      title: `Chỉnh sửa ${user.name}`,
      user: user,
      currentUser: req.user,
      csrfToken: req.csrfToken ? req.csrfToken() : null,
      errors: null,
    });
  } catch (error) {
    console.error("❌ Show edit user form error:", error.message);

    res.status(500).render("error", {
      title: "Lỗi",
      message: "Không thể tải form chỉnh sửa user",
      error: process.env.NODE_ENV === "development" ? error : null,
    });
  }
};

/**
 * Cập nhật user theo ID (SSR EJS)
 * Xử lý PUT /api/v1/user/:id
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const updateForID = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const user = await User.findById(id).select("-pass");
      return res.status(400).render("editUser", {
        title: `Chỉnh sửa ${user?.name || "User"}`,
        user: user,
        currentUser: req.user,
        csrfToken: req.csrfToken ? req.csrfToken() : null,
        errors: errors.array(),
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).render("error", {
        title: "Không tìm thấy",
        message: "User không tồn tại",
      });
    }

    // Kiểm tra quyền: admin hoặc chính user đó
    if (req.user.role !== "admin" && req.user.id !== id) {
      return res.status(403).render("error", {
        title: "Không có quyền",
        message: "Bạn không có quyền chỉnh sửa user này",
      });
    }

    const { name, age, address, email, role } = req.body;

    // Kiểm tra email trùng lặp (nếu thay đổi email)
    if (email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).render("editUser", {
          title: `Chỉnh sửa ${user.name}`,
          user: user,
          currentUser: req.user,
          csrfToken: req.csrfToken ? req.csrfToken() : null,
          errors: [{ msg: "Email đã được sử dụng" }],
        });
      }
    }

    // Cập nhật user
    const updateData = { name, age: parseInt(age), address, email };

    // Chỉ admin mới được thay đổi role
    if (req.user.role === "admin" && role) {
      updateData.role = role;
    }

    await User.findByIdAndUpdate(id, updateData, { new: true });

    console.log(`✏️ User updated: ${user.email}`, {
      updaterId: req.user.id,
      updatedId: id,
      changes: Object.keys(updateData),
      ip: req.ip,
    });

    // Redirect với thông báo thành công
    const redirectUrl =
      req.user.role === "admin" ? "/api/v1/user" : `/api/v1/user/${id}`;
    res.redirect(`${redirectUrl}?message=User đã được cập nhật thành công`);
  } catch (error) {
    console.error("❌ Update user error:", error.message);

    res.status(500).render("error", {
      title: "Lỗi",
      message: "Không thể cập nhật user",
      error: process.env.NODE_ENV === "development" ? error : null,
    });
  }
};

/**
 * Xóa user theo ID (SSR EJS)
 * Xử lý DELETE /api/v1/user/:id
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const deleteForID = async (req, res) => {
  try {
    const { id } = req.params;

    // Chỉ admin mới được xóa user
    if (req.user.role !== "admin") {
      return res.status(403).render("error", {
        title: "Không có quyền",
        message: "Chỉ admin mới có thể xóa user",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).render("error", {
        title: "Không tìm thấy",
        message: "User không tồn tại",
      });
    }

    // Không cho phép xóa admin cuối cùng
    if (user.role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res.status(400).render("error", {
          title: "Không thể xóa",
          message: "Không thể xóa admin cuối cùng",
        });
      }
    }

    // Lưu thông tin vào AccountDelete trước khi xóa
    await AccountDelete.create({
      originalUserId: user._id,
      name: user.name,
      age: user.age,
      address: user.address,
      email: user.email,
      role: user.role,
      deleteReason: req.body?.reason || "admin_action",
      deleteNote: req.body?.note || "Deleted by admin",
      deletedBy: req.user.id,
      deletedByIP: req.ip,
    });

    // Xóa user
    await User.findByIdAndDelete(id);

    console.log(`🗑️ User deleted: ${user.email}`, {
      adminId: req.user.id,
      deletedId: id,
      reason: req.body?.reason || "admin_action",
      ip: req.ip,
    });

    // Redirect về danh sách users
    res.redirect("/api/v1/user?message=User đã được xóa thành công");
  } catch (error) {
    console.error("❌ Delete user error:", error.message);

    res.status(500).render("error", {
      title: "Lỗi",
      message: "Không thể xóa user",
      error: process.env.NODE_ENV === "development" ? error : null,
    });
  }
};

module.exports = {
  getUserAll,
  getUserForID,
  showCreateUserForm,
  createUserNew,
  showEditUserForm,
  updateForID,
  deleteForID,
};
