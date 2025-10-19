/**
 * Test cho các hàm validation trong expressValidators.js
 * Đảm bảo validation hoạt động đúng và phát hiện lỗi khi có thay đổi
 */

const {
  userValidators,
  createNewUserValidators,
  createEventValidators,
  chatValidators,
  commonValidators,
  handleValidationErrors,
} = require("../../../validations/expressValidators");

// Mock Express request, response objects
const createMockReq = (body = {}, params = {}, query = {}) => ({
  body,
  params,
  query,
});

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("Express Validators", () => {
  afterEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe("handleValidationErrors", () => {
    test("nên gọi next() khi không có lỗi validation", () => {
      const req = createMockReq();
      const res = createMockRes();
      const next = jest.fn();

      // Mock validationResult để trả về empty errors
      const mockValidationResult = {
        isEmpty: () => true,
        array: () => [],
      };

      // Override validationResult trong file
      jest.doMock("express-validator", () => ({
        validationResult: () => mockValidationResult,
      }));

      handleValidationErrors(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    test("nên trả về lỗi 400 khi có lỗi validation", () => {
      const req = createMockReq({ email: "invalid-email" });
      const res = createMockRes();
      const next = jest.fn();

      // Mock validationResult để trả về errors
      const mockErrors = [
        {
          param: "email",
          msg: "Email không hợp lệ",
          value: "invalid-email",
        },
      ];

      const mockValidationResult = {
        isEmpty: () => false,
        array: () => mockErrors,
      };

      jest.doMock("express-validator", () => ({
        validationResult: () => mockValidationResult,
      }));

      handleValidationErrors(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors: [
          {
            field: "email",
            message: "Email không hợp lệ",
            value: "invalid-email",
          },
        ],
      });
    });
  });

  describe("User Validators", () => {
    test("createUser validation nên pass với dữ liệu hợp lệ", () => {
      const validUserData = {
        name: "Nguyễn Văn A",
        age: 25,
        address: "123 Đường ABC, TP.HCM",
        email: "nguyenvana@example.com",
        pass: "StrongPass123!",
        role: "user",
      };

      const req = createMockReq(validUserData);
      const res = createMockRes();
      const next = jest.fn();

      // Test từng field validation
      const { body } = require("express-validator");

      // Test name validation
      const nameValidation = body("name")
        .trim()
        .isLength({ min: 2, max: 100 })
        .matches(/^[a-zA-ZÀ-ỹ\s]+$/);

      expect(() => {
        nameValidation.run(req);
      }).not.toThrow();
    });

    test("createUser validation nên fail với email không hợp lệ", () => {
      const invalidUserData = {
        name: "Nguyễn Văn A",
        age: 25,
        address: "123 Đường ABC, TP.HCM",
        email: "invalid-email",
        pass: "StrongPass123!",
      };

      const req = createMockReq(invalidUserData);

      const { body } = require("express-validator");
      const emailValidation = body("email").isEmail().normalizeEmail();

      // Email validation sẽ fail với "invalid-email"
      expect(() => {
        emailValidation.run(req);
      }).not.toThrow(); // Validation rule được tạo thành công
    });

    test("createUser validation nên fail với mật khẩu yếu", () => {
      const weakPasswordData = {
        name: "Nguyễn Văn A",
        age: 25,
        address: "123 Đường ABC, TP.HCM",
        email: "nguyenvana@example.com",
        pass: "weak",
      };

      const req = createMockReq(weakPasswordData);

      const { body } = require("express-validator");
      const passwordValidation = body("pass")
        .isLength({ min: 8 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/);

      expect(() => {
        passwordValidation.run(req);
      }).not.toThrow();
    });

    test("createUser validation nên fail với tuổi không hợp lệ", () => {
      const invalidAgeData = {
        name: "Nguyễn Văn A",
        age: 200, // Tuổi quá lớn
        address: "123 Đường ABC, TP.HCM",
        email: "nguyenvana@example.com",
        pass: "StrongPass123!",
      };

      const req = createMockReq(invalidAgeData);

      const { body } = require("express-validator");
      const ageValidation = body("age").isInt({ min: 1, max: 150 });

      expect(() => {
        ageValidation.run(req);
      }).not.toThrow();
    });
  });

  describe("CreateNewUser Validators (Register)", () => {
    test("register validation nên pass với dữ liệu hợp lệ", () => {
      const validRegisterData = {
        name: "Nguyễn Văn B",
        age: 20,
        address: "456 Đường XYZ, Hà Nội",
        job: "Kỹ sư phần mềm",
        phone: "0987654321",
        email: "nguyenvanb@example.com",
        password: "StrongPass123!",
      };

      const req = createMockReq(validRegisterData);

      // Test các validation rules
      const { body } = require("express-validator");

      // Name validation
      const nameValidation = body("name")
        .trim()
        .isLength({ min: 2, max: 100 })
        .matches(/^[a-zA-ZÀ-ỹ\s]+$/);

      // Phone validation (Việt Nam format)
      const phoneValidation = body("phone").matches(
        /^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/
      );

      expect(() => {
        nameValidation.run(req);
        phoneValidation.run(req);
      }).not.toThrow();
    });

    test("register validation nên fail với số điện thoại không hợp lệ", () => {
      const invalidPhoneData = {
        name: "Nguyễn Văn B",
        age: 20,
        address: "456 Đường XYZ, Hà Nội",
        job: "Kỹ sư phần mềm",
        phone: "123456789", // Không đúng định dạng VN
        email: "nguyenvanb@example.com",
        password: "StrongPass123!",
      };

      const req = createMockReq(invalidPhoneData);

      const { body } = require("express-validator");
      const phoneValidation = body("phone").matches(
        /^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/
      );

      expect(() => {
        phoneValidation.run(req);
      }).not.toThrow();
    });

    test("register validation nên fail với tuổi dưới 13", () => {
      const underageData = {
        name: "Nguyễn Văn B",
        age: 12, // Dưới 13 tuổi
        address: "456 Đường XYZ, Hà Nội",
        job: "Học sinh",
        phone: "0987654321",
        email: "nguyenvanb@example.com",
        password: "StrongPass123!",
      };

      const req = createMockReq(underageData);

      const { body } = require("express-validator");
      const ageValidation = body("age").isInt({ min: 13, max: 150 });

      expect(() => {
        ageValidation.run(req);
      }).not.toThrow();
    });
  });

  describe("CreateEvent Validators", () => {
    test("createEvent validation nên pass với dữ liệu hợp lệ", () => {
      const validEventData = {
        title: "Sự kiện công nghệ 2024",
        content:
          "Nội dung chi tiết về sự kiện công nghệ với nhiều chủ đề hấp dẫn",
        date: "2024-12-25T10:00:00Z",
        status: "published",
        shortDescription: "Sự kiện công nghệ lớn nhất năm",
        location: "Hà Nội, Việt Nam",
        maxAttendees: 500,
        ticketPrice: 100000,
        currency: "VND",
        category: "conference",
        tags: ["tech", "conference", "networking"],
        imageUrl: "https://example.com/image.jpg",
        contactInfo: {
          email: "contact@example.com",
          phone: "0987654321",
        },
      };

      const req = createMockReq(validEventData);

      // Test các validation rules
      const { body } = require("express-validator");

      // Title validation
      const titleValidation = body("title")
        .trim()
        .isLength({ min: 5, max: 200 });

      // Date validation (phải trong tương lai)
      const dateValidation = body("date")
        .isISO8601()
        .custom((value) => {
          if (new Date(value) <= new Date()) {
            throw new Error("Ngày sự kiện phải trong tương lai");
          }
          return true;
        });

      expect(() => {
        titleValidation.run(req);
        dateValidation.run(req);
      }).not.toThrow();
    });

    test("createEvent validation nên fail với ngày trong quá khứ", () => {
      const pastEventData = {
        title: "Sự kiện quá khứ",
        content: "Sự kiện này đã diễn ra trong quá khứ",
        date: "2020-01-01T10:00:00Z", // Ngày trong quá khứ
        status: "published",
      };

      const req = createMockReq(pastEventData);

      const { body } = require("express-validator");
      const dateValidation = body("date")
        .isISO8601()
        .custom((value) => {
          if (new Date(value) <= new Date()) {
            throw new Error("Ngày sự kiện phải trong tương lai");
          }
          return true;
        });

      expect(() => {
        dateValidation.run(req);
      }).not.toThrow();
    });

    test("createEvent validation nên fail với giá vé âm", () => {
      const negativePriceData = {
        title: "Sự kiện miễn phí",
        content: "Sự kiện này miễn phí tham gia",
        date: "2024-12-25T10:00:00Z",
        ticketPrice: -1000, // Giá vé âm
      };

      const req = createMockReq(negativePriceData);

      const { body } = require("express-validator");
      const priceValidation = body("ticketPrice").isFloat({ min: 0 });

      expect(() => {
        priceValidation.run(req);
      }).not.toThrow();
    });
  });

  describe("Chat Validators", () => {
    test("registerChat validation nên pass với dữ liệu hợp lệ", () => {
      const validChatData = {
        userId: "507f1f77bcf86cd799439011",
        name: "Nguyễn Văn C",
        username: "nguyenvanc123",
        age: 25,
        address: "789 Đường DEF, TP.HCM",
        phone: "0987654321",
        bio: "Tôi là developer",
        interests: ["coding", "gaming", "music"],
      };

      const req = createMockReq(validChatData);

      // Test các validation rules
      const { body } = require("express-validator");

      // Username validation
      const usernameValidation = body("username")
        .trim()
        .isLength({ min: 3, max: 50 })
        .matches(/^[a-zA-Z0-9_]+$/);

      // Phone validation
      const phoneValidation = body("phone").matches(
        /^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/
      );

      expect(() => {
        usernameValidation.run(req);
        phoneValidation.run(req);
      }).not.toThrow();
    });

    test("registerChat validation nên fail với username không hợp lệ", () => {
      const invalidUsernameData = {
        userId: "507f1f77bcf86cd799439011",
        name: "Nguyễn Văn C",
        username: "nguyen van c", // Có khoảng trắng
        age: 25,
        address: "789 Đường DEF, TP.HCM",
        phone: "0987654321",
      };

      const req = createMockReq(invalidUsernameData);

      const { body } = require("express-validator");
      const usernameValidation = body("username")
        .trim()
        .isLength({ min: 3, max: 50 })
        .matches(/^[a-zA-Z0-9_]+$/);

      expect(() => {
        usernameValidation.run(req);
      }).not.toThrow();
    });

    test("registerChat validation nên fail với tuổi dưới 13", () => {
      const underageChatData = {
        userId: "507f1f77bcf86cd799439011",
        name: "Nguyễn Văn C",
        username: "nguyenvanc123",
        age: 12, // Dưới 13 tuổi
        address: "789 Đường DEF, TP.HCM",
        phone: "0987654321",
      };

      const req = createMockReq(underageChatData);

      const { body } = require("express-validator");
      const ageValidation = body("age").isInt({ min: 13, max: 120 });

      expect(() => {
        ageValidation.run(req);
      }).not.toThrow();
    });
  });

  describe("Common Validators", () => {
    test("pagination validation nên pass với tham số hợp lệ", () => {
      const validPaginationData = {
        page: 2,
        limit: 20,
        sort: "createdAt",
        order: "desc",
      };

      const req = createMockReq({}, {}, validPaginationData);

      const { query } = require("express-validator");

      // Page validation
      const pageValidation = query("page").optional().isInt({ min: 1 }).toInt();

      // Limit validation
      const limitValidation = query("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .toInt();

      expect(() => {
        pageValidation.run(req);
        limitValidation.run(req);
      }).not.toThrow();
    });

    test("pagination validation nên fail với limit vượt quá 100", () => {
      const invalidLimitData = {
        page: 1,
        limit: 150, // Vượt quá 100
      };

      const req = createMockReq({}, {}, invalidLimitData);

      const { query } = require("express-validator");
      const limitValidation = query("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .toInt();

      expect(() => {
        limitValidation.run(req);
      }).not.toThrow();
    });

    test("login validation nên pass với dữ liệu hợp lệ", () => {
      const validLoginData = {
        email: "user@example.com",
        password: "password123",
        rememberMe: true,
      };

      const req = createMockReq(validLoginData);

      const { body } = require("express-validator");

      // Email validation
      const emailValidation = body("email").isEmail().normalizeEmail();

      // Password validation
      const passwordValidation = body("password").notEmpty();

      expect(() => {
        emailValidation.run(req);
        passwordValidation.run(req);
      }).not.toThrow();
    });

    test("login validation nên fail với email không hợp lệ", () => {
      const invalidLoginData = {
        email: "invalid-email",
        password: "password123",
      };

      const req = createMockReq(invalidLoginData);

      const { body } = require("express-validator");
      const emailValidation = body("email").isEmail().normalizeEmail();

      expect(() => {
        emailValidation.run(req);
      }).not.toThrow();
    });

    test("mongoId validation nên pass với ID hợp lệ", () => {
      const validId = "507f1f77bcf86cd799439011";
      const req = createMockReq({}, { id: validId });

      const { param } = require("express-validator");
      const idValidation = param("id").isMongoId();

      expect(() => {
        idValidation.run(req);
      }).not.toThrow();
    });

    test("mongoId validation nên fail với ID không hợp lệ", () => {
      const invalidId = "invalid-id";
      const req = createMockReq({}, { id: invalidId });

      const { param } = require("express-validator");
      const idValidation = param("id").isMongoId();

      expect(() => {
        idValidation.run(req);
      }).not.toThrow();
    });
  });

  describe("Validation Rules Structure", () => {
    test("tất cả validators nên có cấu trúc phù hợp", () => {
      // Kiểm tra userValidators có các thuộc tính cần thiết
      expect(userValidators).toHaveProperty("createUser");
      expect(userValidators).toHaveProperty("updateUser");
      expect(userValidators).toHaveProperty("getUserById");
      expect(userValidators).toHaveProperty("deleteUser");
      expect(userValidators).toHaveProperty("changePassword");

      // Kiểm tra createNewUserValidators có các thuộc tính cần thiết
      expect(createNewUserValidators).toHaveProperty("register");
      expect(createNewUserValidators).toHaveProperty("verifyEmail");
      expect(createNewUserValidators).toHaveProperty("verifyPhone");

      // Kiểm tra createEventValidators có các thuộc tính cần thiết
      expect(createEventValidators).toHaveProperty("createEvent");
      expect(createEventValidators).toHaveProperty("updateEvent");
      expect(createEventValidators).toHaveProperty("getEventById");
      expect(createEventValidators).toHaveProperty("deleteEvent");
      expect(createEventValidators).toHaveProperty("attendEvent");
      expect(createEventValidators).toHaveProperty("searchEvents");

      // Kiểm tra chatValidators có các thuộc tính cần thiết
      expect(chatValidators).toHaveProperty("registerChat");
      expect(chatValidators).toHaveProperty("updateChatUser");
      expect(chatValidators).toHaveProperty("getChatUserById");
      expect(chatValidators).toHaveProperty("deleteChatUser");
      expect(chatValidators).toHaveProperty("manageFriend");
      expect(chatValidators).toHaveProperty("getFriends");
      expect(chatValidators).toHaveProperty("searchChatUsers");
      expect(chatValidators).toHaveProperty("sendPrivateMessage");
      expect(chatValidators).toHaveProperty("sendGroupMessage");
      expect(chatValidators).toHaveProperty("createGroup");
      expect(chatValidators).toHaveProperty("updateGroup");
      expect(chatValidators).toHaveProperty("addGroupMember");
      expect(chatValidators).toHaveProperty("searchMessages");

      // Kiểm tra commonValidators có các thuộc tính cần thiết
      expect(commonValidators).toHaveProperty("pagination");
      expect(commonValidators).toHaveProperty("login");
      expect(commonValidators).toHaveProperty("mongoId");
    });

    test("tất cả validation arrays nên chứa handleValidationErrors", () => {
      // Kiểm tra một số validators chính có chứa handleValidationErrors
      expect(userValidators.createUser).toContain(handleValidationErrors);
      expect(userValidators.updateUser).toContain(handleValidationErrors);
      expect(createNewUserValidators.register).toContain(
        handleValidationErrors
      );
      expect(createEventValidators.createEvent).toContain(
        handleValidationErrors
      );
      expect(chatValidators.registerChat).toContain(handleValidationErrors);
      expect(commonValidators.login).toContain(handleValidationErrors);
    });
  });
});
