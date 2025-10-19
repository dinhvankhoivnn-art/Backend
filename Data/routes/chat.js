/**
 * Routes cho Chat API
 * Bao gồm routes cho user chat, messages và groups
 */

const express = require("express");
const router = express.Router();

// Import controllers
const {
  registerChat,
  getChatUserById,
  updateChatUser,
  deleteChatUser,
  getAllChatUsers,
  addFriend,
  removeFriend,
  getFriends,
  searchChatUsers,
  getStatusStats,
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
} = require("../controllers/chatController");

// Import middlewares
const { authCheckUser } = require("../middlewares/authCheckUser");
const { authCheckAdmin } = require("../middlewares/authCheckAdmin");
const {
  chatSessionValidation,
  chatPrivacyProtection,
  chatRequestValidation,
} = require("../middlewares/chatSecurity");

// Middleware xác thực chat user
const chatUserAuth = [authCheckUser, chatSessionValidation];

// ========== USER CHAT ROUTES ==========

/**
 * @route POST /chat/register
 * @desc Đăng ký tài khoản chat mới
 * @access Private (User)
 */
router.post("/register", chatUserAuth, registerChat);

/**
 * @route GET /chat/user/:id
 * @desc Lấy thông tin user chat theo ID
 * @access Private (User/Admin)
 */
router.get("/user/:id", chatUserAuth, getChatUserById);

/**
 * @route PUT /chat/user/:id
 * @desc Cập nhật thông tin user chat
 * @access Private (User/Admin)
 */
router.put("/user/:id", chatUserAuth, updateChatUser);

/**
 * @route DELETE /chat/user/:id
 * @desc Xóa tài khoản chat
 * @access Private (User/Admin)
 */
router.delete("/user/:id", chatUserAuth, deleteChatUser);

/**
 * @route GET /chat/users
 * @desc Lấy danh sách tất cả user chat (cho admin)
 * @access Private (Admin)
 */
router.get("/users", [authVerifyToken, authCheckAdmin], getAllChatUsers);

/**
 * @route POST /chat/user/:id/friend/:friendId
 * @desc Thêm bạn bè
 * @access Private (User)
 */
router.post("/user/:id/friend/:friendId", chatUserAuth, addFriend);

/**
 * @route DELETE /chat/user/:id/friend/:friendId
 * @desc Xóa bạn bè
 * @access Private (User)
 */
router.delete("/user/:id/friend/:friendId", chatUserAuth, removeFriend);

/**
 * @route GET /chat/user/:id/friends
 * @desc Lấy danh sách bạn bè
 * @access Private (User/Admin)
 */
router.get("/user/:id/friends", chatUserAuth, getFriends);

/**
 * @route GET /chat/search/users
 * @desc Tìm kiếm user chat
 * @access Private (User)
 */
router.get("/search/users", chatUserAuth, searchChatUsers);

/**
 * @route GET /chat/stats/status
 * @desc Thống kê user chat theo trạng thái
 * @access Private (User)
 */
router.get("/stats/status", chatUserAuth, getStatusStats);

// ========== MESSAGE ROUTES ==========

/**
 * @route POST /chat/messages/private
 * @desc Gửi tin nhắn cá nhân
 * @access Private (User)
 */
router.post("/messages/private", chatUserAuth, sendPrivateMessage);

/**
 * @route POST /chat/messages/group
 * @desc Gửi tin nhắn nhóm
 * @access Private (User)
 */
router.post("/messages/group", chatUserAuth, sendGroupMessage);

/**
 * @route GET /chat/messages/private/:userId
 * @desc Lấy tin nhắn cá nhân với user khác
 * @access Private (User)
 */
router.get("/messages/private/:userId", chatUserAuth, getPrivateMessages);

/**
 * @route GET /chat/messages/group/:groupId
 * @desc Lấy tin nhắn trong nhóm
 * @access Private (User)
 */
router.get("/messages/group/:groupId", chatUserAuth, getGroupMessages);

/**
 * @route POST /chat/messages/:messageId/reactions
 * @desc Thêm reaction cho tin nhắn
 * @access Private (User)
 */
router.post("/messages/:messageId/reactions", chatUserAuth, addMessageReaction);

/**
 * @route DELETE /chat/messages/:messageId/reactions
 * @desc Xóa reaction khỏi tin nhắn
 * @access Private (User)
 */
router.delete(
  "/messages/:messageId/reactions",
  chatUserAuth,
  removeMessageReaction
);

/**
 * @route PUT /chat/messages/:messageId/read
 * @desc Đánh dấu tin nhắn đã đọc
 * @access Private (User)
 */
router.put("/messages/:messageId/read", chatUserAuth, markMessageAsRead);

/**
 * @route DELETE /chat/messages/:messageId
 * @desc Xóa tin nhắn
 * @access Private (User)
 */
router.delete("/messages/:messageId", chatUserAuth, deleteMessage);

/**
 * @route GET /chat/messages/search
 * @desc Tìm kiếm tin nhắn
 * @access Private (User)
 */
router.get("/messages/search", chatUserAuth, searchMessages);

// ========== GROUP ROUTES ==========

/**
 * @route POST /chat/groups
 * @desc Tạo nhóm chat mới
 * @access Private (User)
 */
router.post("/groups", chatUserAuth, createGroup);

/**
 * @route GET /chat/groups/:groupId
 * @desc Lấy thông tin nhóm
 * @access Private (User)
 */
router.get("/groups/:groupId", chatUserAuth, getGroupById);

/**
 * @route PUT /chat/groups/:groupId
 * @desc Cập nhật thông tin nhóm
 * @access Private (User - Admin only)
 */
router.put("/groups/:groupId", chatUserAuth, updateGroup);

/**
 * @route POST /chat/groups/:groupId/members
 * @desc Thêm thành viên vào nhóm
 * @access Private (User - Moderator/Admin)
 */
router.post("/groups/:groupId/members", chatUserAuth, addGroupMember);

/**
 * @route DELETE /chat/groups/:groupId/members/:userId
 * @desc Xóa thành viên khỏi nhóm
 * @access Private (User - Admin/Moderator)
 */
router.delete(
  "/groups/:groupId/members/:userId",
  chatUserAuth,
  removeGroupMember
);

/**
 * @route GET /chat/groups
 * @desc Lấy danh sách nhóm của user
 * @access Private (User)
 */
router.get("/groups", chatUserAuth, getUserGroups);

module.exports = router;
