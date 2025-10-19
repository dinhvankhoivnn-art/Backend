/**
 * Test cho CreateNewUser model
 * Đảm bảo các static methods, instance methods và virtual fields hoạt động đúng
 */

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const CreateNewUser = require("../../../models/CreateNewUser");

let mongoServer;

// Setup trước khi chạy test
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

// Cleanup sau mỗi test
afterEach(async () => {
  await CreateNewUser.deleteMany({});
  // Clear all mocks and timers
  jest.clearAllMocks();
  jest.clearAllTimers();
});

// Cleanup sau khi chạy xong tất cả test
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  // Don't call process.exit() in Jest - let Jest handle cleanup
});

describe("CreateNewUser Model", () => {
  describe("Static Methods", () => {
    beforeEach(async () => {
      // Tạo dữ liệu test với các trạng thái khác nhau
      await CreateNewUser.create([
        {
          name: "Pending User 1",
          age: 20,
          address: "123 Pending Street",
          job: "Developer",
          phone: "0987654321",
          email: "pending1@example.com",
          password: "PendingPass123!",
          status: "pending",
          isEmailVerified: false,
          isPhoneVerified: false,
        },
        {
          name: "Pending User 2",
          age: 25,
          address: "456 Pending Street",
          job: "Designer",
          phone: "0987654322",
          email: "pending2@example.com",
          password: "PendingPass123!",
          status: "pending",
          isEmailVerified: true,
          isPhoneVerified: true,
        },
        {
          name: "Active User",
          age: 30,
          address: "789 Active Street",
          job: "Manager",
          phone: "0987654323",
          email: "active@example.com",
          password: "ActivePass123!",
          status: "active",
          isEmailVerified: true,
          isPhoneVerified: true,
        },
        {
          name: "Blocked User",
          age: 28,
          address: "101 Blocked Street",
          job: "Analyst",
          phone: "0987654324",
          email: "blocked@example.com",
          password: "BlockedPass123!",
          status: "blocked",
          isEmailVerified: true,
          isPhoneVerified: false,
          rejectionReason: "Invalid documents",
        },
      ]);
    });

    describe("findByEmail", () => {
      test("nên tìm được user theo email hợp lệ", async () => {
        const user = await CreateNewUser.findByEmail("active@example.com");

        expect(user).toBeTruthy();
        expect(user.email).toBe("active@example.com");
        expect(user.status).toBe("active");
      });

      test("nên trả về null khi email không tồn tại", async () => {
        const user = await CreateNewUser.findByEmail("nonexistent@example.com");

        expect(user).toBeNull();
      });

      test("nên tìm được user với email viết hoa", async () => {
        const user = await CreateNewUser.findByEmail("ACTIVE@EXAMPLE.COM");

        expect(user).toBeTruthy();
        expect(user.email).toBe("active@example.com");
      });
    });

    describe("findByPhone", () => {
      test("nên tìm được user theo số điện thoại hợp lệ", async () => {
        const user = await CreateNewUser.findByPhone("0987654323");

        expect(user).toBeTruthy();
        expect(user.phone).toBe("0987654323");
        expect(user.name).toBe("Active User");
      });

      test("nên trả về null khi số điện thoại không tồn tại", async () => {
        const user = await CreateNewUser.findByPhone("0000000000");

        expect(user).toBeNull();
      });
    });

    describe("getPendingRegistrations", () => {
      test("nên trả về danh sách đăng ký đang chờ duyệt", async () => {
        const pendingUsers = await CreateNewUser.getPendingRegistrations();

        expect(pendingUsers).toHaveLength(2);
        pendingUsers.forEach((user) => {
          expect(user.status).toBe("pending");
        });
      });

      test("nên sắp xếp theo thời gian tạo giảm dần", async () => {
        const pendingUsers = await CreateNewUser.getPendingRegistrations();

        expect(pendingUsers[0].createdAt.getTime()).toBeGreaterThanOrEqual(
          pendingUsers[1].createdAt.getTime()
        );
      });
    });

    describe("getRegistrationStats", () => {
      test("nên thống kê đúng số lượng theo trạng thái", async () => {
        const stats = await CreateNewUser.getRegistrationStats();

        expect(stats.pending).toBe(2);
        expect(stats.active).toBe(1);
        expect(stats.blocked).toBe(1);
        expect(stats.suspended).toBe(0);
      });
    });
  });

  describe("Instance Methods", () => {
    let testUser;

    beforeEach(async () => {
      testUser = await CreateNewUser.create({
        name: "Test Registration User",
        age: 22,
        address: "123 Test Registration Street",
        job: "Software Engineer",
        phone: "0987654325",
        email: "testregistration@example.com",
        password: "TestRegPass123!",
        status: "pending",
        isEmailVerified: false,
        isPhoneVerified: false,
      });
    });

    describe("comparePassword", () => {
      test("nên trả về true khi mật khẩu đúng", async () => {
        const isMatch = await testUser.comparePassword("TestRegPass123!");

        expect(isMatch).toBe(true);
      });

      test("nên trả về false khi mật khẩu sai", async () => {
        const isMatch = await testUser.comparePassword("WrongPassword123!");

        expect(isMatch).toBe(false);
      });
    });

    describe("generateAuthToken", () => {
      test("nên throw error khi tài khoản chưa được duyệt", () => {
        expect(() => {
          testUser.generateAuthToken();
        }).toThrow("Tài khoản chưa được duyệt");
      });

      test("nên tạo token thành công khi tài khoản đã active", async () => {
        // Cập nhật trạng thái thành active
        testUser.status = "active";
        await testUser.save();

        const token = testUser.generateAuthToken();

        expect(token).toBeDefined();
        expect(typeof token).toBe("string");
        expect(token.split(".").length).toBe(3);

        // Verify token content
        const { verifyToken } = require("../../../utils/auth");
        const decoded = verifyToken(token);

        expect(decoded.id).toBe(testUser._id.toString());
        expect(decoded.email).toBe("testregistration@example.com");
        expect(decoded.role).toBe("user");
      });
    });

    describe("sendEmailVerification", () => {
      test("nên trả về email verification token", () => {
        const consoleSpy = jest.spyOn(console, "log").mockImplementation();

        const token = testUser.sendEmailVerification();

        expect(token).toBe(testUser.emailVerificationToken);
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining(
            "Mã xác minh email cho testregistration@example.com:"
          )
        );

        consoleSpy.mockRestore();
      });
    });

    describe("sendPhoneVerification", () => {
      test("nên trả về phone verification token", () => {
        const consoleSpy = jest.spyOn(console, "log").mockImplementation();

        const token = testUser.sendPhoneVerification();

        expect(token).toBe(testUser.phoneVerificationToken);
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining("Mã xác minh SMS cho 0987654325:")
        );

        consoleSpy.mockRestore();
      });
    });

    describe("verifyEmail", () => {
      test("nên xác minh email thành công với token đúng", () => {
        const result = testUser.verifyEmail(testUser.emailVerificationToken);

        expect(result).toBe(true);
        expect(testUser.isEmailVerified).toBe(true);
        expect(testUser.emailVerificationToken).toBeUndefined();
        expect(testUser.emailVerificationExpires).toBeUndefined();
      });

      test("nên trả về false với token sai", () => {
        const result = testUser.verifyEmail("wrong-token");

        expect(result).toBe(false);
        expect(testUser.isEmailVerified).toBe(false);
      });

      test("nên trả về false với token hết hạn", async () => {
        // Set token hết hạn
        testUser.emailVerificationExpires = new Date(Date.now() - 1000); // 1 giây trước
        await testUser.save();

        const result = testUser.verifyEmail(testUser.emailVerificationToken);

        expect(result).toBe(false);
        expect(testUser.isEmailVerified).toBe(false);
      });
    });

    describe("verifyPhone", () => {
      test("nên xác minh phone thành công với token đúng", () => {
        const result = testUser.verifyPhone(testUser.phoneVerificationToken);

        expect(result).toBe(true);
        expect(testUser.isPhoneVerified).toBe(true);
        expect(testUser.phoneVerificationToken).toBeUndefined();
        expect(testUser.phoneVerificationExpires).toBeUndefined();
      });

      test("nên trả về false với token sai", () => {
        const result = testUser.verifyPhone("wrong-token");

        expect(result).toBe(false);
        expect(testUser.isPhoneVerified).toBe(false);
      });

      test("nên trả về false với token hết hạn", async () => {
        // Set token hết hạn
        testUser.phoneVerificationExpires = new Date(Date.now() - 1000);
        await testUser.save();

        const result = testUser.verifyPhone(testUser.phoneVerificationToken);

        expect(result).toBe(false);
        expect(testUser.isPhoneVerified).toBe(false);
      });
    });

    describe("approve", () => {
      test("nên duyệt đăng ký thành công", () => {
        const adminId = new mongoose.Types.ObjectId();
        const notes = "Approved after document verification";

        testUser.approve(adminId, notes);

        expect(testUser.status).toBe("active");
        expect(testUser.approvedBy.toString()).toBe(adminId.toString());
        expect(testUser.approvedAt).toBeInstanceOf(Date);
        expect(testUser.adminNotes).toBe(notes);
      });

      test("nên duyệt đăng ký với notes rỗng", () => {
        const adminId = new mongoose.Types.ObjectId();

        testUser.approve(adminId);

        expect(testUser.status).toBe("active");
        expect(testUser.approvedBy.toString()).toBe(adminId.toString());
        expect(testUser.adminNotes).toBe("");
      });
    });

    describe("reject", () => {
      test("nên từ chối đăng ký thành công", () => {
        const reason = "Invalid identification documents";

        testUser.reject(reason);

        expect(testUser.status).toBe("blocked");
        expect(testUser.rejectionReason).toBe(reason);
      });
    });
  });

  describe("Virtual Fields", () => {
    test("canLogin nên trả về true khi tất cả điều kiện được thỏa mãn", async () => {
      const user = await CreateNewUser.create({
        name: "Can Login User",
        age: 25,
        address: "123 Can Login Street",
        job: "Developer",
        phone: "0987654326",
        email: "canlogin@example.com",
        password: "CanLoginPass123!",
        status: "active",
        isEmailVerified: true,
        isPhoneVerified: true,
      });

      expect(user.canLogin).toBe(true);
    });

    test("canLogin nên trả về false khi status không phải active", async () => {
      const user = await CreateNewUser.create({
        name: "Cannot Login User",
        age: 25,
        address: "123 Cannot Login Street",
        job: "Developer",
        phone: "0987654327",
        email: "cannotlogin@example.com",
        password: "CannotLoginPass123!",
        status: "pending",
        isEmailVerified: true,
        isPhoneVerified: true,
      });

      expect(user.canLogin).toBe(false);
    });

    test("canLogin nên trả về false khi email chưa xác minh", async () => {
      const user = await CreateNewUser.create({
        name: "Email Not Verified User",
        age: 25,
        address: "123 Email Not Verified Street",
        job: "Developer",
        phone: "0987654328",
        email: "emailnotverified@example.com",
        password: "EmailNotVerifiedPass123!",
        status: "active",
        isEmailVerified: false,
        isPhoneVerified: true,
      });

      expect(user.canLogin).toBe(false);
    });

    test("canLogin nên trả về false khi phone chưa xác minh", async () => {
      const user = await CreateNewUser.create({
        name: "Phone Not Verified User",
        age: 25,
        address: "123 Phone Not Verified Street",
        job: "Developer",
        phone: "0987654329",
        email: "phonenotverified@example.com",
        password: "PhoneNotVerifiedPass123!",
        status: "active",
        isEmailVerified: true,
        isPhoneVerified: false,
      });

      expect(user.canLogin).toBe(false);
    });

    test("waitingTime nên trả về thời gian chờ phù hợp", async () => {
      const user = await CreateNewUser.create({
        name: "Waiting Time User",
        age: 25,
        address: "123 Waiting Time Street",
        job: "Developer",
        phone: "0987654330",
        email: "waitingtime@example.com",
        password: "WaitingTimePass123!",
        status: "pending",
        isEmailVerified: false,
        isPhoneVerified: false,
      });

      expect(user.waitingTime).toBe("Vừa đăng ký");
    });

    test("waitingTime nên trả về null khi status không phải pending", async () => {
      const user = await CreateNewUser.create({
        name: "Not Waiting User",
        age: 25,
        address: "123 Not Waiting Street",
        job: "Developer",
        phone: "0987654331",
        email: "notwaiting@example.com",
        password: "NotWaitingPass123!",
        status: "active",
        isEmailVerified: true,
        isPhoneVerified: true,
      });

      expect(user.waitingTime).toBeNull();
    });
  });

  describe("Pre-save Middleware", () => {
    test("nên hash mật khẩu trước khi lưu", async () => {
      const user = await CreateNewUser.create({
        name: "Password Hash Test User",
        age: 25,
        address: "123 Password Hash Street",
        job: "Developer",
        phone: "0987654332",
        email: "passwordhashtest@example.com",
        password: "PlainPassword123!",
      });

      const userWithPass = await CreateNewUser.findById(user._id).select(
        "+password"
      );

      expect(userWithPass.password).not.toBe("PlainPassword123!");
      expect(userWithPass.password).toMatch(/^\$2[aby]?\$/); // bcrypt hash pattern
    });

    test("nên tạo email verification token khi tạo user mới", async () => {
      const user = await CreateNewUser.create({
        name: "Email Verification Test User",
        age: 25,
        address: "123 Email Verification Street",
        job: "Developer",
        phone: "0987654333",
        email: "emailverificationtest@example.com",
        password: "EmailVerPass123!",
      });

      const userWithTokens = await CreateNewUser.findById(user._id).select(
        "+emailVerificationToken +emailVerificationExpires"
      );

      expect(userWithTokens.emailVerificationToken).toBeDefined();
      expect(userWithTokens.emailVerificationToken.length).toBe(6);
      expect(userWithTokens.emailVerificationExpires).toBeInstanceOf(Date);
    });

    test("nên tạo phone verification token khi tạo user mới", async () => {
      const user = await CreateNewUser.create({
        name: "Phone Verification Test User",
        age: 25,
        address: "123 Phone Verification Street",
        job: "Developer",
        phone: "0987654334",
        email: "phoneverificationtest@example.com",
        password: "PhoneVerPass123!",
      });

      const userWithTokens = await CreateNewUser.findById(user._id).select(
        "+phoneVerificationToken +phoneVerificationExpires"
      );

      expect(userWithTokens.phoneVerificationToken).toBeDefined();
      expect(userWithTokens.phoneVerificationToken.length).toBe(6);
      expect(userWithTokens.phoneVerificationExpires).toBeInstanceOf(Date);
    });

    test("nên tạo verification tokens mới khi cập nhật email/phone", async () => {
      const user = await CreateNewUser.create({
        name: "Update Tokens Test User",
        age: 25,
        address: "123 Update Tokens Street",
        job: "Developer",
        phone: "0987654335",
        email: "updatetokenstest@example.com",
        password: "UpdateTokensPass123!",
      });

      const originalEmailToken = user.emailVerificationToken;
      const originalPhoneToken = user.phoneVerificationToken;

      // Update email và phone
      await CreateNewUser.findByIdAndUpdate(user._id, {
        email: "newemail@example.com",
        phone: "0987654336",
      });

      const updatedUser = await CreateNewUser.findById(user._id).select(
        "+emailVerificationToken +phoneVerificationToken"
      );

      expect(updatedUser.emailVerificationToken).not.toBe(originalEmailToken);
      expect(updatedUser.phoneVerificationToken).not.toBe(originalPhoneToken);
    });
  });

  describe("Schema Validation", () => {
    test("nên tạo user thành công với dữ liệu hợp lệ", async () => {
      const validUserData = {
        name: "Valid Registration User",
        age: 25,
        address: "123 Valid Registration Street, Ho Chi Minh City",
        job: "Software Developer",
        phone: "0987654337",
        email: "validregistration@example.com",
        password: "ValidRegPass123!",
      };

      const user = await CreateNewUser.create(validUserData);
      expect(user._id).toBeDefined();
      expect(user.name).toBe(validUserData.name);
      expect(user.email).toBe(validUserData.email);
      expect(user.status).toBe("pending");
    });

    test("nên throw error với email không hợp lệ", async () => {
      const invalidUserData = {
        name: "Invalid Email User",
        age: 25,
        address: "123 Test Street",
        job: "Developer",
        phone: "0987654338",
        email: "invalid-email",
        password: "ValidPass123!",
      };

      await expect(CreateNewUser.create(invalidUserData)).rejects.toThrow();
    });

    test("nên throw error với số điện thoại không hợp lệ", async () => {
      const invalidUserData = {
        name: "Invalid Phone User",
        age: 25,
        address: "123 Test Street",
        job: "Developer",
        phone: "123456789", // Không đúng định dạng VN
        email: "invalidphone@example.com",
        password: "ValidPass123!",
      };

      await expect(CreateNewUser.create(invalidUserData)).rejects.toThrow();
    });

    test("nên throw error với tuổi dưới 13", async () => {
      const invalidUserData = {
        name: "Underage User",
        age: 12, // Dưới 13 tuổi
        address: "123 Test Street",
        job: "Student",
        phone: "0987654339",
        email: "underage@example.com",
        password: "ValidPass123!",
      };

      await expect(CreateNewUser.create(invalidUserData)).rejects.toThrow();
    });

    test("nên throw error với mật khẩu quá ngắn", async () => {
      const invalidUserData = {
        name: "Short Password User",
        age: 25,
        address: "123 Test Street",
        job: "Developer",
        phone: "0987654340",
        email: "shortpassword@example.com",
        password: "Short1!", // Quá ngắn
      };

      await expect(CreateNewUser.create(invalidUserData)).rejects.toThrow();
    });
  });

  describe("JSON Transformation", () => {
    test("nên ẩn các field nhạy cảm khi convert sang JSON", async () => {
      const user = await CreateNewUser.create({
        name: "JSON Transform Test User",
        age: 25,
        address: "123 JSON Transform Street",
        job: "Developer",
        phone: "0987654341",
        email: "jsontransform@example.com",
        password: "JSONTransformPass123!",
      });

      const userJSON = user.toJSON();

      expect(userJSON.password).toBeUndefined();
      expect(userJSON.emailVerificationToken).toBeUndefined();
      expect(userJSON.emailVerificationExpires).toBeUndefined();
      expect(userJSON.phoneVerificationToken).toBeUndefined();
      expect(userJSON.phoneVerificationExpires).toBeUndefined();
      expect(userJSON.__v).toBeUndefined();

      // Các field khác vẫn có
      expect(userJSON.name).toBe("JSON Transform Test User");
      expect(userJSON.email).toBe("jsontransform@example.com");
      expect(userJSON.status).toBe("pending");
    });
  });

  describe("Pre-save Middleware", () => {
    test("nên hash mật khẩu trước khi lưu", async () => {
      const user = await CreateNewUser.create({
        name: "Password Hash Test User",
        age: 25,
        address: "123 Password Hash Street",
        job: "Developer",
        phone: "0987654332",
        email: "passwordhashtest@example.com",
        password: "PlainPassword123!",
      });

      const userWithPass = await CreateNewUser.findById(user._id).select(
        "+password"
      );

      expect(userWithPass.password).not.toBe("PlainPassword123!");
      expect(userWithPass.password).toMatch(/^\$2[aby]?\$/); // bcrypt hash pattern
    });

    test("nên tạo email verification token khi tạo user mới", async () => {
      const user = await CreateNewUser.create({
        name: "Email Verification Test User",
        age: 25,
        address: "123 Email Verification Street",
        job: "Developer",
        phone: "0987654333",
        email: "emailverificationtest@example.com",
        password: "EmailVerPass123!",
      });

      const userWithTokens = await CreateNewUser.findById(user._id).select(
        "+emailVerificationToken +emailVerificationExpires"
      );

      expect(userWithTokens.emailVerificationToken).toBeDefined();
      expect(userWithTokens.emailVerificationToken.length).toBe(6);
      expect(userWithTokens.emailVerificationExpires).toBeInstanceOf(Date);
    });

    test("nên tạo phone verification token khi tạo user mới", async () => {
      const user = await CreateNewUser.create({
        name: "Phone Verification Test User",
        age: 25,
        address: "123 Phone Verification Street",
        job: "Developer",
        phone: "0987654334",
        email: "phoneverificationtest@example.com",
        password: "PhoneVerPass123!",
      });

      const userWithTokens = await CreateNewUser.findById(user._id).select(
        "+phoneVerificationToken +phoneVerificationExpires"
      );

      expect(userWithTokens.phoneVerificationToken).toBeDefined();
      expect(userWithTokens.phoneVerificationToken.length).toBe(6);
      expect(userWithTokens.phoneVerificationExpires).toBeInstanceOf(Date);
    });

    test("nên tạo verification tokens mới khi cập nhật email/phone", async () => {
      const user = await CreateNewUser.create({
        name: "Update Tokens Test User",
        age: 25,
        address: "123 Update Tokens Street",
        job: "Developer",
        phone: "0987654335",
        email: "updatetokenstest@example.com",
        password: "UpdateTokensPass123!",
      });

      const originalEmailToken = user.emailVerificationToken;
      const originalPhoneToken = user.phoneVerificationToken;

      // Update email và phone
      await CreateNewUser.findByIdAndUpdate(user._id, {
        email: "newemail@example.com",
        phone: "0987654336",
      });

      const updatedUser = await CreateNewUser.findById(user._id).select(
        "+emailVerificationToken +phoneVerificationToken"
      );

      expect(updatedUser.emailVerificationToken).not.toBe(originalEmailToken);
      expect(updatedUser.phoneVerificationToken).not.toBe(originalPhoneToken);
    });
  });

  describe("Schema Validation", () => {
    test("nên tạo user thành công với dữ liệu hợp lệ", async () => {
      const validUserData = {
        name: "Valid Registration User",
        age: 25,
        address: "123 Valid Registration Street, Ho Chi Minh City",
        job: "Software Developer",
        phone: "0987654337",
        email: "validregistration@example.com",
        password: "ValidRegPass123!",
      };

      const user = await CreateNewUser.create(validUserData);
      expect(user._id).toBeDefined();
      expect(user.name).toBe(validUserData.name);
      expect(user.email).toBe(validUserData.email);
      expect(user.status).toBe("pending");
    });

    test("nên throw error với email không hợp lệ", async () => {
      const invalidUserData = {
        name: "Invalid Email User",
        age: 25,
        address: "123 Test Street",
        job: "Developer",
        phone: "0987654338",
        email: "invalid-email",
        password: "ValidPass123!",
      };

      await expect(CreateNewUser.create(invalidUserData)).rejects.toThrow();
    });

    test("nên throw error với số điện thoại không hợp lệ", async () => {
      const invalidUserData = {
        name: "Invalid Phone User",
        age: 25,
        address: "123 Test Street",
        job: "Developer",
        phone: "123456789", // Không đúng định dạng VN
        email: "invalidphone@example.com",
        password: "ValidPass123!",
      };

      await expect(CreateNewUser.create(invalidUserData)).rejects.toThrow();
    });

    test("nên throw error với tuổi dưới 13", async () => {
      const invalidUserData = {
        name: "Underage User",
        age: 12, // Dưới 13 tuổi
        address: "123 Test Street",
        job: "Student",
        phone: "0987654339",
        email: "underage@example.com",
        password: "ValidPass123!",
      };

      await expect(CreateNewUser.create(invalidUserData)).rejects.toThrow();
    });

    test("nên throw error với mật khẩu quá ngắn", async () => {
      const invalidUserData = {
        name: "Short Password User",
        age: 25,
        address: "123 Test Street",
        job: "Developer",
        phone: "0987654340",
        email: "shortpassword@example.com",
        password: "Short1!", // Quá ngắn
      };

      await expect(CreateNewUser.create(invalidUserData)).rejects.toThrow();
    });
  });

  describe("JSON Transformation", () => {
    test("nên ẩn các field nhạy cảm khi convert sang JSON", async () => {
      const user = await CreateNewUser.create({
        name: "JSON Transform Test User",
        age: 25,
        address: "123 JSON Transform Street",
        job: "Developer",
        phone: "0987654341",
        email: "jsontransform@example.com",
        password: "JSONTransformPass123!",
      });

      const userJSON = user.toJSON();

      expect(userJSON.password).toBeUndefined();
      expect(userJSON.emailVerificationToken).toBeUndefined();
      expect(userJSON.emailVerificationExpires).toBeUndefined();
      expect(userJSON.phoneVerificationToken).toBeUndefined();
      expect(userJSON.phoneVerificationExpires).toBeUndefined();
      expect(userJSON.__v).toBeUndefined();

      // Các field khác vẫn có
      expect(userJSON.name).toBe("JSON Transform Test User");
      expect(userJSON.email).toBe("jsontransform@example.com");
      expect(userJSON.status).toBe("pending");
    });
  });
});
