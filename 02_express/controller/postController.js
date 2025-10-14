// routerPost (fix getAllPosts: xử lý lỗi decrypt cho từng post riêng, không throw để tránh fail toàn bộ; skip post lỗi hoặc trả content null)
const getTime = require("../helper/getTime");
const Post = require("../model/Post");
const { encryptData, decryptData } = require("../helper/crypto");

// Hàm helper để log error
const logError = (error) => {
  console.error(`[${getTime()}] Error:`, error.message || error);
};

// ! lấy tất cả bài posts (giải mã content trước khi trả về, xử lý lỗi per post)
const getAllPosts = async (req, res) => {
  try {
    let posts = await Post.find();
    if (!posts || posts.length === 0) {
      return res.status(200).json({
        status: true,
        message: "Không có bài posts nào",
        length: 0,
        data: [],
        time: getTime(),
      });
    }
    // Giải mã content cho từng post, xử lý lỗi decrypt riêng (không throw, mà log và set content lỗi)
    const decryptedPosts = posts.map((post) => {
      let decryptedContent = null; // Default nếu lỗi
      try {
        decryptedContent = decryptData(post.encryptedContent, post.iv);
      } catch (decryptError) {
        logError(decryptError);
        console.warn(
          `[${getTime()}] Lỗi giải mã content cho post ID: ${
            post._id
          }, bỏ qua hoặc set null`
        );
        // Có thể return null hoặc giữ object với content: 'Decryption failed'
      }
      return {
        ...post.toObject(),
        content: decryptedContent || "Lỗi giải mã nội dung", // Trả về message lỗi thay vì crash
        encryptedContent: undefined,
        iv: undefined,
      };
    });
    res.status(200).json({
      status: true,
      message: "Danh sách bài posts",
      length: decryptedPosts.length,
      data: decryptedPosts,
      time: getTime(),
    });
  } catch (error) {
    logError(error);
    res.status(500).json({
      status: false,
      message: "Lỗi lấy dữ liệu posts: " + (error.message || "Unknown error"),
      time: getTime(),
    });
  }
};

// Các hàm khác giữ nguyên (getPostForID, addPost, getPostAndUpdateForID, findPostForIDAndDelete)
// ! lấy bài posts theo id (giải mã content trước khi trả về)
const getPostForID = async (req, res) => {
  try {
    let { id } = req.params;
    if (!id) {
      return res.status(400).json({
        status: false,
        message: "Thiếu ID trong params",
        time: getTime(),
      });
    }
    let postForID = await Post.findById(id);
    if (!postForID) {
      return res.status(404).json({
        status: false,
        message: "Không tìm thấy dữ liệu posts theo id !",
        time: getTime(),
      });
    }
    let decryptedContent;
    try {
      decryptedContent = decryptData(postForID.encryptedContent, postForID.iv);
    } catch (decryptError) {
      logError(decryptError);
      return res.status(500).json({
        status: false,
        message: "Lỗi giải mã dữ liệu",
        time: getTime(),
      });
    }
    const decryptedPost = {
      ...postForID.toObject(),
      content: decryptedContent,
      encryptedContent: undefined,
      iv: undefined,
    };
    res.status(200).json({
      status: true,
      message: "Bài Post lấy thành công !",
      data: decryptedPost,
      time: getTime(),
    });
  } catch (error) {
    logError(error);
    res.status(500).json({
      status: false,
      message:
        "Lỗi lấy dữ liệu posts theo id: " + (error.message || "Unknown error"),
      time: getTime(),
    });
  }
};

// ! thêm dữ liệu Post (mã hóa content trước khi lưu)
const addPost = async (req, res) => {
  try {
    let { name, title, content, status } = req.body;
    if (
      !name ||
      !title ||
      !content ||
      status === undefined ||
      name.trim() === "" ||
      title.trim() === "" ||
      content.trim() === ""
    ) {
      return res.status(400).json({
        status: false,
        message: "Vui lòng nhập đầy đủ thông tin hợp lệ",
        time: getTime(),
      });
    }
    let iv, encryptedContent;
    try {
      console.log(`[${getTime()}] Bắt đầu mã hóa content...`);
      const encryptResult = encryptData(content.trim());
      iv = encryptResult.iv;
      encryptedContent = encryptResult.encryptedData;
      console.log(
        `[${getTime()}] Mã hóa thành công, IV length: ${
          iv.length
        }, Encrypted length: ${encryptedContent.length}`
      );
    } catch (encryptError) {
      logError(encryptError);
      return res.status(500).json({
        status: false,
        message:
          "Lỗi mã hóa dữ liệu: " + (encryptError.message || "Unknown error"),
        time: getTime(),
      });
    }
    let newPost = new Post({
      name: name.trim(),
      title: title.trim(),
      encryptedContent: encryptedContent,
      iv: iv,
      status: status,
    });
    await newPost.save();
    let decryptedContent;
    try {
      decryptedContent = decryptData(newPost.encryptedContent, newPost.iv);
    } catch (decryptError) {
      logError(decryptError);
    }
    const decryptedPost = {
      ...newPost.toObject(),
      content: decryptedContent || "(Lỗi giải mã tạm thời)",
      encryptedContent: undefined,
      iv: undefined,
    };
    res.status(201).json({
      status: true,
      message: "Thêm dữ liệu Post thành công !",
      data: decryptedPost,
      time: getTime(),
    });
  } catch (error) {
    logError(error);
    res.status(500).json({
      status: false,
      message: "Lỗi thêm dữ liệu posts: " + (error.message || "Unknown error"),
      time: getTime(),
    });
  }
};

// ! cập nhật dữ liệu theo id (mã hóa content mới trước khi cập nhật)
const getPostAndUpdateForID = async (req, res) => {
  try {
    let { id } = req.params;
    let { name, title, content, status } = req.body;
    if (!id) {
      return res.status(400).json({
        status: false,
        message: "Thiếu ID",
        time: getTime(),
      });
    }
    if (
      (name && name.trim() === "") ||
      (title && title.trim() === "") ||
      (content && content.trim() === "")
    ) {
      return res.status(400).json({
        status: false,
        message: "Dữ liệu cập nhật không hợp lệ",
        time: getTime(),
      });
    }
    const updateFields = {};
    if (name) updateFields.name = name.trim();
    if (title) updateFields.title = title.trim();
    if (status !== undefined) updateFields.status = status;

    if (content) {
      try {
        console.log(`[${getTime()}] Bắt đầu mã hóa content cập nhật...`);
        const { iv: newIv, encryptedData: newEncryptedContent } = encryptData(
          content.trim()
        );
        updateFields.encryptedContent = newEncryptedContent;
        updateFields.iv = newIv;
        console.log(`[${getTime()}] Mã hóa cập nhật thành công`);
      } catch (encryptError) {
        logError(encryptError);
        return res.status(500).json({
          status: false,
          message:
            "Lỗi mã hóa dữ liệu cập nhật: " +
            (encryptError.message || "Unknown error"),
          time: getTime(),
        });
      }
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        status: false,
        message: "Không có dữ liệu để cập nhật",
        time: getTime(),
      });
    }

    let updateForID = await Post.findByIdAndUpdate(id, updateFields, {
      new: true,
      runValidators: true,
    });
    if (!updateForID) {
      return res.status(404).json({
        status: false,
        message: "Không tìm thấy dữ liệu posts theo id !",
        time: getTime(),
      });
    }
    let decryptedContent;
    try {
      decryptedContent = decryptData(
        updateForID.encryptedContent,
        updateForID.iv
      );
    } catch (decryptError) {
      logError(decryptError);
    }
    const decryptedPost = {
      ...updateForID.toObject(),
      content: decryptedContent || "(Lỗi giải mã tạm thời)",
      encryptedContent: undefined,
      iv: undefined,
    };
    res.status(200).json({
      status: true,
      message: "Cập nhật dữ liệu Post thành công !",
      data: decryptedPost,
      time: getTime(),
    });
  } catch (error) {
    logError(error);
    res.status(500).json({
      status: false,
      message:
        "Lỗi cập nhật dữ liệu posts theo ID: " +
        (error.message || "Unknown error"),
      time: getTime(),
    });
  }
};

// ! xoá dữ liệu post theo ID
const findPostForIDAndDelete = async (req, res) => {
  try {
    let { id } = req.params;
    if (!id) {
      return res.status(400).json({
        status: false,
        message: "Thiếu ID",
        time: getTime(),
      });
    }
    let deletePost = await Post.findByIdAndDelete(id);
    if (!deletePost) {
      return res.status(404).json({
        status: false,
        message: "Không tìm thấy dữ liệu posts theo id !",
        time: getTime(),
      });
    }
    res.status(200).json({
      status: true,
      message: "Xoá thành công !",
      data: { deletedId: id },
      time: getTime(),
    });
  } catch (error) {
    logError(error);
    res.status(500).json({
      status: false,
      message:
        "Lỗi xoá dữ liệu posts của ID này: " +
        (error.message || "Unknown error"),
      time: getTime(),
    });
  }
};

module.exports = {
  getAllPosts,
  getPostForID,
  addPost,
  getPostAndUpdateForID,
  findPostForIDAndDelete,
};
