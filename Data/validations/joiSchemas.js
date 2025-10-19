/**
 * File chứa các Joi schemas để validate dữ liệu cho tất cả models
 * Sử dụng Joi để validation phía server
 */

const Joi = require("joi");

/**
 * Schema validation cho User model
 */
const userSchemas = {
  // Schema cho tạo user mới (admin)
  create: Joi.object({
    name: Joi.string().min(2).max(100).trim().required().messages({
      "string.empty": "Tên người dùng không được để trống",
      "string.min": "Tên phải có ít nhất {#limit} ký tự",
      "string.max": "Tên không được vượt quá {#limit} ký tự",
      "any.required": "Tên người dùng là bắt buộc",
    }),

    age: Joi.number().integer().min(1).max(150).required().messages({
      "number.base": "Tuổi phải là số",
      "number.min": "Tuổi phải lớn hơn {#limit}",
      "number.max": "Tuổi không được vượt quá {#limit}",
      "any.required": "Tuổi là bắt buộc",
    }),

    address: Joi.string().min(5).max(500).trim().required().messages({
      "string.empty": "Địa chỉ không được để trống",
      "string.min": "Địa chỉ phải có ít nhất {#limit} ký tự",
      "string.max": "Địa chỉ không được vượt quá {#limit} ký tự",
      "any.required": "Địa chỉ là bắt buộc",
    }),

    email: Joi.string().email().lowercase().trim().required().messages({
      "string.email": "Email không hợp lệ",
      "string.empty": "Email không được để trống",
      "any.required": "Email là bắt buộc",
    }),

    pass: Joi.string()
      .min(8)
      .pattern(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
      )
      .required()
      .messages({
        "string.empty": "Mật khẩu không được để trống",
        "string.min": "Mật khẩu phải có ít nhất {#limit} ký tự",
        "string.pattern.base":
          "Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt",
        "any.required": "Mật khẩu là bắt buộc",
      }),

    role: Joi.string().valid("admin", "user").default("user").messages({
      "any.only": "Vai trò phải là admin hoặc user",
      "any.required": "Vai trò là bắt buộc",
    }),
  }),

  // Schema cho cập nhật user
  update: Joi.object({
    name: Joi.string().min(2).max(100).trim().messages({
      "string.min": "Tên phải có ít nhất {#limit} ký tự",
      "string.max": "Tên không được vượt quá {#limit} ký tự",
    }),

    age: Joi.number().integer().min(1).max(150).messages({
      "number.base": "Tuổi phải là số",
      "number.min": "Tuổi phải lớn hơn {#limit}",
      "number.max": "Tuổi không được vượt quá {#limit}",
    }),

    address: Joi.string().min(5).max(500).trim().messages({
      "string.min": "Địa chỉ phải có ít nhất {#limit} ký tự",
      "string.max": "Địa chỉ không được vượt quá {#limit} ký tự",
    }),

    email: Joi.string().email().lowercase().trim().messages({
      "string.email": "Email không hợp lệ",
    }),

    role: Joi.string().valid("admin", "user").messages({
      "any.only": "Vai trò phải là admin hoặc user",
    }),
  })
    .min(1)
    .messages({
      "object.min": "Phải cung cấp ít nhất một trường để cập nhật",
    }),

  // Schema cho đổi mật khẩu
  changePassword: Joi.object({
    currentPassword: Joi.string().required().messages({
      "string.empty": "Mật khẩu hiện tại không được để trống",
      "any.required": "Mật khẩu hiện tại là bắt buộc",
    }),

    newPassword: Joi.string()
      .min(8)
      .pattern(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
      )
      .required()
      .messages({
        "string.empty": "Mật khẩu mới không được để trống",
        "string.min": "Mật khẩu mới phải có ít nhất {#limit} ký tự",
        "string.pattern.base":
          "Mật khẩu mới phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt",
        "any.required": "Mật khẩu mới là bắt buộc",
      }),

    confirmPassword: Joi.string()
      .valid(Joi.ref("newPassword"))
      .required()
      .messages({
        "any.only": "Xác nhận mật khẩu không khớp",
        "any.required": "Xác nhận mật khẩu là bắt buộc",
      }),
  }),
};

/**
 * Schema validation cho CreateNewUser model (đăng ký)
 */
const createNewUserSchemas = {
  // Schema cho đăng ký user mới
  register: Joi.object({
    name: Joi.string().min(2).max(100).trim().required().messages({
      "string.empty": "Tên người dùng không được để trống",
      "string.min": "Tên phải có ít nhất {#limit} ký tự",
      "string.max": "Tên không được vượt quá {#limit} ký tự",
      "any.required": "Tên người dùng là bắt buộc",
    }),

    age: Joi.number().integer().min(13).max(150).required().messages({
      "number.base": "Tuổi phải là số",
      "number.min": "Tuổi phải từ {#limit} trở lên",
      "number.max": "Tuổi không được vượt quá {#limit}",
      "any.required": "Tuổi là bắt buộc",
    }),

    address: Joi.string().min(5).max(500).trim().required().messages({
      "string.empty": "Địa chỉ không được để trống",
      "string.min": "Địa chỉ phải có ít nhất {#limit} ký tự",
      "string.max": "Địa chỉ không được vượt quá {#limit} ký tự",
      "any.required": "Địa chỉ là bắt buộc",
    }),

    job: Joi.string().min(2).max(100).trim().required().messages({
      "string.empty": "Nghề nghiệp không được để trống",
      "string.min": "Nghề nghiệp phải có ít nhất {#limit} ký tự",
      "string.max": "Nghề nghiệp không được vượt quá {#limit} ký tự",
      "any.required": "Nghề nghiệp là bắt buộc",
    }),

    phone: Joi.string()
      .pattern(/^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/)
      .required()
      .messages({
        "string.pattern.base":
          "Số điện thoại không hợp lệ (định dạng Việt Nam)",
        "string.empty": "Số điện thoại không được để trống",
        "any.required": "Số điện thoại là bắt buộc",
      }),

    email: Joi.string().email().lowercase().trim().required().messages({
      "string.email": "Email không hợp lệ",
      "string.empty": "Email không được để trống",
      "any.required": "Email là bắt buộc",
    }),

    password: Joi.string()
      .min(8)
      .pattern(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
      )
      .required()
      .messages({
        "string.empty": "Mật khẩu không được để trống",
        "string.min": "Mật khẩu phải có ít nhất {#limit} ký tự",
        "string.pattern.base":
          "Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt",
        "any.required": "Mật khẩu là bắt buộc",
      }),
  }),

  // Schema cho xác minh email
  verifyEmail: Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Email không hợp lệ",
      "any.required": "Email là bắt buộc",
    }),

    token: Joi.string()
      .length(6)
      .pattern(/^\d{6}$/)
      .required()
      .messages({
        "string.length": "Mã xác minh phải có {#limit} chữ số",
        "string.pattern.base": "Mã xác minh chỉ được chứa chữ số",
        "any.required": "Mã xác minh là bắt buộc",
      }),
  }),

  // Schema cho xác minh số điện thoại
  verifyPhone: Joi.object({
    phone: Joi.string()
      .pattern(/^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/)
      .required()
      .messages({
        "string.pattern.base": "Số điện thoại không hợp lệ",
        "any.required": "Số điện thoại là bắt buộc",
      }),

    token: Joi.string()
      .length(6)
      .pattern(/^\d{6}$/)
      .required()
      .messages({
        "string.length": "Mã xác minh phải có {#limit} chữ số",
        "string.pattern.base": "Mã xác minh chỉ được chứa chữ số",
        "any.required": "Mã xác minh là bắt buộc",
      }),
  }),

  // Schema cho duyệt đăng ký
  approve: Joi.object({
    userId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "ID người dùng không hợp lệ",
        "any.required": "ID người dùng là bắt buộc",
      }),

    notes: Joi.string().max(1000).trim().messages({
      "string.max": "Ghi chú không được vượt quá {#limit} ký tự",
    }),
  }),

  // Schema cho từ chối đăng ký
  reject: Joi.object({
    userId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "ID người dùng không hợp lệ",
        "any.required": "ID người dùng là bắt buộc",
      }),

    reason: Joi.string().min(10).max(500).required().messages({
      "string.empty": "Lý do từ chối không được để trống",
      "string.min": "Lý do từ chối phải có ít nhất {#limit} ký tự",
      "string.max": "Lý do từ chối không được vượt quá {#limit} ký tự",
      "any.required": "Lý do từ chối là bắt buộc",
    }),
  }),
};

/**
 * Schema validation cho CreateEvent model
 */
const createEventSchemas = {
  // Schema cho tạo event mới
  create: Joi.object({
    title: Joi.string().min(5).max(200).trim().required().messages({
      "string.empty": "Tiêu đề sự kiện không được để trống",
      "string.min": "Tiêu đề phải có ít nhất {#limit} ký tự",
      "string.max": "Tiêu đề không được vượt quá {#limit} ký tự",
      "any.required": "Tiêu đề sự kiện là bắt buộc",
    }),

    content: Joi.string().min(10).max(5000).trim().required().messages({
      "string.empty": "Nội dung sự kiện không được để trống",
      "string.min": "Nội dung phải có ít nhất {#limit} ký tự",
      "string.max": "Nội dung không được vượt quá {#limit} ký tự",
      "any.required": "Nội dung sự kiện là bắt buộc",
    }),

    date: Joi.date().greater("now").required().messages({
      "date.base": "Ngày sự kiện không hợp lệ",
      "date.greater": "Ngày sự kiện phải trong tương lai",
      "any.required": "Ngày sự kiện là bắt buộc",
    }),

    status: Joi.string()
      .valid("draft", "published", "ongoing", "completed", "cancelled")
      .default("draft")
      .messages({
        "any.only": "Trạng thái sự kiện không hợp lệ",
      }),

    shortDescription: Joi.string().max(300).trim().messages({
      "string.max": "Mô tả ngắn không được vượt quá {#limit} ký tự",
    }),

    location: Joi.string().max(200).trim().messages({
      "string.max": "Địa điểm không được vượt quá {#limit} ký tự",
    }),

    maxAttendees: Joi.number().integer().min(1).max(10000).messages({
      "number.base": "Số người tối đa phải là số nguyên",
      "number.min": "Số người tối đa phải lớn hơn {#limit}",
      "number.max": "Số người tối đa không được vượt quá {#limit}",
    }),

    ticketPrice: Joi.number().min(0).messages({
      "number.base": "Giá vé phải là số",
      "number.min": "Giá vé không được âm",
    }),

    currency: Joi.string().valid("VND", "USD", "EUR").default("VND").messages({
      "any.only": "Đồng tiền không hợp lệ",
    }),

    category: Joi.string()
      .valid(
        "conference",
        "workshop",
        "seminar",
        "networking",
        "party",
        "sports",
        "cultural",
        "other"
      )
      .messages({
        "any.only": "Thể loại sự kiện không hợp lệ",
      }),

    tags: Joi.array().items(Joi.string().max(50).trim()).max(10).messages({
      "array.max": "Không được thêm quá {#limit} tag",
      "string.max": "Tag không được vượt quá {#limit} ký tự",
    }),

    imageUrl: Joi.string().uri().messages({
      "string.uri": "URL hình ảnh không hợp lệ",
    }),

    contactInfo: Joi.object({
      email: Joi.string().email().messages({
        "string.email": "Email liên hệ không hợp lệ",
      }),
      phone: Joi.string()
        .pattern(/^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/)
        .messages({
          "string.pattern.base": "Số điện thoại liên hệ không hợp lệ",
        }),
    }),

    isPublic: Joi.boolean().default(true),

    requiresApproval: Joi.boolean().default(false),
  }),

  // Schema cho cập nhật event
  update: Joi.object({
    title: Joi.string().min(5).max(200).trim().messages({
      "string.min": "Tiêu đề phải có ít nhất {#limit} ký tự",
      "string.max": "Tiêu đề không được vượt quá {#limit} ký tự",
    }),

    content: Joi.string().min(10).max(5000).trim().messages({
      "string.min": "Nội dung phải có ít nhất {#limit} ký tự",
      "string.max": "Nội dung không được vượt quá {#limit} ký tự",
    }),

    date: Joi.date().greater("now").messages({
      "date.base": "Ngày sự kiện không hợp lệ",
      "date.greater": "Ngày sự kiện phải trong tương lai",
    }),

    status: Joi.string()
      .valid("draft", "published", "ongoing", "completed", "cancelled")
      .messages({
        "any.only": "Trạng thái sự kiện không hợp lệ",
      }),

    shortDescription: Joi.string().max(300).trim().messages({
      "string.max": "Mô tả ngắn không được vượt quá {#limit} ký tự",
    }),

    location: Joi.string().max(200).trim().messages({
      "string.max": "Địa điểm không được vượt quá {#limit} ký tự",
    }),

    maxAttendees: Joi.number().integer().min(1).max(10000).messages({
      "number.base": "Số người tối đa phải là số nguyên",
      "number.min": "Số người tối đa phải lớn hơn {#limit}",
      "number.max": "Số người tối đa không được vượt quá {#limit}",
    }),

    ticketPrice: Joi.number().min(0).messages({
      "number.base": "Giá vé phải là số",
      "number.min": "Giá vé không được âm",
    }),

    currency: Joi.string().valid("VND", "USD", "EUR").messages({
      "any.only": "Đồng tiền không hợp lệ",
    }),

    category: Joi.string()
      .valid(
        "conference",
        "workshop",
        "seminar",
        "networking",
        "party",
        "sports",
        "cultural",
        "other"
      )
      .messages({
        "any.only": "Thể loại sự kiện không hợp lệ",
      }),

    tags: Joi.array().items(Joi.string().max(50).trim()).max(10).messages({
      "array.max": "Không được thêm quá {#limit} tag",
      "string.max": "Tag không được vượt quá {#limit} ký tự",
    }),

    imageUrl: Joi.string().uri().messages({
      "string.uri": "URL hình ảnh không hợp lệ",
    }),

    contactInfo: Joi.object({
      email: Joi.string().email().messages({
        "string.email": "Email liên hệ không hợp lệ",
      }),
      phone: Joi.string()
        .pattern(/^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/)
        .messages({
          "string.pattern.base": "Số điện thoại liên hệ không hợp lệ",
        }),
    }),

    isPublic: Joi.boolean(),

    requiresApproval: Joi.boolean(),
  })
    .min(1)
    .messages({
      "object.min": "Phải cung cấp ít nhất một trường để cập nhật",
    }),

  // Schema cho tham gia event
  attend: Joi.object({
    eventId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "ID sự kiện không hợp lệ",
        "any.required": "ID sự kiện là bắt buộc",
      }),
  }),

  // Schema cho tìm kiếm event
  search: Joi.object({
    query: Joi.string().min(1).max(100).trim().messages({
      "string.empty": "Từ khóa tìm kiếm không được để trống",
      "string.min": "Từ khóa tìm kiếm phải có ít nhất {#limit} ký tự",
      "string.max": "Từ khóa tìm kiếm không được vượt quá {#limit} ký tự",
    }),

    category: Joi.string().valid(
      "conference",
      "workshop",
      "seminar",
      "networking",
      "party",
      "sports",
      "cultural",
      "other"
    ),

    status: Joi.string().valid(
      "draft",
      "published",
      "ongoing",
      "completed",
      "cancelled"
    ),

    limit: Joi.number().integer().min(1).max(100).default(20).messages({
      "number.base": "Limit phải là số nguyên",
      "number.min": "Limit phải lớn hơn {#limit}",
      "number.max": "Limit không được vượt quá {#limit}",
    }),
  }),
};

/**
 * Schema validation chung
 */
const commonSchemas = {
  // Schema cho ID MongoDB
  mongoId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.pattern.base": "ID không hợp lệ",
    }),

  // Schema cho phân trang
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1).messages({
      "number.base": "Trang phải là số nguyên",
      "number.min": "Trang phải lớn hơn {#limit}",
    }),

    limit: Joi.number().integer().min(1).max(100).default(10).messages({
      "number.base": "Limit phải là số nguyên",
      "number.min": "Limit phải lớn hơn {#limit}",
      "number.max": "Limit không được vượt quá {#limit}",
    }),

    sort: Joi.string()
      .valid("createdAt", "updatedAt", "name", "date", "title")
      .default("createdAt"),

    order: Joi.string().valid("asc", "desc").default("desc"),
  }),

  // Schema cho login
  login: Joi.object({
    email: Joi.string().email().lowercase().trim().required().messages({
      "string.email": "Email không hợp lệ",
      "string.empty": "Email không được để trống",
      "any.required": "Email là bắt buộc",
    }),

    password: Joi.string().required().messages({
      "string.empty": "Mật khẩu không được để trống",
      "any.required": "Mật khẩu là bắt buộc",
    }),

    rememberMe: Joi.boolean().default(false),
  }),
};

// Export tất cả schemas
module.exports = {
  userSchemas,
  createNewUserSchemas,
  createEventSchemas,
  commonSchemas,
};
