const { default: status } = require("http-status");
const { getTime } = require("../helpers/getTime");
const User = require("../models/User");
const mongoose = require("mongoose");

// Hàm kiểm tra ObjectId hợp lệ
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getAllUser = async (req, res) => {
  try {
    // Lấy query parameters cho pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Lấy danh sách user với pagination
    const data = await User.find({ isActive: true })
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const countData = await User.countDocuments({ isActive: true });
    const totalPages = Math.ceil(countData / limit);

    return res.status(status.OK).json({
      success: true,
      message: "Lấy danh sách user thành công!",
      data: {
        users: data,
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers: countData,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
      time: getTime(),
    });
  } catch (error) {
    console.error("Get all users error:", error);
    return res.status(status.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Lỗi lấy danh sách users",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
      time: getTime(),
    });
  }
};

const getUserForID = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra ID hợp lệ
    if (!isValidObjectId(id)) {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: `ID không hợp lệ: [${id}]`,
        time: getTime(),
      });
    }

    // Chỉ admin hoặc chính user đó mới được xem thông tin
    if (req.user.role !== "admin" && req.user.id !== id) {
      return res.status(status.FORBIDDEN).json({
        success: false,
        message: "Bạn không có quyền xem thông tin user này",
        time: getTime(),
      });
    }

    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(status.NOT_FOUND).json({
        success: false,
        message: `Không tìm thấy user theo ID: [${id}]`,
        time: getTime(),
      });
    }

    // Kiểm tra user có active không
    if (!user.isActive) {
      return res.status(status.NOT_FOUND).json({
        success: false,
        message: "User đã bị vô hiệu hóa",
        time: getTime(),
      });
    }

    return res.status(status.OK).json({
      success: true,
      message: `Lấy user theo ID: [${id}] thành công!`,
      data: user,
      time: getTime(),
    });
  } catch (error) {
    console.error("Get user by ID error:", error);
    return res.status(status.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `Lỗi lấy user theo ID: [${id}]`,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
      time: getTime(),
    });
  }
};

const createUserNew = async (req, res) => {
  try {
    const { name, age, phone, email, password, role } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!name || !age || !phone || !email || !password) {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message:
          "Vui lòng cung cấp đầy đủ thông tin: name, age, phone, email, password",
        time: getTime(),
      });
    }

    // Chỉ admin mới được phép tạo user với role cụ thể
    if (role && req.user.role !== "admin") {
      return res.status(status.FORBIDDEN).json({
        success: false,
        message: "Chỉ admin mới có quyền chỉ định role",
        time: getTime(),
      });
    }

    // Kiểm tra email và phone đã tồn tại chưa
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      const field = existingUser.email === email ? "email" : "số điện thoại";
      return res.status(status.CONFLICT).json({
        success: false,
        message: `${field} đã được sử dụng`,
        time: getTime(),
      });
    }

    const data = await User.create({
      name,
      age,
      phone,
      email,
      password,
      role: role || "user",
    });

    return res.status(status.CREATED).json({
      success: true,
      message: "Thêm user mới thành công",
      data: {
        id: data._id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        age: data.age,
        role: data.role,
        isActive: data.isActive,
        createdAt: data.createdAt,
      },
      time: getTime(),
    });
  } catch (error) {
    console.error("Create user error:", error);

    // Xử lý lỗi validation từ Mongoose
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors,
        time: getTime(),
      });
    }

    // Xử lý lỗi duplicate key
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(status.CONFLICT).json({
        success: false,
        message: `${field} đã được sử dụng`,
        time: getTime(),
      });
    }

    return res.status(status.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Lỗi thêm user mới",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
      time: getTime(),
    });
  }
};

const updateUserForID = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra ID hợp lệ
    if (!isValidObjectId(id)) {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: `ID không hợp lệ: [${id}]`,
        time: getTime(),
      });
    }

    // Chỉ admin hoặc chính user đó mới được cập nhật
    if (req.user.role !== "admin" && req.user.id !== id) {
      return res.status(status.FORBIDDEN).json({
        success: false,
        message: "Bạn không có quyền cập nhật user này",
        time: getTime(),
      });
    }

    // Không cho phép cập nhật role nếu không phải admin
    if (req.body.role && req.user.role !== "admin") {
      return res.status(status.FORBIDDEN).json({
        success: false,
        message: "Chỉ admin mới có quyền cập nhật role",
        time: getTime(),
      });
    }

    // Loại bỏ password khỏi body nếu có
    const updateData = { ...req.body };
    delete updateData.password;

    const data = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!data) {
      return res.status(status.NOT_FOUND).json({
        success: false,
        message: `Không tìm thấy user theo ID: [${id}]`,
        time: getTime(),
      });
    }

    return res.status(status.OK).json({
      success: true,
      message: `Cập nhật user theo ID: [${id}] thành công!`,
      data,
      time: getTime(),
    });
  } catch (error) {
    console.error("Update user error:", error);

    // Xử lý lỗi validation từ Mongoose
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors,
        time: getTime(),
      });
    }

    // Xử lý lỗi duplicate key
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(status.CONFLICT).json({
        success: false,
        message: `${field} đã được sử dụng`,
        time: getTime(),
      });
    }

    return res.status(status.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `Lỗi cập nhật user theo ID: [${id}]`,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
      time: getTime(),
    });
  }
};

const deleteUserForID = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra ID hợp lệ
    if (!isValidObjectId(id)) {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: `ID không hợp lệ: [${id}]`,
        time: getTime(),
      });
    }

    // Không cho phép xóa chính mình
    if (req.user.id === id) {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: "Không thể xóa chính mình",
        time: getTime(),
      });
    }

    // Soft delete - chỉ đánh dấu isActive = false
    const data = await User.findByIdAndUpdate(
      id,
      { isActive: false },
      {
        new: true,
      }
    ).select("-password");

    if (!data) {
      return res.status(status.NOT_FOUND).json({
        success: false,
        message: `Không tìm thấy user theo ID: [${id}]`,
        time: getTime(),
      });
    }

    return res.status(status.OK).json({
      success: true,
      message: `Xóa user theo ID: [${id}] thành công!`,
      data,
      time: getTime(),
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(status.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `Lỗi xóa user theo ID: [${id}]`,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
      time: getTime(),
    });
  }
};

const searchUser = async (req, res) => {
  try {
    const { query } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!query) {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: "Vui lòng cung cấp từ khóa tìm kiếm",
        time: getTime(),
      });
    }

    const searchRegex = new RegExp(query, "i");
    const users = await User.find({
      $and: [
        { isActive: true },
        {
          $or: [
            { name: { $regex: searchRegex } },
            { email: { $regex: searchRegex } },
            { phone: { $regex: searchRegex } },
          ],
        },
      ],
    })
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalUsers = await User.countDocuments({
      $and: [
        { isActive: true },
        {
          $or: [
            { name: { $regex: searchRegex } },
            { email: { $regex: searchRegex } },
            { phone: { $regex: searchRegex } },
          ],
        },
      ],
    });

    const totalPages = Math.ceil(totalUsers / limit);

    return res.status(status.OK).json({
      success: true,
      message: `Tìm kiếm user theo từ khóa: [${query}] thành công!`,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
      time: getTime(),
    });
  } catch (error) {
    console.error("Search user error:", error);
    return res.status(status.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Lỗi tìm kiếm user",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
      time: getTime(),
    });
  }
};

module.exports = {
  getAllUser,
  getUserForID,
  createUserNew,
  updateUserForID,
  deleteUserForID,
  searchUser,
};
