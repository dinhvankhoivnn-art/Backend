/**
 * Test cho User model
 * Đảm bảo các static methods, instance methods và virtual fields hoạt động đúng
 */

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const User = require("../../../models/User");

let mongoServer;

// Setup trước khi chạy test
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

// Cleanup sau mỗi test
afterEach(async () => {
  await User.deleteMany({});
  // Clear all mocks
  jest.clearAllMocks();
});

// Cleanup sau khi chạy xong tất cả test
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  // Don't call process.exit() in Jest - let Jest handle cleanup
});

describe("User Model", () => {
  describe("Static Methods", () => {
    beforeEach(async () => {
      // Tạo dữ liệu test
      await User.create([
        {
          name: "Admin User",
          age: 30,
          address: "123 Admin Street",
          email: "admin@example.com",
          pass: "AdminPass123!",
          role: "admin",
        },
        {
          name: "Regular User 1",
          age: 25,
          address: "456 User Street",
          email: "user1@example.com",
          pass: "UserPass123!",
          role: "user",
        },
        {
          name: "Regular User 2",
          age: 28,
          address: "789 User Street",
          email: "user2@example.com",
          pass: "UserPass123!",
          role: "user",
        },
      ]);
    });

    describe("findByEmail", () => {
      test("nên tìm được user theo email hợp lệ", async () => {
        const user = await User.findByEmail("admin@example.com");

        expect(user).toBeTruthy();
        expect(user.email).toBe("admin@example.com");
        expect(user.role).toBe("admin");
      });

      test("nên trả về null khi email không tồn tại", async () => {
        const user = await User.findByEmail("nonexistent@example.com");

        expect(user).toBeNull();
      });

      test("nên tìm được user với email viết hoa (case-insensitive)", async () => {
        const user = await User.findByEmail("ADMIN@EXAMPLE.COM");

        expect(user).toBeTruthy();
        expect(user.email).toBe("admin@example.com");
      });
    });

    describe("getAdmins", () => {
      test("nên trả về danh sách admin", async () => {
        const admins = await User.getAdmins();

        expect(admins).toHaveLength(1);
        expect(admins[0].role).toBe("admin");
        expect(admins[0].email).toBe("admin@example.com");
      });
    });

    describe("getUsers", () => {
      test("nên trả về danh sách user thường", async () => {
        const users = await User.getUsers();

        expect(users).toHaveLength(2);
        users.forEach((user) => {
          expect(user.role).toBe("user");
        });
      });
    });

    describe("countByRole", () => {
      test("nên đếm đúng số lượng user theo role", async () => {
        const stats = await User.countByRole();

        expect(stats.admin).toBe(1);
        expect(stats.user).toBe(2);
      });
    });
  });

  describe("Instance Methods", () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        name: "Test User",
        age: 25,
        address: "123 Test Street",
        email: "test@example.com",
        pass: "TestPass123!",
        role: "user",
      });
    });

    describe("comparePassword", () => {
      test("nên trả về true khi mật khẩu đúng", async () => {
        const isMatch = await testUser.comparePassword("TestPass123!");

        expect(isMatch).toBe(true);
      });

      test("nên trả về false khi mật khẩu sai", async () => {
        const isMatch = await testUser.comparePassword("WrongPassword123!");

        expect(isMatch).toBe(false);
      });
    });

    describe("generateAuthToken", () => {
      test("nên tạo JWT token thành công", () => {
        const token = testUser.generateAuthToken();

        expect(token).toBeDefined();
        expect(typeof token).toBe("string");
        expect(token.split(".").length).toBe(3); // JWT có 3 phần
      });

      test("nên tạo token chứa thông tin đúng", () => {
        const token = testUser.generateAuthToken();
        const { verifyToken } = require("../../../utils/auth");
        const decoded = verifyToken(token);

        expect(decoded.id).toBe(testUser._id.toString());
        expect(decoded.email).toBe("test@example.com");
        expect(decoded.role).toBe("user");
        expect(decoded.name).toBe("Test User");
      });
    });

    describe("isAdmin", () => {
      test("nên trả về false với user thường", () => {
        expect(testUser.isAdmin()).toBe(false);
      });

      test("nên trả về true với admin user", async () => {
        const adminUser = await User.create({
          name: "Admin User",
          age: 30,
          address: "123 Admin Street",
          email: "admin2@example.com",
          pass: "AdminPass123!",
          role: "admin",
        });

        expect(adminUser.isAdmin()).toBe(true);
      });
    });

    describe("isUser", () => {
      test("nên trả về true với user thường", () => {
        expect(testUser.isUser()).toBe(true);
      });

      test("nên trả về false với admin user", async () => {
        const adminUser = await User.create({
          name: "Admin User",
          age: 30,
          address: "123 Admin Street",
          email: "admin3@example.com",
          pass: "AdminPass123!",
          role: "admin",
        });

        expect(adminUser.isUser()).toBe(false);
      });
    });
  });

  describe("Virtual Fields", () => {
    test("ageGroup nên trả về đúng nhóm tuổi", async () => {
      const testCases = [
        { age: 15, expected: "teenager" },
        { age: 20, expected: "young_adult" },
        { age: 35, expected: "adult" },
        { age: 55, expected: "middle_aged" },
        { age: 70, expected: "senior" },
      ];

      for (const testCase of testCases) {
        const user = await User.create({
          name: `User ${testCase.age}`,
          age: testCase.age,
          address: "123 Test Street",
          email: `user${testCase.age}@example.com`,
          pass: "TestPass123!",
          role: "user",
        });

        expect(user.ageGroup).toBe(testCase.expected);
      }
    });
  });

  describe("Pre-save Middleware", () => {
    test("nên hash mật khẩu trước khi lưu", async () => {
      const user = await User.create({
        name: "Password Hash Test User",
        age: 25,
        address: "123 Password Hash Street",
        email: "passwordhashtest@example.com",
        pass: "PlainPassword123!",
        role: "user",
      });

      // Lấy user từ database với select password
      const userWithPass = await User.findById(user._id).select("+pass");

      expect(userWithPass.pass).not.toBe("PlainPassword123!");
      expect(userWithPass.pass).toMatch(/^\$2[aby]?\$/); // bcrypt hash pattern
    });

    test("nên hash mật khẩu khi update", async () => {
      const user = await User.create({
        name: "Update Test User",
        age: 25,
        address: "123 Test Street",
        email: "updatetest@example.com",
        pass: "OriginalPass123!",
        role: "user",
      });

      // Update mật khẩu
      await User.findByIdAndUpdate(user._id, {
        pass: "NewPassword123!",
      });

      // Kiểm tra mật khẩu đã được hash
      const updatedUser = await User.findById(user._id).select("+pass");
      expect(updatedUser.pass).not.toBe("NewPassword123!");
      expect(updatedUser.pass).toMatch(/^\$2[aby]?\$/);
    });

    test("không nên hash lại mật khẩu nếu không thay đổi", async () => {
      const user = await User.create({
        name: "No Change User",
        age: 25,
        address: "123 Test Street",
        email: "nochange@example.com",
        pass: "OriginalPass123!",
        role: "user",
      });

      const originalHash = user.pass;

      // Update thông tin khác (không phải mật khẩu)
      await User.findByIdAndUpdate(user._id, {
        name: "Updated Name",
      });

      const updatedUser = await User.findById(user._id).select("+pass");
      expect(updatedUser.pass).toBe(originalHash); // Hash không thay đổi
    });
  });

  describe("Schema Validation", () => {
    test("nên tạo user thành công với dữ liệu hợp lệ", async () => {
      const validUserData = {
        name: "Valid User",
        age: 25,
        address: "123 Valid Street, Ho Chi Minh City",
        email: "valid@example.com",
        pass: "ValidPass123!",
        role: "user",
      };

      const user = await User.create(validUserData);
      expect(user._id).toBeDefined();
      expect(user.name).toBe(validUserData.name);
      expect(user.email).toBe(validUserData.email);
    });

    test("nên throw error với email không hợp lệ", async () => {
      const invalidUserData = {
        name: "Invalid Email User",
        age: 25,
        address: "123 Test Street",
        email: "invalid-email",
        pass: "ValidPass123!",
        role: "user",
      };

      await expect(User.create(invalidUserData)).rejects.toThrow();
    });

    test("nên throw error với tuổi không hợp lệ", async () => {
      const invalidUserData = {
        name: "Invalid Age User",
        age: 200, // Tuổi quá lớn
        address: "123 Test Street",
        email: "invalidage@example.com",
        pass: "ValidPass123!",
        role: "user",
      };

      await expect(User.create(invalidUserData)).rejects.toThrow();
    });

    test("nên throw error với role không hợp lệ", async () => {
      const invalidUserData = {
        name: "Invalid Role User",
        age: 25,
        address: "123 Test Street",
        email: "invalidrole@example.com",
        pass: "ValidPass123!",
        role: "superadmin", // Role không hợp lệ
      };

      await expect(User.create(invalidUserData)).rejects.toThrow();
    });

    test("nên throw error với mật khẩu quá ngắn", async () => {
      const invalidUserData = {
        name: "Short Password User",
        age: 25,
        address: "123 Test Street",
        email: "shortpass@example.com",
        pass: "Short1!", // Mật khẩu quá ngắn
        role: "user",
      };

      await expect(User.create(invalidUserData)).rejects.toThrow();
    });
  });

  describe("JSON Transformation", () => {
    test("nên ẩn mật khẩu và __v khi convert sang JSON", async () => {
      const user = await User.create({
        name: "JSON Test User",
        age: 25,
        address: "123 Test Street",
        email: "jsontest@example.com",
        pass: "TestPass123!",
        role: "user",
      });

      const userJSON = user.toJSON();

      expect(userJSON.pass).toBeUndefined();
      expect(userJSON.__v).toBeUndefined();
      expect(userJSON.name).toBe("JSON Test User");
      expect(userJSON.email).toBe("jsontest@example.com");
    });

    test("nên ẩn mật khẩu và __v khi convert sang Object", async () => {
      const user = await User.create({
        name: "Object Test User",
        age: 25,
        address: "123 Test Street",
        email: "objecttest@example.com",
        pass: "TestPass123!",
        role: "user",
      });

      const userObject = user.toObject();

      expect(userObject.pass).toBeUndefined();
      expect(userObject.__v).toBeUndefined();
      expect(userObject.name).toBe("Object Test User");
      expect(userObject.email).toBe("objecttest@example.com");
    });
  });

  describe("Timestamps", () => {
    test("nên tự động thêm createdAt và updatedAt", async () => {
      const beforeCreate = new Date();
      const user = await User.create({
        name: "Timestamp Test User",
        age: 25,
        address: "123 Test Street",
        email: "timestamptest@example.com",
        pass: "TestPass123!",
        role: "user",
      });
      const afterCreate = new Date();

      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
      expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreate.getTime()
      );
      expect(user.createdAt.getTime()).toBeLessThanOrEqual(
        afterCreate.getTime()
      );
      expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreate.getTime()
      );
      expect(user.updatedAt.getTime()).toBeLessThanOrEqual(
        afterCreate.getTime()
      );
    });

    test("nên cập nhật updatedAt khi sửa user", async () => {
      const user = await User.create({
        name: "Update Timestamp User",
        age: 25,
        address: "123 Test Street",
        email: "updatetimestamp@example.com",
        pass: "TestPass123!",
        role: "user",
      });

      const originalUpdatedAt = user.updatedAt;

      // Đợi một chút để đảm bảo thời gian khác biệt
      await new Promise((resolve) => setTimeout(resolve, 100));

      await User.findByIdAndUpdate(user._id, { name: "Updated Name" });

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });
  });

  describe("Pre-save Middleware", () => {
    test("nên hash mật khẩu trước khi lưu", async () => {
      const user = await User.create({
        name: "Password Test User",
        age: 25,
        address: "123 Test Street",
        email: "passwordtest@example.com",
        pass: "PlainPassword123!",
        role: "user",
      });

      // Lấy user từ database với select password
      const userWithPass = await User.findById(user._id).select("+pass");

      expect(userWithPass.pass).not.toBe("PlainPassword123!");
      expect(userWithPass.pass).toMatch(/^\$2[aby]?\$/); // bcrypt hash pattern
    });

    test("nên hash mật khẩu khi update", async () => {
      const user = await User.create({
        name: "Update Test User",
        age: 25,
        address: "123 Test Street",
        email: "updatetest@example.com",
        pass: "OriginalPass123!",
        role: "user",
      });

      // Update mật khẩu
      await User.findByIdAndUpdate(user._id, {
        pass: "NewPassword123!",
      });

      // Kiểm tra mật khẩu đã được hash
      const updatedUser = await User.findById(user._id).select("+pass");
      expect(updatedUser.pass).not.toBe("NewPassword123!");
      expect(updatedUser.pass).toMatch(/^\$2[aby]?\$/);
    });

    test("không nên hash lại mật khẩu nếu không thay đổi", async () => {
      const user = await User.create({
        name: "No Change User",
        age: 25,
        address: "123 Test Street",
        email: "nochange@example.com",
        pass: "OriginalPass123!",
        role: "user",
      });

      const originalHash = user.pass;

      // Update thông tin khác (không phải mật khẩu)
      await User.findByIdAndUpdate(user._id, {
        name: "Updated Name",
      });

      const updatedUser = await User.findById(user._id).select("+pass");
      expect(updatedUser.pass).toBe(originalHash); // Hash không thay đổi
    });
  });

  describe("Schema Validation", () => {
    test("nên tạo user thành công với dữ liệu hợp lệ", async () => {
      const validUserData = {
        name: "Valid User",
        age: 25,
        address: "123 Valid Street, Ho Chi Minh City",
        email: "valid@example.com",
        pass: "ValidPass123!",
        role: "user",
      };

      const user = await User.create(validUserData);
      expect(user._id).toBeDefined();
      expect(user.name).toBe(validUserData.name);
      expect(user.email).toBe(validUserData.email);
    });

    test("nên throw error với email không hợp lệ", async () => {
      const invalidUserData = {
        name: "Invalid Email User",
        age: 25,
        address: "123 Test Street",
        email: "invalid-email",
        pass: "ValidPass123!",
        role: "user",
      };

      await expect(User.create(invalidUserData)).rejects.toThrow();
    });

    test("nên throw error với tuổi không hợp lệ", async () => {
      const invalidUserData = {
        name: "Invalid Age User",
        age: 200, // Tuổi quá lớn
        address: "123 Test Street",
        email: "invalidage@example.com",
        pass: "ValidPass123!",
        role: "user",
      };

      await expect(User.create(invalidUserData)).rejects.toThrow();
    });

    test("nên throw error với role không hợp lệ", async () => {
      const invalidUserData = {
        name: "Invalid Role User",
        age: 25,
        address: "123 Test Street",
        email: "invalidrole@example.com",
        pass: "ValidPass123!",
        role: "superadmin", // Role không hợp lệ
      };

      await expect(User.create(invalidUserData)).rejects.toThrow();
    });

    test("nên throw error với mật khẩu quá ngắn", async () => {
      const invalidUserData = {
        name: "Short Password User",
        age: 25,
        address: "123 Test Street",
        email: "shortpass@example.com",
        pass: "Short1!", // Mật khẩu quá ngắn
        role: "user",
      };

      await expect(User.create(invalidUserData)).rejects.toThrow();
    });
  });

  describe("JSON Transformation", () => {
    test("nên ẩn mật khẩu và __v khi convert sang JSON", async () => {
      const user = await User.create({
        name: "JSON Test User",
        age: 25,
        address: "123 Test Street",
        email: "jsontest@example.com",
        pass: "TestPass123!",
        role: "user",
      });

      const userJSON = user.toJSON();

      expect(userJSON.pass).toBeUndefined();
      expect(userJSON.__v).toBeUndefined();
      expect(userJSON.name).toBe("JSON Test User");
      expect(userJSON.email).toBe("jsontest@example.com");
    });

    test("nên ẩn mật khẩu và __v khi convert sang Object", async () => {
      const user = await User.create({
        name: "Object Test User",
        age: 25,
        address: "123 Test Street",
        email: "objecttest@example.com",
        pass: "TestPass123!",
        role: "user",
      });

      const userObject = user.toObject();

      expect(userObject.pass).toBeUndefined();
      expect(userObject.__v).toBeUndefined();
      expect(userObject.name).toBe("Object Test User");
      expect(userObject.email).toBe("objecttest@example.com");
    });
  });

  describe("Timestamps", () => {
    test("nên tự động thêm createdAt và updatedAt", async () => {
      const beforeCreate = new Date();
      const user = await User.create({
        name: "Timestamp Test User",
        age: 25,
        address: "123 Test Street",
        email: "timestamptest@example.com",
        pass: "TestPass123!",
        role: "user",
      });
      const afterCreate = new Date();

      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
      expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreate.getTime()
      );
      expect(user.createdAt.getTime()).toBeLessThanOrEqual(
        afterCreate.getTime()
      );
      expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreate.getTime()
      );
      expect(user.updatedAt.getTime()).toBeLessThanOrEqual(
        afterCreate.getTime()
      );
    });

    test("nên cập nhật updatedAt khi sửa user", async () => {
      const user = await User.create({
        name: "Update Timestamp User",
        age: 25,
        address: "123 Test Street",
        email: "updatetimestamp@example.com",
        pass: "TestPass123!",
        role: "user",
      });

      const originalUpdatedAt = user.updatedAt;

      // Đợi một chút để đảm bảo thời gian khác biệt
      await new Promise((resolve) => setTimeout(resolve, 100));

      await User.findByIdAndUpdate(user._id, { name: "Updated Name" });

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });
  });
});
