/**
 * Model CreateEvent - Quản lý sự kiện
 * ACRUDS: All, Create, Read, Update, Delete, Search
 */

const mongoose = require("mongoose");

/**
 * Schema định nghĩa cấu trúc dữ liệu CreateEvent
 */
const createEventSchema = new mongoose.Schema(
  {
    // Tên người tạo sự kiện (bắt buộc)
    name: {
      type: String,
      required: [true, "Tên người tạo là bắt buộc"],
      trim: true,
      minlength: [2, "Tên phải có ít nhất 2 ký tự"],
      maxlength: [100, "Tên không được vượt quá 100 ký tự"],
    },

    // Tiêu đề sự kiện (bắt buộc)
    title: {
      type: String,
      required: [true, "Tiêu đề sự kiện là bắt buộc"],
      trim: true,
      minlength: [5, "Tiêu đề phải có ít nhất 5 ký tự"],
      maxlength: [200, "Tiêu đề không được vượt quá 200 ký tự"],
    },

    // Nội dung sự kiện (bắt buộc)
    content: {
      type: String,
      required: [true, "Nội dung sự kiện là bắt buộc"],
      trim: true,
      minlength: [10, "Nội dung phải có ít nhất 10 ký tự"],
      maxlength: [5000, "Nội dung không được vượt quá 5000 ký tự"],
    },

    // Ngày diễn ra sự kiện (bắt buộc)
    date: {
      type: Date,
      required: [true, "Ngày sự kiện là bắt buộc"],
      validate: {
        validator: function (value) {
          // Ngày không được trong quá khứ
          return value >= new Date();
        },
        message: "Ngày sự kiện không được trong quá khứ",
      },
    },

    // Trạng thái sự kiện (bắt buộc)
    status: {
      type: String,
      required: [true, "Trạng thái sự kiện là bắt buộc"],
      enum: {
        values: ["draft", "published", "ongoing", "completed", "cancelled"],
        message: "Trạng thái không hợp lệ",
      },
      default: "draft",
    },

    // ID người tạo sự kiện (tham chiếu đến User)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Người tạo sự kiện là bắt buộc"],
    },

    // Mô tả ngắn gọn (tùy chọn)
    shortDescription: {
      type: String,
      maxlength: [300, "Mô tả ngắn không được vượt quá 300 ký tự"],
      trim: true,
    },

    // Địa điểm tổ chức (tùy chọn)
    location: {
      type: String,
      maxlength: [200, "Địa điểm không được vượt quá 200 ký tự"],
      trim: true,
    },

    // Giới hạn số người tham gia (tùy chọn)
    maxAttendees: {
      type: Number,
      min: [1, "Số người tối đa phải lớn hơn 0"],
      max: [10000, "Số người tối đa không được vượt quá 10,000"],
    },

    // Số người đã đăng ký
    currentAttendees: {
      type: Number,
      default: 0,
      min: [0, "Số người hiện tại không được âm"],
    },

    // Danh sách người tham gia (mảng ObjectId tham chiếu đến User)
    attendees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Giá vé (tùy chọn)
    ticketPrice: {
      type: Number,
      min: [0, "Giá vé không được âm"],
      default: 0,
    },

    // Đồng tiền (mặc định VND)
    currency: {
      type: String,
      enum: {
        values: ["VND", "USD", "EUR"],
        message: "Đồng tiền không hợp lệ",
      },
      default: "VND",
    },

    // Thể loại sự kiện (tùy chọn)
    category: {
      type: String,
      enum: {
        values: [
          "conference",
          "workshop",
          "seminar",
          "networking",
          "party",
          "sports",
          "cultural",
          "other",
        ],
        message: "Thể loại sự kiện không hợp lệ",
      },
    },

    // Tags/nhãn sự kiện (mảng string, tùy chọn)
    tags: [
      {
        type: String,
        trim: true,
        maxlength: [50, "Tag không được vượt quá 50 ký tự"],
      },
    ],

    // Hình ảnh sự kiện (URL hoặc path, tùy chọn)
    imageUrl: {
      type: String,
      trim: true,
      match: [
        /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
        "URL hình ảnh không hợp lệ",
      ],
    },

    // Thông tin liên hệ (tùy chọn)
    contactInfo: {
      email: {
        type: String,
        match: [
          /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
          "Email liên hệ không hợp lệ",
        ],
      },
      phone: {
        type: String,
        match: [
          /^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/,
          "Số điện thoại liên hệ không hợp lệ",
        ],
      },
    },

    // Thiết lập hiển thị
    isPublic: {
      type: Boolean,
      default: true,
    },

    // Yêu cầu phê duyệt tham gia
    requiresApproval: {
      type: Boolean,
      default: false,
    },

    // Lịch sử cập nhật
    updateHistory: [
      {
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
        changes: {
          type: String,
          maxlength: [1000, "Mô tả thay đổi không được vượt quá 1000 ký tự"],
        },
      },
    ],
  },
  {
    // Tự động thêm createdAt và updatedAt
    timestamps: true,

    // Tùy chọn cho JSON output
    toJSON: {
      virtuals: true,
    },

    // Tùy chọn cho Object output
    toObject: {
      virtuals: true,
    },
  }
);

/**
 * Virtual field: Kiểm tra sự kiện có còn slot trống
 */
createEventSchema.virtual("hasAvailableSlots").get(function () {
  if (!this.maxAttendees) return true; // Không giới hạn
  return this.currentAttendees < this.maxAttendees;
});

/**
 * Virtual field: Số slot còn trống
 */
createEventSchema.virtual("availableSlots").get(function () {
  if (!this.maxAttendees) return null; // Không giới hạn
  return Math.max(0, this.maxAttendees - this.currentAttendees);
});

/**
 * Virtual field: Trạng thái sự kiện theo thời gian
 */
createEventSchema.virtual("timeStatus").get(function () {
  const now = new Date();
  const eventDate = new Date(this.date);

  if (this.status === "cancelled") return "cancelled";
  if (this.status === "completed") return "completed";

  if (now < eventDate) return "upcoming";
  if (
    now >= eventDate &&
    now <= new Date(eventDate.getTime() + 24 * 60 * 60 * 1000)
  )
    return "ongoing";
  return "past";
});

/**
 * Virtual field: Độ phổ biến (dựa trên số người tham gia)
 */
createEventSchema.virtual("popularity").get(function () {
  if (this.currentAttendees >= 1000) return "very_high";
  if (this.currentAttendees >= 500) return "high";
  if (this.currentAttendees >= 100) return "medium";
  if (this.currentAttendees >= 10) return "low";
  return "very_low";
});

/**
 * Pre-save middleware: Validation và cập nhật logic
 */
createEventSchema.pre("save", function (next) {
  // Validation số người tham gia không vượt quá giới hạn
  if (this.maxAttendees && this.currentAttendees > this.maxAttendees) {
    return next(new Error("Số người tham gia không được vượt quá giới hạn"));
  }

  // Tự động cập nhật shortDescription nếu không có
  if (!this.shortDescription && this.content) {
    this.shortDescription = this.content.substring(0, 150) + "...";
  }

  next();
});

/**
 * Instance method: Thêm người tham gia
 */
createEventSchema.methods.addAttendee = function (userId) {
  if (this.attendees.includes(userId)) {
    throw new Error("Người dùng đã đăng ký tham gia sự kiện này");
  }

  if (this.maxAttendees && this.currentAttendees >= this.maxAttendees) {
    throw new Error("Sự kiện đã đủ số người tham gia");
  }

  this.attendees.push(userId);
  this.currentAttendees += 1;
};

/**
 * Instance method: Xóa người tham gia
 */
createEventSchema.methods.removeAttendee = function (userId) {
  const index = this.attendees.indexOf(userId);
  if (index === -1) {
    throw new Error("Người dùng chưa đăng ký tham gia sự kiện này");
  }

  this.attendees.splice(index, 1);
  this.currentAttendees = Math.max(0, this.currentAttendees - 1);
};

/**
 * Instance method: Kiểm tra người dùng có tham gia không
 */
createEventSchema.methods.isAttending = function (userId) {
  return this.attendees.includes(userId);
};

/**
 * Instance method: Cập nhật sự kiện
 */
createEventSchema.methods.updateEvent = function (updates, updatedBy) {
  // Lưu lịch sử cập nhật
  const changes = Object.keys(updates).join(", ");
  this.updateHistory.push({
    updatedBy: updatedBy,
    changes: `Cập nhật: ${changes}`,
  });

  // Áp dụng cập nhật
  Object.assign(this, updates);
};

/**
 * Static method: Tìm sự kiện theo tiêu đề (search)
 */
createEventSchema.statics.searchByTitle = function (keyword, limit = 20) {
  return this.find({
    title: { $regex: keyword, $options: "i" },
    status: "published",
    isPublic: true,
  })
    .limit(limit)
    .sort({ date: 1 });
};

/**
 * Static method: Lấy sự kiện sắp diễn ra
 */
createEventSchema.statics.getUpcomingEvents = function (limit = 10) {
  return this.find({
    date: { $gte: new Date() },
    status: { $in: ["published", "ongoing"] },
    isPublic: true,
  })
    .sort({ date: 1 })
    .limit(limit);
};

/**
 * Static method: Lấy sự kiện phổ biến
 */
createEventSchema.statics.getPopularEvents = function (limit = 10) {
  return this.find({
    status: "published",
    isPublic: true,
  })
    .sort({ currentAttendees: -1 })
    .limit(limit);
};

/**
 * Static method: Lấy sự kiện theo thể loại
 */
createEventSchema.statics.getEventsByCategory = function (
  category,
  limit = 20
) {
  return this.find({
    category: category,
    status: "published",
    isPublic: true,
  })
    .sort({ date: 1 })
    .limit(limit);
};

/**
 * Static method: Thống kê sự kiện theo trạng thái
 */
createEventSchema.statics.getEventStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalAttendees: { $sum: "$currentAttendees" },
      },
    },
  ]);

  return stats.reduce((acc, stat) => {
    acc[stat._id] = {
      count: stat.count,
      totalAttendees: stat.totalAttendees,
    };
    return acc;
  }, {});
};

/**
 * Static method: Thống kê sự kiện theo tháng
 */
createEventSchema.statics.getMonthlyEventStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" },
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { "_id.year": -1, "_id.month": -1 },
    },
    {
      $limit: 12,
    },
  ]);

  return stats.map((stat) => ({
    year: stat._id.year,
    month: stat._id.month,
    count: stat.count,
    period: `${stat._id.year}-${String(stat._id.month).padStart(2, "0")}`,
  }));
};

/**
 * Index để tối ưu hiệu suất
 */
createEventSchema.index({ title: "text", content: "text" }); // Index text cho tìm kiếm
createEventSchema.index({ date: 1 }); // Index cho ngày
createEventSchema.index({ status: 1 }); // Index cho trạng thái
createEventSchema.index({ category: 1 }); // Index cho thể loại
createEventSchema.index({ createdBy: 1 }); // Index cho người tạo
createEventSchema.index({ isPublic: 1 }); // Index cho visibility
createEventSchema.index({ createdAt: -1 }); // Index cho thời gian tạo
createEventSchema.index({ currentAttendees: -1 }); // Index cho số người tham gia

/**
 * Export model CreateEvent
 */
module.exports = mongoose.model("CreateEvent", createEventSchema);
