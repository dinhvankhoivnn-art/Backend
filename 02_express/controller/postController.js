// routerPost (fix: mã hóa/giải mã tất cả các trường name, title, content, status; xử lý lỗi decrypt cho từng field/post riêng, không throw để tránh fail toàn bộ; skip field lỗi hoặc trả giá trị null/message)
const getTime = require("../helper/getTime");
const Post = require("../model/Post");
const { encryptData, decryptData } = require("../helper/crypto");

// Hàm helper để log error
const logError = (error) => {
  console.error(`[${getTime()}] Error:`, error.message || error);
};

// Helper để giải mã một field, xử lý lỗi riêng (trả về giá trị giải mã hoặc message lỗi)
const safeDecrypt = (encryptedField, iv, fieldName, postId) => {
  try {
    return decryptData(encryptedField, iv);
  } catch (decryptError) {
    logError(decryptError);
    console.warn(
      `[${getTime()}] Lỗi giải mã ${fieldName} cho post ID: ${postId}, set giá trị lỗi`
    );
    return "Lỗi giải mã dữ liệu"; // Hoặc null, tùy theo nhu cầu
  }
};

// ! lấy tất cả bài posts (giải mã tất cả fields trước khi trả về, xử lý lỗi per field/post)
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
    // Giải mã tất cả fields cho từng post, xử lý lỗi riêng (không throw, mà log và set giá trị lỗi)
    const decryptedPosts = posts.map((post) => {
      const postId = post._id;
      const decryptedName = safeDecrypt(
        post.encryptedName,
        post.ivName,
        "name",
        postId
      );
      const decryptedTitle = safeDecrypt(
        post.encryptedTitle,
        post.ivTitle,
        "title",
        postId
      );
      const decryptedContent = safeDecrypt(
        post.encryptedContent,
        post.ivContent,
        "content",
        postId
      );
      let decryptedStatus = safeDecrypt(
        post.encryptedStatus,
        post.ivStatus,
        "status",
        postId
      );

      // Parse status thành boolean nếu giải mã thành công, иначе default false
      let statusBool = false;
      if (decryptedStatus && decryptedStatus !== "Lỗi giải mã dữ liệu") {
        statusBool = decryptedStatus.toLowerCase() === "true";
      }

      return {
        ...post.toObject(),
        name: decryptedName,
        title: decryptedTitle,
        content: decryptedContent,
        status: statusBool,
        encryptedName: undefined,
        ivName: undefined,
        encryptedTitle: undefined,
        ivTitle: undefined,
        encryptedContent: undefined,
        ivContent: undefined,
        encryptedStatus: undefined,
        ivStatus: undefined,
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

// ! lấy bài posts theo id (giải mã tất cả fields trước khi trả về)
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
    const postId = postForID._id;
    const decryptedName = safeDecrypt(
      postForID.encryptedName,
      postForID.ivName,
      "name",
      postId
    );
    const decryptedTitle = safeDecrypt(
      postForID.encryptedTitle,
      postForID.ivTitle,
      "title",
      postId
    );
    const decryptedContent = safeDecrypt(
      postForID.encryptedContent,
      postForID.ivContent,
      "content",
      postId
    );
    let decryptedStatus = safeDecrypt(
      postForID.encryptedStatus,
      postForID.ivStatus,
      "status",
      postId
    );

    // Parse status thành boolean nếu giải mã thành công
    let statusBool = false;
    if (decryptedStatus && decryptedStatus !== "Lỗi giải mã dữ liệu") {
      statusBool = decryptedStatus.toLowerCase() === "true";
    } else {
      return res.status(500).json({
        status: false,
        message: "Lỗi giải mã dữ liệu",
        time: getTime(),
      });
    }

    const decryptedPost = {
      ...postForID.toObject(),
      name: decryptedName,
      title: decryptedTitle,
      content: decryptedContent,
      status: statusBool,
      encryptedName: undefined,
      ivName: undefined,
      encryptedTitle: undefined,
      ivTitle: undefined,
      encryptedContent: undefined,
      ivContent: undefined,
      encryptedStatus: undefined,
      ivStatus: undefined,
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

// ! thêm dữ liệu Post (mã hóa tất cả fields trước khi lưu)
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
    // Mã hóa từng field
    let encryptedName,
      ivName,
      encryptedTitle,
      ivTitle,
      encryptedContent,
      ivContent,
      encryptedStatus,
      ivStatus;
    try {
      console.log(`[${getTime()}] Bắt đầu mã hóa các fields...`);

      const encryptName = encryptData(name.trim());
      encryptedName = encryptName.encryptedData;
      ivName = encryptName.iv;

      const encryptTitle = encryptData(title.trim());
      encryptedTitle = encryptTitle.encryptedData;
      ivTitle = encryptTitle.iv;

      const encryptContent = encryptData(content.trim());
      encryptedContent = encryptContent.encryptedData;
      ivContent = encryptContent.iv;

      const encryptStatus = encryptData(status.toString());
      encryptedStatus = encryptStatus.encryptedData;
      ivStatus = encryptStatus.iv;

      console.log(`[${getTime()}] Mã hóa tất cả fields thành công`);
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
      encryptedName,
      ivName,
      encryptedTitle,
      ivTitle,
      encryptedContent,
      ivContent,
      encryptedStatus,
      ivStatus,
    });
    await newPost.save();
    // Giải mã để trả về (tùy chọn, nhưng để kiểm tra)
    const decryptedName = safeDecrypt(
      newPost.encryptedName,
      newPost.ivName,
      "name",
      newPost._id
    );
    const decryptedTitle = safeDecrypt(
      newPost.encryptedTitle,
      newPost.ivTitle,
      "title",
      newPost._id
    );
    const decryptedContent = safeDecrypt(
      newPost.encryptedContent,
      newPost.ivContent,
      "content",
      newPost._id
    );
    let decryptedStatus = safeDecrypt(
      newPost.encryptedStatus,
      newPost.ivStatus,
      "status",
      newPost._id
    );
    let statusBool = decryptedStatus.toLowerCase() === "true";

    const decryptedPost = {
      ...newPost.toObject(),
      name: decryptedName,
      title: decryptedTitle,
      content: decryptedContent,
      status: statusBool,
      encryptedName: undefined,
      ivName: undefined,
      encryptedTitle: undefined,
      ivTitle: undefined,
      encryptedContent: undefined,
      ivContent: undefined,
      encryptedStatus: undefined,
      ivStatus: undefined,
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

// ! cập nhật dữ liệu theo id (mã hóa fields mới trước khi cập nhật, chỉ mã hóa nếu field được cung cấp)
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
    if (name) {
      try {
        const { encryptedData: newEncryptedName, iv: newIvName } = encryptData(
          name.trim()
        );
        updateFields.encryptedName = newEncryptedName;
        updateFields.ivName = newIvName;
      } catch (encryptError) {
        logError(encryptError);
        return res.status(500).json({
          status: false,
          message: "Lỗi mã hóa name",
          time: getTime(),
        });
      }
    }
    if (title) {
      try {
        const { encryptedData: newEncryptedTitle, iv: newIvTitle } =
          encryptData(title.trim());
        updateFields.encryptedTitle = newEncryptedTitle;
        updateFields.ivTitle = newIvTitle;
      } catch (encryptError) {
        logError(encryptError);
        return res.status(500).json({
          status: false,
          message: "Lỗi mã hóa title",
          time: getTime(),
        });
      }
    }
    if (content) {
      try {
        const { encryptedData: newEncryptedContent, iv: newIvContent } =
          encryptData(content.trim());
        updateFields.encryptedContent = newEncryptedContent;
        updateFields.ivContent = newIvContent;
      } catch (encryptError) {
        logError(encryptError);
        return res.status(500).json({
          status: false,
          message: "Lỗi mã hóa content",
          time: getTime(),
        });
      }
    }
    if (status !== undefined) {
      try {
        const { encryptedData: newEncryptedStatus, iv: newIvStatus } =
          encryptData(status.toString());
        updateFields.encryptedStatus = newEncryptedStatus;
        updateFields.ivStatus = newIvStatus;
      } catch (encryptError) {
        logError(encryptError);
        return res.status(500).json({
          status: false,
          message: "Lỗi mã hóa status",
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
    // Giải mã để trả về
    const postId = updateForID._id;
    const decryptedName = safeDecrypt(
      updateForID.encryptedName,
      updateForID.ivName,
      "name",
      postId
    );
    const decryptedTitle = safeDecrypt(
      updateForID.encryptedTitle,
      updateForID.ivTitle,
      "title",
      postId
    );
    const decryptedContent = safeDecrypt(
      updateForID.encryptedContent,
      updateForID.ivContent,
      "content",
      postId
    );
    let decryptedStatus = safeDecrypt(
      updateForID.encryptedStatus,
      updateForID.ivStatus,
      "status",
      postId
    );
    let statusBool = decryptedStatus.toLowerCase() === "true";

    const decryptedPost = {
      ...updateForID.toObject(),
      name: decryptedName,
      title: decryptedTitle,
      content: decryptedContent,
      status: statusBool,
      encryptedName: undefined,
      ivName: undefined,
      encryptedTitle: undefined,
      ivTitle: undefined,
      encryptedContent: undefined,
      ivContent: undefined,
      encryptedStatus: undefined,
      ivStatus: undefined,
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

// ! xoá dữ liệu post theo ID (giữ nguyên, không cần thay đổi vì không liên quan đến mã hóa)
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
