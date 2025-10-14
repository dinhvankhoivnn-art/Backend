const blogArray = require("../data/list_data");
const getTime = require("../helper/getTime");

// ! lấy toàn bộ danh sách
/**
 * Function to retrieve all blog posts
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllBlog = async (req, res) => {
  try {
    // ! lấy ra dữ liệu
    let data = blogArray;
    res.status(200).json({
      status: true,
      message: "Danh sách blog",
      data: data,
      user: req.user,
      timeYear: req.timeYear,
      time: getTime(),
    });
  } catch (error) {
    res.status(403).json({
      message: "Lỗi lấy danh sách blog",
      error: error,
      time: getTime(),
    });
  }
};

// ! lấy theo id
const getBlogForID = async (req, res) => {
  try {
    // ! lấy id và parse thành number
    let id = parseInt(req.params.id, 10);

    // ! kiểm tra id valid
    if (isNaN(id) || id < 1) {
      return res.status(403).json({
        status: false,
        message: "ID không hợp lệ (phải là số nguyên dương)",
        time: getTime(),
      });
    }

    let index = blogArray.findIndex((item) => item.id === id);
    // ! kiểm tra điều kiện
    if (index === -1) {
      res.status(403).json({
        status: false,
        message: "Không tìm thấy blog theo id",
        time: getTime(),
      });
    } else {
      res.status(200).json({
        status: true,
        message: "Blog theo id",
        data: blogArray[index],
        time: getTime(),
      });
    }
  } catch (error) {
    res.status(403).json({
      status: false,
      message: "Lỗi lấy blog theo id",
      error: error,
      time: getTime(),
    });
  }
};

// ! thêm dữ liệu
/**
 * Function to add a new blog post
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @description
 * This function takes the request body and adds a new blog post to the blogArray
 * If the required fields are not provided, it will return a 403 status with a message
 * If the addition is successful, it will return a 200 status with a message and the updated blogArray
 */
const blogPost = async (req, res) => {
  try {
    // !  lấy dữ liệu
    const { name, title, content, status } = req.body;
    // ! kiểm tra điều kiện
    if (!name || !title || !content || !status) {
      res.status(403).json({
        status: false,
        message: "Vui lòng nhập đầy đủ thông tin",
        time: getTime(),
      });
    } else {
      blogArray.push({
        id: blogArray.length + 1,
        name: name,
        title: title,
        content: content,
        status: status,
      });
      res.status(200).json({
        status: true,
        message: "Thêm blog thành công",
        length: blogArray.length,
        data: blogArray,
        time: getTime(),
      });
    }
  } catch (error) {
    res.status(403).json({
      status: false,
      message: "Lỗi thêm blog",
      error: error,
      time: getTime(),
    });
  }
};

// ! sửa dữ liệu theo id
/**
 * Function to edit a blog post by its id
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const editBlogForID = async (req, res) => {
  try {
    // ! lấy id và parse thành number
    let id = parseInt(req.params.id, 10);
    console.log("🚀 ~ editBlogForID ~ id:", typeof id);
    let checkerID = req.params.id;
    console.log("🚀 ~ editBlogForID ~ checkerID:", typeof checkerID);

    // ! kiểm tra id valid
    if (isNaN(id) || id < 1) {
      return res.status(403).json({
        status: false,
        message: "ID không hợp lệ (phải là số nguyên dương)",
        time: getTime(),
      });
    }

    // ! lấy dữ liệu từ body
    const { name, title, content, status } = req.body;
    // ! kiểm tra điều kiện body
    if (!name || !title || !content || !status) {
      res.status(403).json({
        status: false,
        message: "Vui lòng nhập đầy đủ thông tin",
        time: getTime(),
      });
    } else {
      let index = blogArray.findIndex((item) => item.id === id);
      // ! kiểm tra điều kiện
      if (index === -1) {
        res.status(403).json({
          status: false,
          message: "Không tìm thấy blog theo id",
          time: getTime(),
        });
      } else {
        // ! cập nhật dữ liệu
        blogArray[index].name = name;
        blogArray[index].title = title;
        blogArray[index].content = content;
        blogArray[index].status = status;
        res.status(200).json({
          status: true,
          message: "Sửa blog theo id",
          data: blogArray[index],
          time: getTime(),
        });
      }
    }
  } catch (error) {
    res.status(403).json({
      status: false,
      message: "Lỗi sửa blog theo id",
      error: error,
      time: getTime(),
    });
  }
};

/**
 * Function to delete a blog post by its id
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @description
 * This function takes the request parameter id and deletes a blog post from the blogArray
 * If the id is not valid, it will return a 403 status with a message
 * If the deletion is successful, it will return a 200 status with a message
 */
const deleteForID = async (req, res) => {
  try {
    // ! get id from request parameter and parse to number
    const id = parseInt(req.params.id, 10);

    // ! check if id is valid (positive integer)
    if (isNaN(id) || id < 1) {
      return res.status(403).json({
        status: false,
        message: "ID is not valid (must be a positive integer)",
        time: getTime(),
      });
    }

    // ! find the index of the blog post with the given id
    const index = blogArray.findIndex((item) => item.id === id);

    // ! check if the blog post is found
    if (index === -1) {
      res.status(403).json({
        status: false,
        message: "Blog post not found with the given id",
        time: getTime(),
      });
    } else {
      // ! delete the blog post from the blogArray
      blogArray.splice(index, 1);
      res.status(200).json({
        status: true,
        message: "Deleted blog post successfully",
        time: getTime(),
      });
    }
  } catch (error) {
    res.status(403).json({
      status: false,
      message: "Error deleting blog post",
      error: error,
      time: getTime(),
    });
  }
};

module.exports = {
  getAllBlog,
  getBlogForID,
  blogPost,
  editBlogForID,
  deleteForID,
};
