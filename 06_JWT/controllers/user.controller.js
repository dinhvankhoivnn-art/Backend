/**
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */

const { default: status } = require("http-status");
const { getTime } = require("../helpers/getTime");
const User = require("../models/User");

// ! ACRUD => All , Create , Read , Update , Delete
// todo: lấy tất cả user

const getAllUsers = async (req, res) => {
  try {
    const data = await User.find().sort({ role: 1 });
    const countData = await User.countDocuments();
    res.status(status.OK).json({
      message: "Lấy tất cả users thành công",
      length: countData,
      time: getTime(),
      data,
    });
  } catch (error) {
    res.status(status.INTERNAL_SERVER_ERROR).json({
      message: "Lỗi lấy toàn bộ users",
      time: getTime(),
      error: error.message,
    });
  }
};

// todo : lấy theo ID

const getUserForID = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await User.findById(id);

    if (!data) {
      return res.status(status.NOT_FOUND).json({
        message: `Không tìm thấy user với ID: ${id}`,
        time: getTime(),
      });
    }

    res.status(status.OK).json({
      message: `Lấy user với ID: ${id} thành công`,
      time: getTime(),
      data,
    });
  } catch (error) {
    res.status(status.INTERNAL_SERVER_ERROR).json({
      message: "Lỗi lấy user theo ID" + id,
      time: getTime(),
      error: error.message,
    });
  }
};

// todo : cập nhật theo ID

const updatedForID = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const data = await User.findByIdAndUpdate(id, body, { new: true });

    if (!data) {
      return res.status(status.NOT_FOUND).json({
        message: `Không tìm thấy user với ID: ${id}`,
        time: getTime(),
      });
    }

    res.status(status.OK).json({
      message: `Cập nhật user với ID: ${id} thành công`,
      time: getTime(),
      data,
    });
  } catch (error) {
    res.status(status.INTERNAL_SERVER_ERROR).json({
      message: "Lỗi cập nhật user",
      time: getTime(),
      error: error.message,
    });
  }
};

// todo : tạo user mới

const createUserNew = async (req, res) => {
  try {
    const body = req.body;
    const newUser = new User(body);
    const data = await newUser.save();

    res.status(status.CREATED).json({
      message: "Tạo user mới thành công",
      time: getTime(),
      data,
    });
  } catch (error) {
    res.status(status.INTERNAL_SERVER_ERROR).json({
      message: "Lỗi tạo user mới",
      time: getTime(),
      error: error.message,
    });
  }
};

// todo : xóa user theo ID

const deleteUserForID = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await User.findByIdAndDelete(id);

    if (!data) {
      return res.status(status.NOT_FOUND).json({
        message: `Không tìm thấy user với ID: ${id} để xóa`,
        time: getTime(),
      });
    }

    res.status(status.OK).json({
      message: `Xóa user với ID: ${id} thành công`,
      time: getTime(),
      data,
    });
  } catch (error) {
    res.status(status.INTERNAL_SERVER_ERROR).json({
      message: "Lỗi xóa user",
      time: getTime(),
      error: error.message,
    });
  }
};

// todo : tìm kiếm user

const searchUser = async (req, res) => {
  try {
    const { query } = req.query;
    // Tìm kiếm không phân biệt chữ hoa chữ thường
    const data = await User.find({ name: { $regex: query, $options: "i" } });
    const countData = await User.countDocuments({
      name: { $regex: query, $options: "i" },
    });
    // ! kiểm tra kết quả tìm kiếm
    if (!countData) {
      return res.status(status.NOT_FOUND).json({
        message: `Không tìm thấy users với từ khóa '${query}'`,
        time: getTime(),
      });
    }
    res.status(status.OK).json({
      message: `Tìm kiếm users với từ khóa '${query}' thành công`,
      length: countData,
      time: getTime(),
      data,
    });
  } catch (error) {
    res.status(status.INTERNAL_SERVER_ERROR).json({
      message: "Lỗi tìm kiếm users",
      time: getTime(),
      error: error.message,
    });
  }
};

module.exports = {
  getAllUsers,
  getUserForID,
  updatedForID,
  createUserNew,
  deleteUserForID,
  searchUser,
};
