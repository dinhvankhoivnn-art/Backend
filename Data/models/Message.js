/**
 * Model Message - Quản lý tin nhắn chat
 * Hỗ trợ cả tin nhắn cá nhân và nhóm
 */

const mongoose = require("mongoose");

/**
 * Schema định nghĩa cấu trúc dữ liệu Message
 */
const messageSchema = new mongoose.Schema(
  {
    // ID người gửi (tham chiếu UserChatNew)
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserChatNew",
      required: [true, "Người gửi là bắt buộc"],
    },

    // Loại tin nhắn: "private" hoặc "group"
    type: {
      type: String,
      enum: {
        values: ["private", "group"],
        message: "Loại tin nhắn không hợp lệ",
      },
      required: [true, "Loại tin nhắn là bắt buộc"],
    },

    // ID nhận tin nhắn (UserChatNew cho private, GroupChat cho group)
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Người nhận là bắt buộc"],
      refPath: "recipientModel", // Dynamic reference
    },

    // Model của recipient ("UserChatNew" hoặc "GroupChat")
    recipientModel: {
      type: String,
      required: true,
      enum: ["UserChatNew", "GroupChat"],
    },

    // Nội dung tin nhắn
    content: {
      type: String,
      required: [true, "Nội dung tin nhắn là bắt buộc"],
      maxlength: [2000, "Nội dung tin nhắn không được vượt quá 2000 ký tự"],
      trim: true,
    },

    // Loại nội dung: "text", "image", "file", "emoji"
    contentType: {
      type: String,
      enum: {
        values: ["text", "image", "file", "emoji"],
        message: "Loại nội dung không hợp lệ",
      },
      default: "text",
    },

    // URL file nếu có (cho image/file)
    fileUrl: {
      type: String,
      trim: true,
      match: [
        /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
        "URL file không hợp lệ",
      ],
    },

    // Tên file gốc
    fileName: {
      type: String,
      trim: true,
      maxlength: [255, "Tên file không được vượt quá 255 ký tự"],
    },

    // Kích thước file (bytes)
    fileSize: {
      type: Number,
      min: [0, "Kích thước file phải >= 0"],
    },

    // Emoji reaction (array of objects)
    reactions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "UserChatNew",
          required: true,
        },
        emoji: {
          type: String,
          required: true,
          maxlength: [10, "Emoji không hợp lệ"],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Tin nhắn đã đọc bởi ai (chỉ cho private chat)
    readBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "UserChatNew",
          required: true,
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Tin nhắn đã xóa (soft delete)
    isDeleted: {
      type: Boolean,
      default: false,
    },

    // Thời gian xóa tin nhắn
    deletedAt: {
      type: Date,
      default: null,
    },

    // Người xóa tin nhắn
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserChatNew",
    },

    // Tin nhắn được reply
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },

    // Metadata cho tìm kiếm và thống kê
    metadata: {
      wordCount: {
        type: Number,
        default: 0,
      },
      hasLinks: {
        type: Boolean,
        default: false,
      },
      hasMentions: {
        type: Boolean,
        default: false,
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
 * Virtual field: Kiểm tra tin nhắn có phải reply không
 */
messageSchema.virtual("isReply").get(function () {
  return !!this.replyTo;
});

/**
 * Virtual field: Số lượng reactions
 */
messageSchema.virtual("reactionsCount").get(function () {
  return this.reactions ? this.reactions.length : 0;
});

/**
 * Virtual field: Kiểm tra tin nhắn có file đính kèm không
 */
messageSchema.virtual("hasAttachment").get(function () {
  return !!(this.fileUrl && this.fileName);
});

/**
 * Pre-save middleware: Cập nhật metadata
 */
messageSchema.pre("save", function (next) {
  // Đếm số từ cho text
  if (this.content && this.contentType === "text") {
    this.metadata.wordCount = this.content
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }

  // Kiểm tra có links không
  this.metadata.hasLinks = /https?:\/\/[^\s]+/i.test(this.content);

  // Kiểm tra có mentions (@username) không
  this.metadata.hasMentions = /@\w+/i.test(this.content);

  next();
});

/**
 * Instance method: Thêm reaction
 */
messageSchema.methods.addReaction = function (userId, emoji) {
  // Kiểm tra user đã reaction chưa
  const existingReaction = this.reactions.find(
    (reaction) => reaction.user.toString() === userId.toString()
  );

  if (existingReaction) {
    // Nếu emoji giống nhau thì xóa reaction
    if (existingReaction.emoji === emoji) {
      this.reactions = this.reactions.filter(
        (reaction) => reaction.user.toString() !== userId.toString()
      );
      return "removed";
    } else {
      // Cập nhật emoji
      existingReaction.emoji = emoji;
      existingReaction.createdAt = new Date();
      return "updated";
    }
  } else {
    // Thêm reaction mới
    this.reactions.push({
      user: userId,
      emoji: emoji,
      createdAt: new Date(),
    });
    return "added";
  }
};

/**
 * Instance method: Xóa reaction
 */
messageSchema.methods.removeReaction = function (userId) {
  this.reactions = this.reactions.filter(
    (reaction) => reaction.user.toString() !== userId.toString()
  );
};

/**
 * Instance method: Đánh dấu đã đọc (cho private chat)
 */
messageSchema.methods.markAsRead = function (userId) {
  if (this.type === "private") {
    const existingRead = this.readBy.find(
      (read) => read.user.toString() === userId.toString()
    );

    if (!existingRead) {
      this.readBy.push({
        user: userId,
        readAt: new Date(),
      });
    }
  }
};

/**
 * Instance method: Soft delete tin nhắn
 */
messageSchema.methods.softDelete = function (deletedBy) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
};

/**
 * Static method: Lấy tin nhắn giữa 2 user (private chat)
 */
messageSchema.statics.getPrivateMessages = function (
  userId1,
  userId2,
  options = {}
) {
  const { page = 1, limit = 50, skipDeleted = true } = options;

  let query = {
    type: "private",
    $or: [
      { sender: userId1, recipient: userId2 },
      { sender: userId2, recipient: userId1 },
    ],
  };

  if (skipDeleted) {
    query.isDeleted = false;
  }

  return this.find(query)
    .populate("sender", "name username avatar")
    .populate("replyTo", "content sender")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
};

/**
 * Static method: Lấy tin nhắn trong nhóm
 */
messageSchema.statics.getGroupMessages = function (groupId, options = {}) {
  const { page = 1, limit = 50, skipDeleted = true } = options;

  let query = {
    type: "group",
    recipient: groupId,
  };

  if (skipDeleted) {
    query.isDeleted = false;
  }

  return this.find(query)
    .populate("sender", "name username avatar")
    .populate("replyTo", "content sender")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
};

/**
 * Static method: Tìm kiếm tin nhắn
 */
messageSchema.statics.searchMessages = function (query, userId, options = {}) {
  const { limit = 20, includeDeleted = false } = options;

  let searchQuery = {
    $and: [
      {
        $or: [{ sender: userId }, { recipient: userId }],
      },
      {
        $text: { $search: query },
      },
    ],
  };

  if (!includeDeleted) {
    searchQuery.isDeleted = false;
  }

  return this.find(searchQuery, { score: { $meta: "textScore" } })
    .populate("sender", "name username")
    .populate("recipient", "name username")
    .sort({ score: { $meta: "textScore" }, createdAt: -1 })
    .limit(limit)
    .lean();
};

/**
 * Static method: Thống kê tin nhắn
 */
messageSchema.statics.getMessageStats = async function () {
  const stats = await this.aggregate([
    {
      $match: {
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: null,
        totalMessages: { $sum: 1 },
        privateMessages: {
          $sum: { $cond: [{ $eq: ["$type", "private"] }, 1, 0] },
        },
        groupMessages: {
          $sum: { $cond: [{ $eq: ["$type", "group"] }, 1, 0] },
        },
        messagesWithFiles: {
          $sum: { $cond: [{ $ne: ["$fileUrl", null] }, 1, 0] },
        },
        totalReactions: { $sum: { $size: "$reactions" } },
      },
    },
  ]);

  return (
    stats[0] || {
      totalMessages: 0,
      privateMessages: 0,
      groupMessages: 0,
      messagesWithFiles: 0,
      totalReactions: 0,
    }
  );
};

/**
 * Index để tối ưu hiệu suất
 */
messageSchema.index({ sender: 1, createdAt: -1 }); // Index cho tin nhắn của user
messageSchema.index({ recipient: 1, type: 1, createdAt: -1 }); // Index cho tin nhắn theo recipient
messageSchema.index({ type: 1, createdAt: -1 }); // Index cho tất cả tin nhắn theo loại
messageSchema.index({ createdAt: -1 }); // Index cho thời gian tạo
messageSchema.index({ "reactions.user": 1 }); // Index cho reactions
messageSchema.index({ replyTo: 1 }); // Index cho reply
messageSchema.index({ isDeleted: 1 }); // Index cho soft delete
messageSchema.index(
  { content: "text" },
  {
    weights: { content: 10 },
    name: "MessageTextIndex",
  }
); // Text index cho tìm kiếm

/**
 * Export model Message
 */
module.exports = mongoose.model("Message", messageSchema);
