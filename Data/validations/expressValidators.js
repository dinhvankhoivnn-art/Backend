/**
 * File chứa các express-validator rules để validate dữ liệu
 * Sử dụng express-validator cho middleware validation
 */

const { body, param, query, validationResult } = require("express-validator");

/**
 * Middleware xử lý lỗi validation
 * Trả về lỗi chi tiết khi validation fail
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Dữ liệu không hợp lệ",
      errors: errors.array().map((err) => ({
        field: err.param,
        message: err.msg,
        value: err.value,
      })),
    });
  }
  next();
};

/**
 * Validation rules cho User
 */
const userValidators = {
  // Validation cho tạo user mới
  createUser: [
    body("name")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Tên phải có 2-100 ký tự")
      .matches(/^[a-zA-ZÀ-ỹ\s]+$/)
      .withMessage("Tên chỉ được chứa chữ cái và khoảng trắng"),

    body("age")
      .isInt({ min: 1, max: 150 })
      .withMessage("Tuổi phải từ 1 đến 150"),

    body("address")
      .trim()
      .isLength({ min: 5, max: 500 })
      .withMessage("Địa chỉ phải có 5-500 ký tự"),

    body("email").isEmail().normalizeEmail().withMessage("Email không hợp lệ"),

    body("pass")
      .isLength({ min: 8 })
      .withMessage("Mật khẩu phải có ít nhất 8 ký tự")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
      .withMessage(
        "Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt"
      ),

    body("role")
      .optional()
      .isIn(["admin", "user"])
      .withMessage("Vai trò phải là admin hoặc user"),

    handleValidationErrors,
  ],

  // Validation cho cập nhật user
  updateUser: [
    param("id").isMongoId().withMessage("ID người dùng không hợp lệ"),

    body("name")
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Tên phải có 2-100 ký tự")
      .matches(/^[a-zA-ZÀ-ỹ\s]+$/)
      .withMessage("Tên chỉ được chứa chữ cái và khoảng trắng"),

    body("age")
      .optional()
      .isInt({ min: 1, max: 150 })
      .withMessage("Tuổi phải từ 1 đến 150"),

    body("address")
      .optional()
      .trim()
      .isLength({ min: 5, max: 500 })
      .withMessage("Địa chỉ phải có 5-500 ký tự"),

    body("email")
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage("Email không hợp lệ"),

    body("role")
      .optional()
      .isIn(["admin", "user"])
      .withMessage("Vai trò phải là admin hoặc user"),

    handleValidationErrors,
  ],

  // Validation cho lấy user theo ID
  getUserById: [
    param("id").isMongoId().withMessage("ID người dùng không hợp lệ"),

    handleValidationErrors,
  ],

  // Validation cho xóa user
  deleteUser: [
    param("id").isMongoId().withMessage("ID người dùng không hợp lệ"),

    handleValidationErrors,
  ],

  // Validation cho đổi mật khẩu
  changePassword: [
    body("currentPassword")
      .notEmpty()
      .withMessage("Mật khẩu hiện tại là bắt buộc"),

    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("Mật khẩu mới phải có ít nhất 8 ký tự")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
      .withMessage(
        "Mật khẩu mới phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt"
      ),

    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Xác nhận mật khẩu không khớp");
      }
      return true;
    }),

    handleValidationErrors,
  ],
};

/**
 * Validation rules cho CreateNewUser (đăng ký)
 */
const createNewUserValidators = {
  // Validation cho đăng ký
  register: [
    body("name")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Tên phải có 2-100 ký tự")
      .matches(/^[a-zA-ZÀ-ỹ\s]+$/)
      .withMessage("Tên chỉ được chứa chữ cái và khoảng trắng"),

    body("age")
      .isInt({ min: 13, max: 150 })
      .withMessage("Tuổi phải từ 13 đến 150"),

    body("address")
      .trim()
      .isLength({ min: 5, max: 500 })
      .withMessage("Địa chỉ phải có 5-500 ký tự"),

    body("job")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Nghề nghiệp phải có 2-100 ký tự"),

    body("phone")
      .matches(/^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/)
      .withMessage("Số điện thoại không hợp lệ (định dạng Việt Nam)"),

    body("email").isEmail().normalizeEmail().withMessage("Email không hợp lệ"),

    body("password")
      .isLength({ min: 8 })
      .withMessage("Mật khẩu phải có ít nhất 8 ký tự")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
      .withMessage(
        "Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt"
      ),

    handleValidationErrors,
  ],

  // Validation cho xác minh email
  verifyEmail: [
    body("email").isEmail().normalizeEmail().withMessage("Email không hợp lệ"),

    body("token")
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage("Mã xác minh phải là 6 chữ số"),

    handleValidationErrors,
  ],

  // Validation cho xác minh phone
  verifyPhone: [
    body("phone")
      .matches(/^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/)
      .withMessage("Số điện thoại không hợp lệ"),

    body("token")
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage("Mã xác minh phải là 6 chữ số"),

    handleValidationErrors,
  ],
};

/**
 * Validation rules cho CreateEvent
 */
const createEventValidators = {
  // Validation cho tạo event
  createEvent: [
    body("title")
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage("Tiêu đề phải có 5-200 ký tự"),

    body("content")
      .trim()
      .isLength({ min: 10, max: 5000 })
      .withMessage("Nội dung phải có 10-5000 ký tự"),

    body("date")
      .isISO8601()
      .withMessage("Ngày sự kiện không hợp lệ")
      .custom((value) => {
        if (new Date(value) <= new Date()) {
          throw new Error("Ngày sự kiện phải trong tương lai");
        }
        return true;
      }),

    body("status")
      .optional()
      .isIn(["draft", "published", "ongoing", "completed", "cancelled"])
      .withMessage("Trạng thái sự kiện không hợp lệ"),

    body("shortDescription")
      .optional()
      .isLength({ max: 300 })
      .withMessage("Mô tả ngắn không được vượt quá 300 ký tự"),

    body("location")
      .optional()
      .isLength({ max: 200 })
      .withMessage("Địa điểm không được vượt quá 200 ký tự"),

    body("maxAttendees")
      .optional()
      .isInt({ min: 1, max: 10000 })
      .withMessage("Số người tối đa phải từ 1 đến 10000"),

    body("ticketPrice")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Giá vé không được âm"),

    body("currency")
      .optional()
      .isIn(["VND", "USD", "EUR"])
      .withMessage("Đồng tiền không hợp lệ"),

    body("category")
      .optional()
      .isIn([
        "conference",
        "workshop",
        "seminar",
        "networking",
        "party",
        "sports",
        "cultural",
        "other",
      ])
      .withMessage("Thể loại sự kiện không hợp lệ"),

    body("tags")
      .optional()
      .isArray({ max: 10 })
      .withMessage("Không được thêm quá 10 tag"),

    body("tags.*")
      .optional()
      .isLength({ max: 50 })
      .withMessage("Tag không được vượt quá 50 ký tự"),

    body("imageUrl")
      .optional()
      .isURL()
      .withMessage("URL hình ảnh không hợp lệ"),

    body("contactInfo.email")
      .optional()
      .isEmail()
      .withMessage("Email liên hệ không hợp lệ"),

    body("contactInfo.phone")
      .optional()
      .matches(/^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/)
      .withMessage("Số điện thoại liên hệ không hợp lệ"),

    handleValidationErrors,
  ],

  // Validation cho cập nhật event
  updateEvent: [
    param("id").isMongoId().withMessage("ID sự kiện không hợp lệ"),

    body("title")
      .optional()
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage("Tiêu đề phải có 5-200 ký tự"),

    body("content")
      .optional()
      .trim()
      .isLength({ min: 10, max: 5000 })
      .withMessage("Nội dung phải có 10-5000 ký tự"),

    body("date")
      .optional()
      .isISO8601()
      .withMessage("Ngày sự kiện không hợp lệ")
      .custom((value) => {
        if (value && new Date(value) <= new Date()) {
          throw new Error("Ngày sự kiện phải trong tương lai");
        }
        return true;
      }),

    body("status")
      .optional()
      .isIn(["draft", "published", "ongoing", "completed", "cancelled"])
      .withMessage("Trạng thái sự kiện không hợp lệ"),

    body("shortDescription")
      .optional()
      .isLength({ max: 300 })
      .withMessage("Mô tả ngắn không được vượt quá 300 ký tự"),

    body("location")
      .optional()
      .isLength({ max: 200 })
      .withMessage("Địa điểm không được vượt quá 200 ký tự"),

    body("maxAttendees")
      .optional()
      .isInt({ min: 1, max: 10000 })
      .withMessage("Số người tối đa phải từ 1 đến 10000"),

    body("ticketPrice")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Giá vé không được âm"),

    body("currency")
      .optional()
      .isIn(["VND", "USD", "EUR"])
      .withMessage("Đồng tiền không hợp lệ"),

    body("category")
      .optional()
      .isIn([
        "conference",
        "workshop",
        "seminar",
        "networking",
        "party",
        "sports",
        "cultural",
        "other",
      ])
      .withMessage("Thể loại sự kiện không hợp lệ"),

    body("tags")
      .optional()
      .isArray({ max: 10 })
      .withMessage("Không được thêm quá 10 tag"),

    body("tags.*")
      .optional()
      .isLength({ max: 50 })
      .withMessage("Tag không được vượt quá 50 ký tự"),

    body("imageUrl")
      .optional()
      .isURL()
      .withMessage("URL hình ảnh không hợp lệ"),

    body("contactInfo.email")
      .optional()
      .isEmail()
      .withMessage("Email liên hệ không hợp lệ"),

    body("contactInfo.phone")
      .optional()
      .matches(/^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/)
      .withMessage("Số điện thoại liên hệ không hợp lệ"),

    handleValidationErrors,
  ],

  // Validation cho lấy event theo ID
  getEventById: [
    param("id").isMongoId().withMessage("ID sự kiện không hợp lệ"),

    handleValidationErrors,
  ],

  // Validation cho xóa event
  deleteEvent: [
    param("id").isMongoId().withMessage("ID sự kiện không hợp lệ"),

    handleValidationErrors,
  ],

  // Validation cho tham gia event
  attendEvent: [
    param("id").isMongoId().withMessage("ID sự kiện không hợp lệ"),

    handleValidationErrors,
  ],

  // Validation cho tìm kiếm event
  searchEvents: [
    query("query")
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage("Từ khóa tìm kiếm phải có 1-100 ký tự"),

    query("category")
      .optional()
      .isIn([
        "conference",
        "workshop",
        "seminar",
        "networking",
        "party",
        "sports",
        "cultural",
        "other",
      ])
      .withMessage("Thể loại sự kiện không hợp lệ"),

    query("status")
      .optional()
      .isIn(["draft", "published", "ongoing", "completed", "cancelled"])
      .withMessage("Trạng thái sự kiện không hợp lệ"),

    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit phải từ 1 đến 100")
      .toInt(),

    handleValidationErrors,
  ],
};

/**
 * Validation rules cho chat
 */
const chatValidators = {
  // Validation cho đăng ký chat
  registerChat: [
    body("userId").isMongoId().withMessage("User ID không hợp lệ"),

    body("name")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Tên phải có 2-100 ký tự")
      .matches(/^[a-zA-ZÀ-ỹ\s]+$/)
      .withMessage("Tên chỉ được chứa chữ cái và khoảng trắng"),

    body("username")
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage("Username phải có 3-50 ký tự")
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage("Username chỉ được chứa chữ cái, số và dấu gạch dưới"),

    body("age")
      .isInt({ min: 13, max: 120 })
      .withMessage("Tuổi phải từ 13 đến 120"),

    body("address")
      .trim()
      .isLength({ min: 5, max: 500 })
      .withMessage("Địa chỉ phải có 5-500 ký tự"),

    body("phone")
      .matches(/^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/)
      .withMessage("Số điện thoại không hợp lệ (định dạng Việt Nam)"),

    body("bio")
      .optional()
      .isLength({ max: 200 })
      .withMessage("Bio không được vượt quá 200 ký tự"),

    body("interests")
      .optional()
      .isArray({ max: 10 })
      .withMessage("Không được thêm quá 10 sở thích"),

    body("interests.*")
      .optional()
      .isLength({ max: 50 })
      .withMessage("Sở thích không được vượt quá 50 ký tự"),

    handleValidationErrors,
  ],

  // Validation cho cập nhật chat user
  updateChatUser: [
    param("id").isMongoId().withMessage("Chat User ID không hợp lệ"),

    body("name")
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Tên phải có 2-100 ký tự")
      .matches(/^[a-zA-ZÀ-ỹ\s]+$/)
      .withMessage("Tên chỉ được chứa chữ cái và khoảng trắng"),

    body("username")
      .optional()
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage("Username phải có 3-50 ký tự")
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage("Username chỉ được chứa chữ cái, số và dấu gạch dưới"),

    body("age")
      .optional()
      .isInt({ min: 13, max: 120 })
      .withMessage("Tuổi phải từ 13 đến 120"),

    body("address")
      .optional()
      .trim()
      .isLength({ min: 5, max: 500 })
      .withMessage("Địa chỉ phải có 5-500 ký tự"),

    body("phone")
      .optional()
      .matches(/^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/)
      .withMessage("Số điện thoại không hợp lệ (định dạng Việt Nam)"),

    body("bio")
      .optional()
      .isLength({ max: 200 })
      .withMessage("Bio không được vượt quá 200 ký tự"),

    body("interests")
      .optional()
      .isArray({ max: 10 })
      .withMessage("Không được thêm quá 10 sở thích"),

    body("interests.*")
      .optional()
      .isLength({ max: 50 })
      .withMessage("Sở thích không được vượt quá 50 ký tự"),

    body("chatSettings.allowDirectMessages")
      .optional()
      .isBoolean()
      .withMessage("Allow direct messages phải là boolean"),

    body("chatSettings.showOnlineStatus")
      .optional()
      .isBoolean()
      .withMessage("Show online status phải là boolean"),

    body("chatSettings.allowFriendRequests")
      .optional()
      .isBoolean()
      .withMessage("Allow friend requests phải là boolean"),

    handleValidationErrors,
  ],

  // Validation cho lấy chat user theo ID
  getChatUserById: [
    param("id").isMongoId().withMessage("Chat User ID không hợp lệ"),

    handleValidationErrors,
  ],

  // Validation cho xóa chat user
  deleteChatUser: [
    param("id").isMongoId().withMessage("Chat User ID không hợp lệ"),

    handleValidationErrors,
  ],

  // Validation cho thêm/xóa bạn bè
  manageFriend: [
    param("id").isMongoId().withMessage("Chat User ID không hợp lệ"),

    param("friendId").isMongoId().withMessage("Friend ID không hợp lệ"),

    handleValidationErrors,
  ],

  // Validation cho lấy danh sách bạn bè
  getFriends: [
    param("id").isMongoId().withMessage("Chat User ID không hợp lệ"),

    handleValidationErrors,
  ],

  // Validation cho tìm kiếm chat users
  searchChatUsers: [
    query("q")
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage("Từ khóa tìm kiếm phải có 1-100 ký tự"),

    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Limit phải từ 1 đến 50")
      .toInt(),

    handleValidationErrors,
  ],

  // Validation cho gửi tin nhắn cá nhân
  sendPrivateMessage: [
    body("recipientId").isMongoId().withMessage("Recipient ID không hợp lệ"),

    body("content")
      .trim()
      .isLength({ min: 1, max: 2000 })
      .withMessage("Nội dung tin nhắn phải có 1-2000 ký tự"),

    body("contentType")
      .optional()
      .isIn(["text", "image", "file", "emoji"])
      .withMessage("Loại nội dung không hợp lệ"),

    body("fileUrl").optional().isURL().withMessage("File URL không hợp lệ"),

    body("fileName")
      .optional()
      .isLength({ max: 255 })
      .withMessage("Tên file không được vượt quá 255 ký tự"),

    body("fileSize")
      .optional()
      .isInt({ min: 0, max: 10485760 }) // Max 10MB
      .withMessage("Kích thước file không hợp lệ"),

    handleValidationErrors,
  ],

  // Validation cho gửi tin nhắn nhóm
  sendGroupMessage: [
    body("groupId").isMongoId().withMessage("Group ID không hợp lệ"),

    body("content")
      .trim()
      .isLength({ min: 1, max: 2000 })
      .withMessage("Nội dung tin nhắn phải có 1-2000 ký tự"),

    body("contentType")
      .optional()
      .isIn(["text", "image", "file", "emoji"])
      .withMessage("Loại nội dung không hợp lệ"),

    body("fileUrl").optional().isURL().withMessage("File URL không hợp lệ"),

    body("fileName")
      .optional()
      .isLength({ max: 255 })
      .withMessage("Tên file không được vượt quá 255 ký tự"),

    body("fileSize")
      .optional()
      .isInt({ min: 0, max: 10485760 }) // Max 10MB
      .withMessage("Kích thước file không hợp lệ"),

    handleValidationErrors,
  ],

  // Validation cho tạo nhóm
  createGroup: [
    body("name")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Tên nhóm phải có 2-100 ký tự")
      .matches(/^[a-zA-ZÀ-ỹ0-9\s]+$/)
      .withMessage("Tên nhóm chỉ được chứa chữ cái, số và khoảng trắng"),

    body("description")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Mô tả nhóm không được vượt quá 500 ký tự"),

    body("members")
      .optional()
      .isArray({ max: 50 })
      .withMessage("Nhóm không được vượt quá 50 thành viên"),

    body("members.*")
      .optional()
      .isMongoId()
      .withMessage("Member ID không hợp lệ"),

    handleValidationErrors,
  ],

  // Validation cho cập nhật nhóm
  updateGroup: [
    param("groupId").isMongoId().withMessage("Group ID không hợp lệ"),

    body("name")
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Tên nhóm phải có 2-100 ký tự")
      .matches(/^[a-zA-ZÀ-ỹ0-9\s]+$/)
      .withMessage("Tên nhóm chỉ được chứa chữ cái, số và khoảng trắng"),

    body("description")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Mô tả nhóm không được vượt quá 500 ký tự"),

    handleValidationErrors,
  ],

  // Validation cho thêm thành viên vào nhóm
  addGroupMember: [
    param("groupId").isMongoId().withMessage("Group ID không hợp lệ"),

    body("userId").isMongoId().withMessage("User ID không hợp lệ"),

    handleValidationErrors,
  ],

  // Validation cho tìm kiếm tin nhắn
  searchMessages: [
    query("q")
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage("Từ khóa tìm kiếm phải có 1-200 ký tự"),

    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Limit phải từ 1 đến 50")
      .toInt(),

    handleValidationErrors,
  ],
};

/**
 * Validation rules chung
 */
const commonValidators = {
  // Validation cho phân trang
  pagination: [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Trang phải là số nguyên dương")
      .toInt(),

    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit phải từ 1 đến 100")
      .toInt(),

    query("sort")
      .optional()
      .isIn(["createdAt", "updatedAt", "name", "date", "title"])
      .withMessage("Sắp xếp không hợp lệ"),

    query("order")
      .optional()
      .isIn(["asc", "desc"])
      .withMessage("Thứ tự sắp xếp không hợp lệ"),

    handleValidationErrors,
  ],

  // Validation cho login
  login: [
    body("email").isEmail().normalizeEmail().withMessage("Email không hợp lệ"),

    body("password").notEmpty().withMessage("Mật khẩu là bắt buộc"),

    body("rememberMe")
      .optional()
      .isBoolean()
      .withMessage("Remember me phải là boolean")
      .toBoolean(),

    handleValidationErrors,
  ],

  // Validation cho MongoDB ID
  mongoId: [
    param("id").isMongoId().withMessage("ID không hợp lệ"),

    handleValidationErrors,
  ],
};

// Export tất cả validators
module.exports = {
  userValidators,
  createNewUserValidators,
  createEventValidators,
  chatValidators,
  commonValidators,
  handleValidationErrors,
};
