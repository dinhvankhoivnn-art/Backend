// ! ACRUD => ALL , CREATE , READ , UPDATE , DELETE

const { default: status } = require("http-status");
const Store = require("../models/Store");
const getTime = require("../helper/getTime");
// TODO :  Lấy toàn bộ danh sách Stores
const getAllStore = async (req, res) => {
  try {
    const storeControllers = await Store.find()
      .limit(process.env.TOTAL_RESULT_QUERY)
      .sort({ rating: -1 })
      .select({
        name: 1,
        title: 1,
        content: 1,
        price: 1,
        rating: 1,
        company: 1,
        _id: 1,
      });
    // ! trả về dữ liệu
    res.status(status.OK).json({
      status: true,
      message: "Lấy danh sách Store thành công !",
      data: storeControllers,
      total: storeControllers.length,
      time: getTime(),
    });
  } catch (error) {
    res.status(status.NOT_FOUND).json({
      status: false,
      message: "Lỗi lấy danh sách Store !",
      time: getTime(),
    });
  }
};
// TODO: Lấy Store theo ID
const getStoreForID = async (req, res) => {
  try {
    //   ! lấy ra id
    let { id } = req.params;

    let data = await Store.findById(id);
    // ! kiểm tra
    if (!data) {
      res.status(status.NOT_FOUND).json({
        status: false,
        message: "Không tìm thấy theo ID này",
        time: getTime(),
      });
    } else {
      res.status(status.OK).json({
        status: true,
        message: "Lấy Store theo ID thành công",
        data: data,
        time: getTime(),
      });
    }
  } catch (error) {
    res.status(status.NOT_FOUND).json({
      status: false,
      message: "Lỗi lấy danh sách Store theo ID !",
      time: getTime(),
    });
  }
};

// TODO: Tạo Store mới
const createStore = async (req, res) => {
  try {
    // ! lấy dữ liệu từ body
    let { name, title, content, price, rating, company } = req.body;
    // ! kiểm tra dữ liệu
    if (!name || !title || !content || !price || !rating || !company) {
      res.status(status.NOT_FOUND).json({
        status: false,
        message: "Vui lòng nhập đầy đữ liệu , sai dữ liệu hoặc thiếu !",
        time: getTime(),
      });
    } else {
      // ! tạo mới
      const newStore = new Store({
        name,
        title,
        content,
        price,
        rating,
        company,
      });
      // ! lưu vào database
      await newStore.save();
      res.status(status.CREATED).json({
        status: true,
        message: "Tạo mới Store thành công !",
        data: newStore,
        time: getTime(),
      });
    }
  } catch (error) {
    res.status(status.NOT_FOUND).json({
      status: false,
      message: "Lỗi tạo mới Store !",
      time: getTime(),
    });
  }
};
// TODO: Chỉnh sửa Store theo ID
const updateForID = async (req, res) => {
  try {
    // ! lấy id
    const { id } = req.params;
    // ! lấy dữ liệu từ body
    let { name, title, content, price, rating, company } = req.body;
    // ! kiểm tra dữ liệu
    if (!name || !title || !content || !price || !rating || !company) {
      res.status(status.NOT_FOUND).json({
        status: false,
        message: "Vui lòng nhập đầy đữ liệu , sai dữ liệu hoặc thiếu !",
        time: getTime(),
      });
    } else {
      const updateStore = await Store.findByIdAndUpdate(id, {
        name,
        title,
        content,
        price,
        rating,
        company,
      });
      res.status(status.OK).json({
        status: true,
        message: "Chỉnh sửa Store theo ID thành công !",
        data: updateStore,
        time: getTime(),
      });
    }
  } catch (error) {
    res.status(status.NOT_FOUND).json({
      status: false,
      message: "Lỗi chỉnh sửa theo ID này !",
      time: getTime(),
    });
  }
};
// TODO: Xóa Store theo ID
const deleteStoreForID = async (req, res) => {
  try {
    //   ! lấy ra ID
    let { id } = req.params;
    let id_Delete = await Store.findByIdAndDelete(id);
    // ! kiểm tra dữ liệu
    if (!id_Delete) {
      res.status(status.NOT_FOUND).json({
        status: false,
        message: "Không tìm thấy theo ID này",
        time: getTime(),
      });
    } else {
      res.status(status.OK).json({
        status: true,
        message: "Xóa Store theo ID thành công !",
        data: id_Delete,
        time: getTime(),
      });
    }
  } catch (error) {
    res.status(status.NOT_FOUND).json({
      status: false,
      message: "Lỗi xoá Store theo ID này !",
      time: getTime(),
    });
  }
};
// TODO : Tìm kiếm dữ liệu duy nhất không dựa ID
const findDataForQuery = async (req, res) => {
  try {
    const query = req.query; // lấy query từ URL

    // ! kiểm tra nếu query rỗng
    if (Object.keys(query).length === 0) {
      return res.status(status.BAD_REQUEST).json({
        status: false,
        message: "Vui lòng có ít nhất 1 dữ liệu từ query !",
        time: getTime(),
      });
    }

    // ! tìm kiếm trong DB
    const data = await Store.find(query).select({
      name: 1,
      title: 1,
      content: 1,
      price: 1,
      rating: 1,
      company: 1,
      _id: 0,
    });

    // ! kiểm tra kết quả
    if (!data || data.length === 0) {
      return res.status(status.NOT_FOUND).json({
        status: false,
        message: "Không tìm thấy dữ liệu !",
        time: getTime(),
      });
    }

    // ! trả về dữ liệu nếu có
    res.status(status.OK).json({
      status: true,
      message: "Tìm kiếm dữ liệu thành công !",
      total: data.length,
      data: data,
      time: getTime(),
    });
  } catch (error) {
    res.status(status.INTERNAL_SERVER_ERROR).json({
      status: false,
      message: "Lỗi tìm kiếm dữ liệu !",
      error: error.message,
      time: getTime(),
    });
  }
};

module.exports = {
  getAllStore,
  getStoreForID,
  createStore,
  updateForID,
  deleteStoreForID,
  findDataForQuery,
};
