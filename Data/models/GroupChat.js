/**
 * Model GroupChat - Quản lý nhóm chat
 * Hỗ trợ nhiều thành viên, quyền admin, cài đặt nhóm
 */

const mongoose = require("mongoose");

/**
 * Schema định nghĩa cấu trúc dữ liệu GroupChat
 */
const groupChatSchema = new mongoose.Schema(
  {
    // Tên nhóm
    name: {
      type: String,
      required: [true, "Tên nhóm là bắt buộc"],
      trim: true,
      minlength: [2, "Tên nhóm phải có ít nhất 2 ký tự"],
      maxlength: [100, "Tên nhóm không được vượt quá 100 ký tự"],
    },

    // Mô tả nhóm
    description: {
      type: String,
      maxlength: [500, "Mô tả nhóm không được vượt quá 500 ký tự"],
      trim: true,
    },

    // Avatar nhóm
    avatar: {
      type: String,
      trim: true,
      match: [
        /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
        "URL avatar không hợp lệ",
      ],
    },

    // Người tạo nhóm
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserChatNew",
      required: [true, "Người tạo nhóm là bắt buộc"],
    },

    // Danh sách thành viên (array of objects)
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "UserChatNew",
          required: true,
        },
        role: {
          type: String,
          enum: {
            values: ["admin", "moderator", "member"],
            message: "Vai trò không hợp lệ",
          },
          default: "member",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "UserChatNew",
          required: true,
        },
      },
    ],

    // Cài đặt nhóm
    settings: {
      isPrivate: {
        type: Boolean,
        default: false,
      },
      allowInvites: {
        type: Boolean,
        default: true,
      },
      allowMemberManagement: {
        type: Boolean,
        default: true,
      },
      maxMembers: {
        type: Number,
        default: 100,
        min: [2, "Nhóm phải có ít nhất 2 thành viên"],
        max: [500, "Nhóm không được vượt quá 500 thành viên"],
      },
      messageRetentionDays: {
        type: Number,
        default: 365,
        min: [1, "Thời gian lưu tin nhắn phải ít nhất 1 ngày"],
        max: [3650, "Thời gian lưu tin nhắn không được vượt quá 10 năm"],
      },
    },

    // Trạng thái nhóm
    status: {
      type: String,
      enum: {
        values: ["active", "archived", "deleted"],
        message: "Trạng thái nhóm không hợp lệ",
      },
      default: "active",
    },

    // Thời gian xóa nhóm (cho soft delete)
    deletedAt: {
      type: Date,
      default: null,
    },

    // Người xóa nhóm
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserChatNew",
    },

    // Thống kê nhóm
    stats: {
      totalMembers: {
        type: Number,
        default: 0,
      },
      totalMessages: {
        type: Number,
        default: 0,
      },
      totalFiles: {
        type: Number,
        default: 0,
      },
      lastMessageAt: {
        type: Date,
        default: null,
      },
      lastActivityAt: {
        type: Date,
        default: Date.now,
      },
    },

    // Danh sách lời mời đang chờ
    pendingInvites: [
      {
        invitedUser: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "UserChatNew",
          required: true,
        },
        invitedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "UserChatNew",
          required: true,
        },
        invitedAt: {
          type: Date,
          default: Date.now,
        },
        expiresAt: {
          type: Date,
          default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 ngày
        },
      },
    ],

    // Cài đặt thông báo cho nhóm
    notificationSettings: {
      mentionOnly: {
        type: Boolean,
        default: false,
      },
      muted: {
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
 * Virtual field: Số lượng thành viên hiện tại
 */
groupChatSchema.virtual("currentMemberCount").get(function () {
  return this.members ? this.members.length : 0;
});

/**
 * Virtual field: Số lượng admin
 */
groupChatSchema.virtual("adminCount").get(function () {
  return this.members
    ? this.members.filter((m) => m.role === "admin").length
    : 0;
});

/**
 * Virtual field: Kiểm tra nhóm có đầy thành viên không
 */
groupChatSchema.virtual("isFull").get(function () {
  return this.currentMemberCount >= this.settings.maxMembers;
});

/**
 * Virtual field: Tuổi nhóm
 */
groupChatSchema.virtual("groupAge").get(function () {
  const now = new Date();
  const created = this.createdAt;
  const diffTime = Math.abs(now - created);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return "Hôm nay";
  if (diffDays < 7) return `${diffDays} ngày`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng`;

  return `${Math.floor(diffDays / 365)} năm`;
});

/**
 * Pre-save middleware: Cập nhật stats
 */
groupChatSchema.pre("save", function (next) {
  if (this.members) {
    this.stats.totalMembers = this.members.length;
  }
  next();
});

/**
 * Instance method: Thêm thành viên
 */
groupChatSchema.methods.addMember = function (
  userId,
  addedBy,
  role = "member"
) {
  // Kiểm tra thành viên đã tồn tại chưa
  const existingMember = this.members.find(
    (member) => member.user.toString() === userId.toString()
  );

  if (existingMember) {
    throw new Error("User đã là thành viên của nhóm");
  }

  // Kiểm tra số lượng thành viên tối đa
  if (this.currentMemberCount >= this.settings.maxMembers) {
    throw new Error("Nhóm đã đầy thành viên");
  }

  // Thêm thành viên mới
  this.members.push({
    user: userId,
    role: role,
    joinedAt: new Date(),
    addedBy: addedBy,
  });

  this.stats.lastActivityAt = new Date();
};

/**
 * Instance method: Xóa thành viên
 */
groupChatSchema.methods.removeMember = function (userId) {
  const memberIndex = this.members.findIndex(
    (member) => member.user.toString() === userId.toString()
  );

  if (memberIndex === -1) {
    throw new Error("User không phải là thành viên của nhóm");
  }

  // Không cho phép xóa admin cuối cùng
  const member = this.members[memberIndex];
  if (member.role === "admin" && this.adminCount <= 1) {
    throw new Error("Không thể xóa admin cuối cùng của nhóm");
  }

  this.members.splice(memberIndex, 1);
  this.stats.lastActivityAt = new Date();
};

/**
 * Instance method: Cập nhật vai trò thành viên
 */
groupChatSchema.methods.updateMemberRole = function (userId, newRole) {
  const member = this.members.find(
    (member) => member.user.toString() === userId.toString()
  );

  if (!member) {
    throw new Error("User không phải là thành viên của nhóm");
  }

  // Không cho phép thay đổi vai trò admin cuối cùng
  if (member.role === "admin" && newRole !== "admin" && this.adminCount <= 1) {
    throw new Error("Không thể thay đổi vai trò admin cuối cùng");
  }

  member.role = newRole;
  this.stats.lastActivityAt = new Date();
};

/**
 * Instance method: Kiểm tra user có phải thành viên không
 */
groupChatSchema.methods.isMember = function (userId) {
  return this.members.some(
    (member) => member.user.toString() === userId.toString()
  );
};

/**
 * Instance method: Kiểm tra user có quyền admin không
 */
groupChatSchema.methods.isAdmin = function (userId) {
  return this.members.some(
    (member) =>
      member.user.toString() === userId.toString() && member.role === "admin"
  );
};

/**
 * Instance method: Kiểm tra user có quyền moderator không
 */
groupChatSchema.methods.isModerator = function (userId) {
  return this.members.some(
    (member) =>
      member.user.toString() === userId.toString() &&
      (member.role === "admin" || member.role === "moderator")
  );
};

/**
 * Instance method: Thêm lời mời
 */
groupChatSchema.methods.addInvite = function (invitedUserId, invitedById) {
  // Kiểm tra đã có lời mời chưa
  const existingInvite = this.pendingInvites.find(
    (invite) => invite.invitedUser.toString() === invitedUserId.toString()
  );

  if (existingInvite) {
    throw new Error("User đã được mời vào nhóm");
  }

  // Kiểm tra user đã là thành viên chưa
  if (this.isMember(invitedUserId)) {
    throw new Error("User đã là thành viên của nhóm");
  }

  this.pendingInvites.push({
    invitedUser: invitedUserId,
    invitedBy: invitedById,
    invitedAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 ngày
  });
};

/**
 * Instance method: Chấp nhận lời mời
 */
groupChatSchema.methods.acceptInvite = function (userId, invitedById) {
  const inviteIndex = this.pendingInvites.findIndex(
    (invite) =>
      invite.invitedUser.toString() === userId.toString() &&
      invite.invitedBy.toString() === invitedById.toString()
  );

  if (inviteIndex === -1) {
    throw new Error("Không tìm thấy lời mời hợp lệ");
  }

  // Xóa lời mời và thêm thành viên
  this.pendingInvites.splice(inviteIndex, 1);
  this.addMember(userId, invitedById);
};

/**
 * Instance method: Từ chối lời mời
 */
groupChatSchema.methods.rejectInvite = function (userId, invitedById) {
  const inviteIndex = this.pendingInvites.findIndex(
    (invite) =>
      invite.invitedUser.toString() === userId.toString() &&
      invite.invitedBy.toString() === invitedById.toString()
  );

  if (inviteIndex === -1) {
    throw new Error("Không tìm thấy lời mời");
  }

  this.pendingInvites.splice(inviteIndex, 1);
};

/**
 * Instance method: Cập nhật thống kê tin nhắn
 */
groupChatSchema.methods.updateMessageStats = function () {
  this.stats.totalMessages += 1;
  this.stats.lastMessageAt = new Date();
  this.stats.lastActivityAt = new Date();
};

/**
 * Instance method: Cập nhật thống kê file
 */
groupChatSchema.methods.updateFileStats = function () {
  this.stats.totalFiles += 1;
  this.stats.lastActivityAt = new Date();
};

/**
 * Static method: Tìm kiếm nhóm
 */
groupChatSchema.statics.searchGroups = function (query, limit = 20) {
  return this.find({
    name: { $regex: query, $options: "i" },
    status: "active",
  })
    .populate("createdBy", "name username")
    .select("name description avatar members settings stats createdAt")
    .limit(limit);
};

/**
 * Static method: Lấy danh sách nhóm của user
 */
groupChatSchema.statics.getUserGroups = function (userId) {
  return this.find({
    members: {
      $elemMatch: { user: userId },
    },
    status: "active",
  })
    .populate("createdBy", "name username avatar")
    .select("name description avatar members settings stats lastMessageAt")
    .sort({ "stats.lastActivityAt": -1 });
};

/**
 * Static method: Thống kê nhóm
 */
groupChatSchema.statics.getGroupStats = async function () {
  const stats = await this.aggregate([
    {
      $match: {
        status: "active",
      },
    },
    {
      $group: {
        _id: null,
        totalGroups: { $sum: 1 },
        totalMembers: { $sum: "$stats.totalMembers" },
        totalMessages: { $sum: "$stats.totalMessages" },
        avgMembersPerGroup: { $avg: "$stats.totalMembers" },
        totalFiles: { $sum: "$stats.totalFiles" },
      },
    },
  ]);

  return (
    stats[0] || {
      totalGroups: 0,
      totalMembers: 0,
      totalMessages: 0,
      avgMembersPerGroup: 0,
      totalFiles: 0,
    }
  );
};

/**
 * Static method: Làm sạch lời mời hết hạn
 */
groupChatSchema.statics.cleanExpiredInvites = async function () {
  const now = new Date();
  return this.updateMany(
    {},
    {
      $pull: {
        pendingInvites: { expiresAt: { $lt: now } },
      },
    }
  );
};

/**
 * Index để tối ưu hiệu suất
 */
groupChatSchema.index({ createdBy: 1 }); // Index cho người tạo
groupChatSchema.index({ "members.user": 1 }); // Index cho thành viên
groupChatSchema.index({ status: 1 }); // Index cho trạng thái
groupChatSchema.index({ "stats.lastActivityAt": -1 }); // Index cho hoạt động gần nhất
groupChatSchema.index({ "pendingInvites.invitedUser": 1 }); // Index cho lời mời
groupChatSchema.index({ "pendingInvites.expiresAt": 1 }); // Index cho thời hạn lời mời
groupChatSchema.index({ createdAt: -1 }); // Index cho thời gian tạo
groupChatSchema.index({ name: "text", description: "text" }); // Text index cho tìm kiếm

/**
 * Export model GroupChat
 */
module.exports = mongoose.model("GroupChat", groupChatSchema);
