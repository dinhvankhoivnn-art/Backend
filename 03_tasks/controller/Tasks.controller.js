// ! ACRUD => ALL , CREATE , READ , UPDATE , DELETE

const { default: status } = require("http-status");
const getTime = require("../helper/getTime");
const Tasks = require("../models/Tasks");

// ? ALL

const getAllTasks = async (req, res) => {
  try {
    // ! lấy danh sách tasks
    let tasks = await Tasks.find({});
    res.status(status.OK).json({
      status: true,
      message: "Lấy danh sách tasks thành công",
      data: tasks,
      length: tasks.length,
      time: getTime(),
    });
  } catch (error) {
    res.status(status.NOT_FOUND).json({
      status: false,
      message: "Lỗi lấy danh sách tasks",
      time: getTime(),
    });
  }
};
// ? CREATE

const createTasks = async (req, res) => {
  try {
    // ! lấy dữ liệu từ req.body
    let { name, completed } = req.body;
    console.log({ name, completed });
    // ! kiểm tra dữ liệu
    if (!name || !completed) {
      res.status(status.BAD_REQUEST).json({
        status: false,
        message: "Dữ liệu không hợp lệ",
        time: getTime(),
      });
    } else {
      // ! tạo tasks
      let tasks = await Tasks.create({
        name,
        completed,
      });
      res.status(status.OK).json({
        status: true,
        message: "Tạo tasks thành công",
        data: tasks,
        time: getTime(),
      });
    }
  } catch (error) {
    res.status(status.NOT_MODIFIED).json({
      status: false,
      message: "Lỗi tạo tasks",
      time: getTime(),
    });
  }
};

// ? READ
const getTasksForID = async (req, res) => {
  try {
    // ! lấy id
    let { id } = req.params;
    let taskForID = await Tasks.findById(id);
    // ! kiểm tra điều kiện
    if (!taskForID) {
      res.status(status.NOT_FOUND).json({
        status: false,
        message: "Không tìm thấy tasks theo ID",
        time: getTime(),
      });
    } else {
      res.status(status.OK).json({
        status: true,
        message: "Lấy tasks theo ID thành công",
        data: taskForID,
        time: getTime(),
      });
    }
  } catch (error) {
    res.status(status.NOT_FOUND).json({
      status: false,
      message: "Lỗi lấy tasks theo ID",
      time: getTime(),
    });
  }
};
// ? UPDATED
const updatedTaskForID = async (req, res) => {
  try {
    // ! lấy id
    let { id } = req.params;
    console.log({ id });
    // ! lấy dữ liệu từ req.body
    let { name, completed } = req.body;
    // ! kiểm tra dữ liệu
    if (!name || !completed) {
      res.status(status.BAD_REQUEST).json({
        status: false,
        message: "Dữ liệu không hợp lệ hoặc sai dữ liệu !",
        time: getTime(),
      });
    } else {
      let taskForID = await Tasks.findByIdAndUpdate(id, {
        name,
        completed,
      });
      res.status(status.OK).json({
        status: true,
        message: " Cập nhật dữ liệu thành công",
        data: taskForID,
        time: getTime(),
      });
    }
  } catch (error) {
    res.status(status.NOT_FOUND).json({
      status: false,
      message: "Lỗi không tìm thấy ID của task",
      time: getTime(),
    });
  }
};
// ? DELETE

const deleteTaskForID = async (req, res) => {
  try {
    // ! lấy id
    let { id } = req.params;
    let deleteForID = await Tasks.findByIdAndDelete(id);
    // ! kiểm tra điều kiện
    if (!deleteForID) {
      res.status(status.NOT_FOUND).json({
        status: false,
        message: "Không tìm thấy tasks theo ID",
        time: getTime(),
      });
    } else {
      res.status(status.OK).json({
        status: true,
        message: "Xóa tasks thành công",
        time: getTime(),
      });
    }
  } catch (error) {
    res.status(status.NOT_FOUND).json({
      status: false,
      message: "Lỗi không tìm thấy ID của task",
      time: getTime(),
    });
  }
};
module.exports = {
  getAllTasks,
  createTasks,
  getTasksForID,
  updatedTaskForID,
  deleteTaskForID,
};
