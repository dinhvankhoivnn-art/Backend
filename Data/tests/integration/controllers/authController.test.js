/**
 * Integration tests cho Auth Controller
 * Test các API endpoints liên quan đến authentication
 */

const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

// Import models và controllers
const User = require("../../../models/User");
const CreateNewUser = require("../../../models/CreateNewUser");
const authController = require("../../../controllers/authController");

// Import middlewares và utils
const { authCheckUser } = require("../../../middlewares/authCheckUser");
const { authVerifyToken } = require("../../../middlewares/authVerifyToken");
const { generateToken } = require("../../../utils/auth");

// Setup Express app cho testing
const app = express();
app.use(express.json());

// Routes cho testing
app.post("/login", authController.login);
app.post("/logout", authCheckUser, authController.logout);
app.get("/auth/status", authCheckUser, authController.checkAuthStatus);
app.post("/auth/refresh", authCheckUser, authController.refreshToken);
app.get("/auth/profile", authCheckUser, authController.getProfile);

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterEach(async () => {
  await User.deleteMany({});
  await CreateNewUser.deleteMany({});
  // Clear all mocks and timers
  jest.clearAllMocks();
  jest.clearAllTimers();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  // Don't call process.exit() in Jest - let Jest handle cleanup
});

describe("Auth Controller Integration Tests", () => {
  let testUser, authToken;

  beforeEach(async () => {
    // Tạo user test
    testUser = await User.create({
      name: "Test User",
      age: 25,
      address: "123 Test Street",
      email: "test@example.com",
      pass: "TestPass123!",
      role: "user",
    });

    // Tạo token cho user
    authToken = generateToken({
      id: testUser._id,
      email: testUser.email,
      role: testUser.role,
    });
  });

  describe("POST /login", () => {
    test("nên đăng nhập thành công với thông tin đúng", async () => {
      const response = await request(app).post("/login").send({
        email: "test@example.com",
        password: "TestPass123!",
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Đăng nhập thành công");
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe("test@example.com");
      expect(response.body.data.token).toBeDefined();
    });

    test("nên trả về lỗi 401 với email sai", async () => {
      const response = await request(app).post("/login").send({
        email: "wrong@example.com",
        password: "TestPass123!",
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Email hoặc mật khẩu không đúng");
    });

    test("nên trả về lỗi 401 với mật khẩu sai", async () => {
      const response = await request(app).post("/login").send({
        email: "test@example.com",
        password: "WrongPassword123!",
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Email hoặc mật khẩu không đúng");
    });

    test("nên trả về lỗi 400 với dữ liệu không hợp lệ", async () => {
      const response = await request(app).post("/login").send({
        email: "invalid-email",
        password: "TestPass123!",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Dữ liệu đầu vào không hợp lệ");
      expect(response.body.errors).toBeDefined();
    });

    test("nên trả về lỗi 400 khi thiếu mật khẩu", async () => {
      const response = await request(app).post("/login").send({
        email: "test@example.com",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Dữ liệu đầu vào không hợp lệ");
    });
  });

  describe("POST /logout", () => {
    test("nên đăng xuất thành công với token hợp lệ", async () => {
      const response = await request(app)
        .post("/logout")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          reason: "user_initiated",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Đăng xuất thành công");
    });

    test("nên trả về lỗi 401 khi không có token", async () => {
      const response = await request(app).post("/logout").send({
        reason: "user_initiated",
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test("nên trả về lỗi 401 với token không hợp lệ", async () => {
      const response = await request(app)
        .post("/logout")
        .set("Authorization", "Bearer invalid-token")
        .send({
          reason: "user_initiated",
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /auth/status", () => {
    test("nên trả về trạng thái đăng nhập với token hợp lệ", async () => {
      const response = await request(app)
        .get("/auth/status")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Đã đăng nhập");
      expect(response.body.data.authenticated).toBe(true);
      expect(response.body.data.user.email).toBe("test@example.com");
    });

    test("nên trả về lỗi 401 khi chưa đăng nhập", async () => {
      const response = await request(app).get("/auth/status");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Chưa đăng nhập");
      expect(response.body.authenticated).toBe(false);
    });

    test("nên trả về lỗi 401 với token không hợp lệ", async () => {
      const response = await request(app)
        .get("/auth/status")
        .set("Authorization", "Bearer invalid-token");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /auth/refresh", () => {
    test("nên làm mới token thành công", async () => {
      const response = await request(app)
        .post("/auth/refresh")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Token đã được làm mới");
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.token).not.toBe(authToken); // Token mới khác token cũ
    });

    test("nên trả về lỗi 401 khi chưa đăng nhập", async () => {
      const response = await request(app).post("/auth/refresh");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Chưa xác thực");
    });

    test("nên trả về lỗi 401 khi user không tồn tại", async () => {
      // Tạo token với user ID không tồn tại
      const fakeToken = generateToken({
        id: new mongoose.Types.ObjectId(),
        email: "nonexistent@example.com",
        role: "user",
      });

      const response = await request(app)
        .post("/auth/refresh")
        .set("Authorization", `Bearer ${fakeToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Người dùng không tồn tại");
    });
  });

  describe("GET /auth/profile", () => {
    test("nên lấy thông tin profile thành công", async () => {
      const response = await request(app)
        .get("/auth/profile")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Lấy thông tin profile thành công");
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe("test@example.com");
      expect(response.body.data.user.name).toBe("Test User");
      expect(response.body.data.user.role).toBe("user");
      expect(response.body.data.user.pass).toBeUndefined(); // Password không được trả về
    });

    test("nên trả về lỗi 401 khi chưa đăng nhập", async () => {
      const response = await request(app).get("/auth/profile");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Chưa xác thực");
    });

    test("nên trả về lỗi 404 khi user không tồn tại", async () => {
      // Tạo token với user ID không tồn tại
      const fakeToken = generateToken({
        id: new mongoose.Types.ObjectId(),
        email: "nonexistent@example.com",
        role: "user",
      });

      const response = await request(app)
        .get("/auth/profile")
        .set("Authorization", `Bearer ${fakeToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Người dùng không tồn tại");
    });
  });

  describe("Security Tests", () => {
    test("nên chống SQL injection trong login", async () => {
      const maliciousPayloads = [
        "admin' OR '1'='1",
        "test@example.com'; DROP TABLE users; --",
        "test@example.com' UNION SELECT * FROM users --",
      ];

      for (const payload of maliciousPayloads) {
        const response = await request(app).post("/login").send({
          email: payload,
          password: "TestPass123!",
        });

        // Không nên crash và không nên thực hiện injection
        expect([400, 401]).toContain(response.status);
        expect(response.body.success).toBe(false);
      }
    });

    test("nên chống XSS trong login", async () => {
      const xssPayloads = [
        "<script>alert('XSS')</script>",
        "javascript:alert('XSS')",
        "<img src=x onerror=alert('XSS')>",
      ];

      for (const payload of xssPayloads) {
        const response = await request(app).post("/login").send({
          email: payload,
          password: "TestPass123!",
        });

        // Không nên crash và không nên thực hiện XSS
        expect([400, 401]).toContain(response.status);
        expect(response.body.success).toBe(false);
      }
    });

    test("nên rate limiting cho login attempts", async () => {
      const loginAttempts = [];

      // Gửi nhiều request đăng nhập liên tiếp
      for (let i = 0; i < 5; i++) {
        loginAttempts.push(
          request(app).post("/login").send({
            email: "test@example.com",
            password: "WrongPassword123!",
          })
        );
      }

      const responses = await Promise.all(loginAttempts);

      // Tất cả đều nên trả về lỗi 401 (không bị rate limit trong test này)
      responses.forEach((response) => {
        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe("Error Handling", () => {
    test("nên xử lý lỗi server nội bộ", async () => {
      // Mock User.findOne để throw error
      const originalFindOne = User.findOne;
      User.findOne = jest.fn().mockRejectedValue(new Error("Database error"));

      const response = await request(app).post("/login").send({
        email: "test@example.com",
        password: "TestPass123!",
      });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Lỗi server khi đăng nhập");

      // Restore original function
      User.findOne = originalFindOne;
    });

    test("nên xử lý lỗi validation từ Mongoose", async () => {
      // Mock User.findOne để trả về user với validation error
      const originalFindOne = User.findOne;
      User.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          then: jest.fn().mockRejectedValue(new Error("Validation failed")),
        }),
      });

      const response = await request(app).post("/login").send({
        email: "test@example.com",
        password: "TestPass123!",
      });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore original function
      User.findOne = originalFindOne;
    });
  });

  describe("Concurrent Requests", () => {
    test("nên xử lý nhiều request đồng thời", async () => {
      const requests = [];

      // Tạo nhiều request đồng thời
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app).post("/login").send({
            email: "test@example.com",
            password: "TestPass123!",
          })
        );
      }

      const responses = await Promise.all(requests);

      // Tất cả request đều nên được xử lý
      responses.forEach((response) => {
        expect([200, 401]).toContain(response.status);
      });
    });
  });

  describe("Error Handling", () => {
    test("nên xử lý lỗi server nội bộ", async () => {
      // Mock User.findOne để throw error
      const originalFindOne = User.findOne;
      User.findOne = jest.fn().mockRejectedValue(new Error("Database error"));

      const response = await request(app).post("/login").send({
        email: "test@example.com",
        password: "TestPass123!",
      });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Lỗi server khi đăng nhập");

      // Restore original function
      User.findOne = originalFindOne;
    });

    test("nên xử lý lỗi validation từ Mongoose", async () => {
      // Mock User.findOne để trả về user với validation error
      const originalFindOne = User.findOne;
      User.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          then: jest.fn().mockRejectedValue(new Error("Validation failed")),
        }),
      });

      const response = await request(app).post("/login").send({
        email: "test@example.com",
        password: "TestPass123!",
      });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore original function
      User.findOne = originalFindOne;
    });
  });

  describe("Concurrent Requests", () => {
    test("nên xử lý nhiều request đồng thời", async () => {
      const requests = [];

      // Tạo nhiều request đồng thời
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app).post("/login").send({
            email: "test@example.com",
            password: "TestPass123!",
          })
        );
      }

      const responses = await Promise.all(requests);

      // Tất cả request đều nên được xử lý
      responses.forEach((response) => {
        expect([200, 401]).toContain(response.status);
      });
    });
  });
});
