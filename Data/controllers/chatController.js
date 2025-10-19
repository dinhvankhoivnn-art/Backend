/**
 * Chat Controller - Xử lý tất cả chức năng chat
 * Hỗ trợ chat cá nhân, nhóm và các tính năng nâng cao
 */

const Message = require("../models/Message");
const GroupChat = require("../models/GroupChat");
const UserChatNew = require("../models/UserChatNew");
const { validationResult } = require("express-validator");

/**
 * Đăng ký chat cho user mới
 * POST /chat/register
 */
const registerChat = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu đầu vào không hợp lệ",
        errors: errors.array(),
      });
    }

    const { username, avatar, status } = req.body;
    const userId = req.user.id;

    // Kiểm tra user đã tồn tại chưa
    const existingUser = await UserChatNew.findOne({
      $or: [{ userId: userId }, { username: username }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User đã tồn tại hoặc username đã được sử dụng",
      });
    }

    // Tạo user chat mới
    const newChatUser = new UserChatNew({
      userId: userId,
      username: username,
      avatar: avatar || "",
      status: status || "online",
      lastSeen: new Date(),
    });

    await newChatUser.save();

    console.log(`✅ Chat user registered: ${username}`, {
      userId: userId,
      chatUserId: newChatUser._id,
      ip: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: "Đăng ký chat thành công",
      data: {
        chatUser: {
          id: newChatUser._id,
          username: newChatUser.username,
          avatar: newChatUser.avatar,
          status: newChatUser.status,
        },
      },
    });
  } catch (error) {
    console.error("❌ Register chat error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi đăng ký chat",
    });
  }
};

/**
 * Gửi tin nhắn cá nhân
 * POST /chat/messages/private
 */
const sendPrivateMessage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu đầu vào không hợp lệ",
        errors: errors.array(),
      });
    }

    const { recipientId, content, contentType, fileUrl, fileName, fileSize } =
      req.body;
    const senderId = req.user.id;

    // Kiểm tra người nhận tồn tại
    const recipient = await UserChatNew.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: "Người nhận không tồn tại",
      });
    }

    // Tạo tin nhắn mới
    const newMessage = new Message({
      sender: senderId,
      type: "private",
      recipient: recipientId,
      recipientModel: "UserChatNew",
      content: content,
      contentType: contentType || "text",
      fileUrl: fileUrl,
      fileName: fileName,
      fileSize: fileSize,
    });

    await newMessage.save();

    // Populate thông tin để trả về
    await newMessage.populate("sender", "username avatar");
    await newMessage.populate("recipient", "username avatar");

    console.log(`✅ Private message sent: ${senderId} -> ${recipientId}`, {
      messageId: newMessage._id,
      ip: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: "Tin nhắn đã được gửi",
      data: {
        message: newMessage,
      },
    });
  } catch (error) {
    console.error("❌ Send private message error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi gửi tin nhắn",
    });
  }
};

/**
 * Gửi tin nhắn nhóm
 * POST /chat/messages/group
 */
const sendGroupMessage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu đầu vào không hợp lệ",
        errors: errors.array(),
      });
    }

    const { groupId, content, contentType, fileUrl, fileName, fileSize } =
      req.body;
    const senderId = req.user.id;

    // Kiểm tra nhóm tồn tại và user là thành viên
    const group = await GroupChat.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Nhóm không tồn tại",
      });
    }

    if (!group.members.includes(senderId)) {
      return res.status(403).json({
        success: false,
        message: "Bạn không phải là thành viên của nhóm này",
      });
    }

    // Tạo tin nhắn mới
    const newMessage = new Message({
      sender: senderId,
      type: "group",
      recipient: groupId,
      recipientModel: "GroupChat",
      content: content,
      contentType: contentType || "text",
      fileUrl: fileUrl,
      fileName: fileName,
      fileSize: fileSize,
    });

    await newMessage.save();

    // Populate thông tin để trả về
    await newMessage.populate("sender", "username avatar");
    await newMessage.populate("recipient", "name description");

    console.log(`✅ Group message sent: ${senderId} -> ${groupId}`, {
      messageId: newMessage._id,
      ip: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: "Tin nhắn nhóm đã được gửi",
      data: {
        message: newMessage,
      },
    });
  } catch (error) {
    console.error("❌ Send group message error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi gửi tin nhắn nhóm",
    });
  }
};

/**
 * Lấy tin nhắn cá nhân
 * GET /chat/messages/private/:userId
 */
const getPrivateMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const currentUserId = req.user.id;

    // Validate quyền truy cập
    if (currentUserId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xem tin nhắn này",
      });
    }

    const messages = await Message.getPrivateMessages(currentUserId, userId, {
      page: parseInt(page),
      limit: parseInt(limit),
    });

    return res.status(200).json({
      success: true,
      message: "Lấy tin nhắn thành công",
      data: {
        messages: messages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("❌ Get private messages error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy tin nhắn",
    });
  }
};

/**
 * Lấy tin nhắn nhóm
 * GET /chat/messages/group/:groupId
 */
const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const currentUserId = req.user.id;

    // Kiểm tra nhóm tồn tại và user là thành viên
    const group = await GroupChat.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Nhóm không tồn tại",
      });
    }

    if (!group.members.includes(currentUserId)) {
      return res.status(403).json({
        success: false,
        message: "Bạn không phải là thành viên của nhóm này",
      });
    }

    const messages = await Message.getGroupMessages(groupId, {
      page: parseInt(page),
      limit: parseInt(limit),
    });

    return res.status(200).json({
      success: true,
      message: "Lấy tin nhắn nhóm thành công",
      data: {
        messages: messages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("❌ Get group messages error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy tin nhắn nhóm",
    });
  }
};

/**
 * Tạo nhóm chat mới
 * POST /chat/groups
 */
const createGroup = async (req, res) => {
  try {
    const { name, description, members } = req.body;
    const creatorId = req.user.id;

    // Validate input
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Tên nhóm là bắt buộc",
      });
    }

    // Kiểm tra tên nhóm đã tồn tại chưa
    const existingGroup = await GroupChat.findOne({
      name: name.trim(),
    });

    if (existingGroup) {
      return res.status(400).json({
        success: false,
        message: "Tên nhóm đã tồn tại",
      });
    }

    // Tạo nhóm mới
    const newGroup = new GroupChat({
      name: name.trim(),
      description: description || "",
      creator: creatorId,
      members: [...members, creatorId], // Bao gồm người tạo
    });

    await newGroup.save();

    console.log(`✅ Group created: ${name}`, {
      groupId: newGroup._id,
      creatorId: creatorId,
      membersCount: newGroup.members.length,
      ip: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: "Nhóm đã được tạo thành công",
      data: {
        group: newGroup,
      },
    });
  } catch (error) {
    console.error("❌ Create group error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo nhóm",
    });
  }
};

/**
 * Lấy thông tin nhóm theo ID
 * GET /chat/groups/:groupId
 */
const getGroupById = async (req, res) => {
  try {
    const { groupId } = req.params;
    const currentUserId = req.user.id;

    const group = await GroupChat.findById(groupId)
      .populate("creator", "username avatar")
      .populate("members", "username avatar status");

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Nhóm không tồn tại",
      });
    }

    if (
      !group.members.some((member) => member._id.toString() === currentUserId)
    ) {
      return res.status(403).json({
        success: false,
        message: "Bạn không phải là thành viên của nhóm này",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lấy thông tin nhóm thành công",
      data: {
        group: group,
      },
    });
  } catch (error) {
    console.error("❌ Get group by ID error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thông tin nhóm",
    });
  }
};

/**
 * Cập nhật thông tin nhóm
 * PUT /chat/groups/:groupId
 */
const updateGroup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu đầu vào không hợp lệ",
        errors: errors.array(),
      });
    }

    const { groupId } = req.params;
    const { name, description } = req.body;
    const currentUserId = req.user.id;

    const group = await GroupChat.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Nhóm không tồn tại",
      });
    }

    if (group.creator.toString() !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: "Chỉ người tạo nhóm mới có thể cập nhật thông tin",
      });
    }

    // Kiểm tra tên nhóm mới có trùng không
    if (name && name !== group.name) {
      const existingGroup = await GroupChat.findOne({
        name: name.trim(),
        _id: { $ne: groupId },
      });

      if (existingGroup) {
        return res.status(400).json({
          success: false,
          message: "Tên nhóm đã tồn tại",
        });
      }
    }

    // Cập nhật thông tin
    if (name) group.name = name.trim();
    if (description !== undefined) group.description = description;

    await group.save();

    console.log(`✅ Group updated: ${group.name}`, {
      groupId: groupId,
      updaterId: currentUserId,
      ip: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: "Nhóm đã được cập nhật thành công",
      data: {
        group: group,
      },
    });
  } catch (error) {
    console.error("❌ Update group error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật nhóm",
    });
  }
};

/**
 * Thêm thành viên vào nhóm
 * POST /chat/groups/:groupId/members
 */
const addGroupMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;
    const currentUserId = req.user.id;

    const group = await GroupChat.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Nhóm không tồn tại",
      });
    }

    if (group.creator.toString() !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: "Chỉ người tạo nhóm mới có thể thêm thành viên",
      });
    }

    // Kiểm tra user tồn tại
    const userToAdd = await UserChatNew.findById(userId);
    if (!userToAdd) {
      return res.status(404).json({
        success: false,
        message: "User không tồn tại",
      });
    }

    // Kiểm tra user đã là thành viên chưa
    if (group.members.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: "User đã là thành viên của nhóm",
      });
    }

    // Thêm thành viên
    group.members.push(userId);
    await group.save();

    console.log(`✅ Member added to group: ${group.name}`, {
      groupId: groupId,
      addedUserId: userId,
      addedBy: currentUserId,
      ip: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: "Thành viên đã được thêm vào nhóm",
      data: {
        group: group,
      },
    });
  } catch (error) {
    console.error("❌ Add group member error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi thêm thành viên",
    });
  }
};

/**
 * Xóa thành viên khỏi nhóm
 * DELETE /chat/groups/:groupId/members/:userId
 */
const removeGroupMember = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const currentUserId = req.user.id;

    const group = await GroupChat.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Nhóm không tồn tại",
      });
    }

    if (group.creator.toString() !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: "Chỉ người tạo nhóm mới có thể xóa thành viên",
      });
    }

    // Không cho phép xóa người tạo khỏi nhóm
    if (userId === group.creator.toString()) {
      return res.status(400).json({
        success: false,
        message: "Không thể xóa người tạo khỏi nhóm",
      });
    }

    // Kiểm tra user có trong nhóm không
    if (!group.members.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: "User không phải là thành viên của nhóm",
      });
    }

    // Xóa thành viên
    group.members = group.members.filter(
      (member) => member.toString() !== userId
    );
    await group.save();

    console.log(`✅ Member removed from group: ${group.name}`, {
      groupId: groupId,
      removedUserId: userId,
      removedBy: currentUserId,
      ip: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: "Thành viên đã được xóa khỏi nhóm",
      data: {
        group: group,
      },
    });
  } catch (error) {
    console.error("❌ Remove group member error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa thành viên",
    });
  }
};

/**
 * Lấy danh sách nhóm của user
 * GET /chat/groups
 */
const getUserGroups = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const groups = await GroupChat.find({
      members: currentUserId,
    })
      .populate("creator", "username avatar")
      .populate("members", "username avatar status")
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách nhóm thành công",
      data: {
        groups: groups,
      },
    });
  } catch (error) {
    console.error("❌ Get user groups error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách nhóm",
    });
  }
};

/**
 * Thêm reaction vào tin nhắn
 * POST /chat/messages/:messageId/reactions
 */
const addMessageReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const currentUserId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Tin nhắn không tồn tại",
      });
    }

    // Kiểm tra quyền truy cập tin nhắn
    if (message.type === "private") {
      if (
        message.sender.toString() !== currentUserId &&
        message.recipient.toString() !== currentUserId
      ) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền truy cập tin nhắn này",
        });
      }
    } else if (message.type === "group") {
      const group = await GroupChat.findById(message.recipient);
      if (!group || !group.members.includes(currentUserId)) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền truy cập tin nhắn này",
        });
      }
    }

    const result = message.addReaction(currentUserId, emoji);
    await message.save();

    console.log(`✅ Reaction ${result}: ${emoji} on message ${messageId}`, {
      userId: currentUserId,
      ip: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: `Reaction đã được ${result}`,
      data: {
        message: message,
      },
    });
  } catch (error) {
    console.error("❌ Add message reaction error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi thêm reaction",
    });
  }
};

/**
 * Xóa reaction khỏi tin nhắn
 * DELETE /chat/messages/:messageId/reactions
 */
const removeMessageReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Tin nhắn không tồn tại",
      });
    }

    message.removeReaction(currentUserId);
    await message.save();

    console.log(`✅ Reaction removed from message ${messageId}`, {
      userId: currentUserId,
      ip: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: "Reaction đã được xóa",
      data: {
        message: message,
      },
    });
  } catch (error) {
    console.error("❌ Remove message reaction error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa reaction",
    });
  }
};

/**
 * Đánh dấu tin nhắn đã đọc
 * PUT /chat/messages/:messageId/read
 */
const markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Tin nhắn không tồn tại",
      });
    }

    // Chỉ đánh dấu đã đọc cho tin nhắn cá nhân
    if (message.type === "private") {
      message.markAsRead(currentUserId);
      await message.save();

      console.log(`✅ Message marked as read: ${messageId}`, {
        userId: currentUserId,
        ip: req.ip,
      });

      return res.status(200).json({
        success: true,
        message: "Tin nhắn đã được đánh dấu đã đọc",
        data: {
          message: message,
        },
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể đánh dấu đã đọc cho tin nhắn cá nhân",
      });
    }
  } catch (error) {
    console.error("❌ Mark message as read error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi đánh dấu tin nhắn",
    });
  }
};

/**
 * Xóa tin nhắn (soft delete)
 * DELETE /chat/messages/:messageId
 */
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Tin nhắn không tồn tại",
      });
    }

    // Chỉ người gửi mới có thể xóa tin nhắn
    if (message.sender.toString() !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: "Chỉ người gửi mới có thể xóa tin nhắn",
      });
    }

    message.softDelete(currentUserId);
    await message.save();

    console.log(`✅ Message deleted: ${messageId}`, {
      userId: currentUserId,
      ip: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: "Tin nhắn đã được xóa",
    });
  } catch (error) {
    console.error("❌ Delete message error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa tin nhắn",
    });
  }
};

/**
 * Tìm kiếm tin nhắn
 * GET /chat/messages/search
 */
const searchMessages = async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    const currentUserId = req.user.id;

    if (!q || !q.trim()) {
      return res.status(400).json({
        success: false,
        message: "Từ khóa tìm kiếm là bắt buộc",
      });
    }

    const messages = await Message.searchMessages(q.trim(), currentUserId, {
      limit: parseInt(limit),
    });

    return res.status(200).json({
      success: true,
      message: "Tìm kiếm tin nhắn thành công",
      data: {
        messages: messages,
        query: q.trim(),
      },
    });
  } catch (error) {
    console.error("❌ Search messages error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi tìm kiếm tin nhắn",
    });
  }
};

/**
 * Lấy thông tin user chat theo ID
 * GET /chat/user/:id
 */
const getChatUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await UserChatNew.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User không tồn tại",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lấy thông tin user thành công",
      data: {
        user: user,
      },
    });
  } catch (error) {
    console.error("❌ Get chat user by ID error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thông tin user",
    });
  }
};

/**
 * Cập nhật thông tin user chat
 * PUT /chat/user/:id
 */
const updateChatUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu đầu vào không hợp lệ",
        errors: errors.array(),
      });
    }

    const { id } = req.params;
    const { username, avatar, status } = req.body;
    const currentUserId = req.user.id;

    const user = await UserChatNew.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User không tồn tại",
      });
    }

    // Chỉ chính user đó hoặc admin mới có thể cập nhật
    if (user.userId !== currentUserId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền cập nhật thông tin này",
      });
    }

    // Kiểm tra username trùng lặp
    if (username && username !== user.username) {
      const existingUser = await UserChatNew.findOne({
        username: username,
        _id: { $ne: id },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Username đã được sử dụng",
        });
      }
    }

    // Cập nhật thông tin
    if (username) user.username = username;
    if (avatar !== undefined) user.avatar = avatar;
    if (status) user.status = status;
    user.lastSeen = new Date();

    await user.save();

    console.log(`✅ Chat user updated: ${user.username}`, {
      userId: id,
      updaterId: currentUserId,
      ip: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: "Thông tin user đã được cập nhật",
      data: {
        user: user,
      },
    });
  } catch (error) {
    console.error("❌ Update chat user error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật thông tin user",
    });
  }
};

/**
 * Xóa user chat (chỉ admin)
 * DELETE /chat/user/:id
 */
const deleteChatUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Chỉ admin mới có thể xóa user chat
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Chỉ admin mới có thể xóa user chat",
      });
    }

    const user = await UserChatNew.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User không tồn tại",
      });
    }

    await UserChatNew.findByIdAndDelete(id);

    console.log(`✅ Chat user deleted: ${user.username}`, {
      deletedUserId: id,
      deletedBy: req.user.id,
      ip: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: "User chat đã được xóa",
    });
  } catch (error) {
    console.error("❌ Delete chat user error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa user chat",
    });
  }
};

/**
 * Thêm bạn bè
 * POST /chat/user/:id/friend/:friendId
 */
const addFriend = async (req, res) => {
  try {
    const { id, friendId } = req.params;
    const currentUserId = req.user.id;

    // Chỉ chính user đó mới có thể thêm bạn bè
    if (id !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: "Bạn chỉ có thể thêm bạn bè cho chính mình",
      });
    }

    const user = await UserChatNew.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User không tồn tại",
      });
    }

    const friend = await UserChatNew.findById(friendId);
    if (!friend) {
      return res.status(404).json({
        success: false,
        message: "Bạn bè không tồn tại",
      });
    }

    // Kiểm tra đã là bạn bè chưa
    if (user.friends.includes(friendId)) {
      return res.status(400).json({
        success: false,
        message: "Đã là bạn bè",
      });
    }

    // Thêm bạn bè
    user.friends.push(friendId);
    await user.save();

    console.log(`✅ Friend added: ${id} <-> ${friendId}`, {
      userId: currentUserId,
      ip: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: "Đã thêm bạn bè thành công",
      data: {
        user: user,
      },
    });
  } catch (error) {
    console.error("❌ Add friend error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi thêm bạn bè",
    });
  }
};

/**
 * Xóa bạn bè
 * DELETE /chat/user/:id/friend/:friendId
 */
const removeFriend = async (req, res) => {
  try {
    const { id, friendId } = req.params;
    const currentUserId = req.user.id;

    // Chỉ chính user đó mới có thể xóa bạn bè
    if (id !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: "Bạn chỉ có thể xóa bạn bè của chính mình",
      });
    }

    const user = await UserChatNew.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User không tồn tại",
      });
    }

    // Kiểm tra có phải bạn bè không
    if (!user.friends.includes(friendId)) {
      return res.status(400).json({
        success: false,
        message: "Không phải bạn bè",
      });
    }

    // Xóa bạn bè
    user.friends = user.friends.filter(
      (friend) => friend.toString() !== friendId
    );
    await user.save();

    console.log(`✅ Friend removed: ${id} - ${friendId}`, {
      userId: currentUserId,
      ip: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: "Đã xóa bạn bè thành công",
      data: {
        user: user,
      },
    });
  } catch (error) {
    console.error("❌ Remove friend error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa bạn bè",
    });
  }
};

/**
 * Lấy danh sách bạn bè
 * GET /chat/user/:id/friends
 */
const getFriends = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id;

    const user = await UserChatNew.findById(id).populate(
      "friends",
      "username avatar status"
    );
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User không tồn tại",
      });
    }

    // Kiểm tra quyền truy cập
    if (id !== currentUserId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xem danh sách bạn bè này",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách bạn bè thành công",
      data: {
        friends: user.friends,
      },
    });
  } catch (error) {
    console.error("❌ Get friends error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách bạn bè",
    });
  }
};

/**
 * Tìm kiếm user chat
 * GET /chat/search
 */
const searchChatUsers = async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q || !q.trim()) {
      return res.status(400).json({
        success: false,
        message: "Từ khóa tìm kiếm là bắt buộc",
      });
    }

    const users = await UserChatNew.find({
      username: { $regex: q.trim(), $options: "i" },
    })
      .select("username avatar status lastSeen")
      .limit(parseInt(limit));

    return res.status(200).json({
      success: true,
      message: "Tìm kiếm user thành công",
      data: {
        users: users,
        query: q.trim(),
      },
    });
  } catch (error) {
    console.error("❌ Search chat users error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi tìm kiếm user",
    });
  }
};

/**
 * Lấy thống kê trạng thái
 * GET /chat/stats/status
 */
const getStatusStats = async (req, res) => {
  try {
    // Chỉ admin mới có thể xem thống kê
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Chỉ admin mới có thể xem thống kê",
      });
    }

    const stats = await UserChatNew.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const totalUsers = await UserChatNew.countDocuments();
    const onlineUsers = await UserChatNew.countDocuments({ status: "online" });

    return res.status(200).json({
      success: true,
      message: "Lấy thống kê thành công",
      data: {
        totalUsers: totalUsers,
        onlineUsers: onlineUsers,
        statusStats: stats,
      },
    });
  } catch (error) {
    console.error("❌ Get status stats error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thống kê",
    });
  }
};

/**
 * Lấy tất cả user chat (chỉ admin)
 * GET /chat/users
 */
const getAllChatUsers = async (req, res) => {
  try {
    // Chỉ admin mới có thể xem tất cả user
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Chỉ admin mới có thể xem tất cả user chat",
      });
    }

    const { page = 1, limit = 50 } = req.query;

    const users = await UserChatNew.find({})
      .select("-__v")
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const totalUsers = await UserChatNew.countDocuments();

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách user chat thành công",
      data: {
        users: users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalUsers,
          pages: Math.ceil(totalUsers / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("❌ Get all chat users error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách user chat",
    });
  }
};

module.exports = {
  registerChat,
  sendPrivateMessage,
  sendGroupMessage,
  getPrivateMessages,
  getGroupMessages,
  createGroup,
  getGroupById,
  updateGroup,
  addGroupMember,
  removeGroupMember,
  getUserGroups,
  addMessageReaction,
  removeMessageReaction,
  markMessageAsRead,
  deleteMessage,
  searchMessages,
  getChatUserById,
  updateChatUser,
  deleteChatUser,
  addFriend,
  removeFriend,
  getFriends,
  searchChatUsers,
  getStatusStats,
  getAllChatUsers,
};
