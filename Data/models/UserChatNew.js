/**
 * Model UserChatNew - Quản lý thông tin user cho hệ thống chat
 * Theo dõi trạng thái online/offline và thông tin chat
 */

const mongoose = require("mongoose");

/**
 * Schema định nghĩa cấu trúc dữ liệu UserChatNew
 */
const userChatNewSchema = new mongoose.Schema(
  {
    // ID tham chiếu đến User gốc
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID là bắt buộc"],
      unique: true,
    },

    // Tên hiển thị trong chat
    name: {
      type: String,
      required: [true, "Tên là bắt buộc"],
      trim: true,
      minlength: [2, "Tên phải có ít nhất 2 ký tự"],
      maxlength: [100, "Tên không được vượt quá 100 ký tự"],
    },

    // Username duy nhất cho chat
    username: {
      type: String,
      required: [true, "Username là bắt buộc"],
      unique: true,
      lowercase: true,
      trim: true,
      minlength: [3, "Username phải có ít nhất 3 ký tự"],
      maxlength: [50, "Username không được vượt quá 50 ký tự"],
      match: [
        /^[a-zA-Z0-9_]+$/,
        "Username chỉ được chứa chữ cái, số và dấu gạch dưới",
      ],
    },

    // Tuổi
    age: {
      type: Number,
      required: [true, "Tuổi là bắt buộc"],
      min: [13, "Tuổi phải từ 13 trở lên"],
      max: [120, "Tuổi không được vượt quá 120"],
    },

    // Địa chỉ
    address: {
      type: String,
      required: [true, "Địa chỉ là bắt buộc"],
      trim: true,
      minlength: [5, "Địa chỉ phải có ít nhất 5 ký tự"],
      maxlength: [500, "Địa chỉ không được vượt quá 500 ký tự"],
    },

    // Số điện thoại
    phone: {
      type: String,
      required: [true, "Số điện thoại là bắt buộc"],
      unique: true,
      trim: true,
      match: [
        /^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/,
        "Số điện thoại không hợp lệ (định dạng Việt Nam)",
      ],
    },

    // Trạng thái online/offline
    status: {
      type: String,
      enum: {
        values: ["online", "offline", "away", "busy"],
        message: "Trạng thái không hợp lệ",
      },
      default: "offline",
    },

    // Thời gian lên online gần nhất
    lastOnlineAt: {
      type: Date,
      default: null,
    },

    // Thời gian xuống offline gần nhất
    lastOfflineAt: {
      type: Date,
      default: null,
    },

    // Thời gian tạo tài khoản chat
    timeUser: {
      type: Date,
      default: Date.now,
    },

    // Năm tạo tài khoản
    yearUser: {
      type: Number,
      default: function () {
        return new Date().getFullYear();
      },
    },

    // Avatar URL
    avatar: {
      type: String,
      trim: true,
      match: [
        /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
        "URL avatar không hợp lệ",
      ],
    },

    // Bio ngắn gọn
    bio: {
      type: String,
      maxlength: [200, "Bio không được vượt quá 200 ký tự"],
      trim: true,
    },

    // Sở thích (array of strings)
    interests: [
      {
        type: String,
        trim: true,
        maxlength: [50, "Sở thích không được vượt quá 50 ký tự"],
      },
    ],

    // Socket ID hiện tại (cho real-time tracking)
    currentSocketId: {
      type: String,
      default: null,
    },

    // Danh sách bạn bè (array of ObjectId tham chiếu UserChatNew)
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserChatNew",
      },
    ],

    // Danh sách bị chặn (array of ObjectId)
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserChatNew",
      },
    ],

    // Cài đặt chat
    chatSettings: {
      allowDirectMessages: {
        type: Boolean,
        default: true,
      },
      showOnlineStatus: {
        type: Boolean,
        default: true,
      },
      allowFriendRequests: {
        type: Boolean,
        default: true,
      },
    },

    // Thống kê chat
    chatStats: {
      totalMessages: {
        type: Number,
        default: 0,
      },
      friendsCount: {
        type: Number,
        default: 0,
      },
      lastMessageAt: {
        type: Date,
        default: null,
      },
    },
  },
  {
    // Tự động thêm createdAt và updatedAt
    timestamps: true,

    // Tùy chọn cho JSON output
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },

    // Tùy chọn cho Object output
    toObject: {
      virtuals: true,
    },
  }
);

/**
 * Virtual field: Kiểm tra user có online không
 */
userChatNewSchema.virtual("isOnline").get(function () {
  return this.status === "online" && this.currentSocketId;
});

/**
 * Virtual field: Thời gian offline (tính từ lastOnlineAt)
 */
userChatNewSchema.virtual("offlineDuration").get(function () {
  if (!this.lastOfflineAt) return null;
  return Date.now() - this.lastOfflineAt.getTime();
});

/**
 * Virtual field: Tuổi tài khoản (tính từ timeUser)
 */
userChatNewSchema.virtual("accountAge").get(function () {
  const now = new Date();
  const created = this.timeUser;
  const diffTime = Math.abs(now - created);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return "Hôm nay";
  if (diffDays < 7) return `${diffDays} ngày`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng`;

  return `${Math.floor(diffDays / 365)} năm`;
});

/**
 * Pre-save middleware: Validation và cập nhật stats
 */
userChatNewSchema.pre("save", function (next) {
  // Cập nhật friendsCount
  if (this.friends) {
    this.chatStats.friendsCount = this.friends.length;
  }

  next();
});

/**
 * Instance method: Cập nhật trạng thái online
 */
userChatNewSchema.methods.goOnline = function (socketId) {
  this.status = "online";
  this.lastOnlineAt = new Date();
  this.currentSocketId = socketId;
};

/**
 * Instance method: Cập nhật trạng thái offline
 */
userChatNewSchema.methods.goOffline = function () {
  this.status = "offline";
  this.lastOfflineAt = new Date();
  this.currentSocketId = null;
};

/**
 * Instance method: Thêm bạn bè
 */
userChatNewSchema.methods.addFriend = function (friendId) {
  if (!this.friends.includes(friendId)) {
    this.friends.push(friendId);
    this.chatStats.friendsCount = this.friends.length;
  }
};

/**
 * Instance method: Xóa bạn bè
 */
userChatNewSchema.methods.removeFriend = function (friendId) {
  const index = this.friends.indexOf(friendId);
  if (index > -1) {
    this.friends.splice(index, 1);
    this.chatStats.friendsCount = this.friends.length;
  }
};

/**
 * Instance method: Chặn user
 */
userChatNewSchema.methods.blockUser = function (userId) {
  if (!this.blockedUsers.includes(userId)) {
    this.blockedUsers.push(userId);
  }
};

/**
 * Instance method: Bỏ chặn user
 */
userChatNewSchema.methods.unblockUser = function (userId) {
  const index = this.blockedUsers.indexOf(userId);
  if (index > -1) {
    this.blockedUsers.splice(index, 1);
  }
};

/**
 * Instance method: Kiểm tra có bị chặn không
 */
userChatNewSchema.methods.isBlocked = function (userId) {
  return this.blockedUsers.includes(userId);
};

/**
 * Instance method: Kiểm tra có phải bạn bè không
 */
userChatNewSchema.methods.isFriend = function (userId) {
  return this.friends.includes(userId);
};

/**
 * Instance method: Tăng số lượng tin nhắn
 */
userChatNewSchema.methods.incrementMessageCount = function () {
  this.chatStats.totalMessages += 1;
  this.chatStats.lastMessageAt = new Date();
};

/**
 * Static method: Tìm user theo username
 */
userChatNewSchema.statics.findByUsername = function (username) {
  return this.findOne({ username: username.toLowerCase() });
};

/**
 * Static method: Lấy danh sách user online
 */
userChatNewSchema.statics.getOnlineUsers = function () {
  return this.find({
    status: "online",
    currentSocketId: { $ne: null },
  }).select("name username avatar lastOnlineAt");
};

/**
 * Static method: Tìm kiếm user theo tên hoặc username
 */
userChatNewSchema.statics.searchUsers = function (query, limit = 20) {
  return this.find({
    $or: [
      { name: { $regex: query, $options: "i" } },
      { username: { $regex: query, $options: "i" } },
    ],
    status: { $ne: "blocked" }, // Không tìm user bị chặn
  })
    .select("name username avatar status lastOnlineAt bio")
    .limit(limit);
};

/**
 * Static method: Lấy danh sách bạn bè của user
 */
userChatNewSchema.statics.getUserFriends = function (userId) {
  return this.findById(userId)
    .populate("friends", "name username avatar status lastOnlineAt")
    .select("friends");
};

/**
 * Static method: Thống kê user theo trạng thái
 */
userChatNewSchema.statics.getStatusStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  return stats.reduce(
    (acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    },
    { online: 0, offline: 0, away: 0, busy: 0 }
  );
};

/**
 * Index để tối ưu hiệu suất
 * Lưu ý: userId, username, phone đã có unique: true nên không cần định nghĩa lại index
 */
userChatNewSchema.index({ status: 1 }); // Index cho status
userChatNewSchema.index({ lastOnlineAt: -1 }); // Index cho thời gian online
userChatNewSchema.index({ name: "text", username: "text" }); // Index text cho tìm kiếm
userChatNewSchema.index({ friends: 1 }); // Index cho friends array
userChatNewSchema.index({ createdAt: -1 }); // Index cho thời gian tạo

/**
 * Export model UserChatNew
 */
module.exports = mongoose.model("UserChatNew", userChatNewSchema);
