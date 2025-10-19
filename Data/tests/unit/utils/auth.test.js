/**
 * Test cho các hàm tiện ích authentication
 * Đảm bảo các hàm hoạt động đúng và phát hiện lỗi khi có thay đổi
 */

const {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateRandomString,
  generateCSRFToken,
  generateSessionId,
  isValidEmail,
  validatePasswordStrength,
  sanitizeInput,
  generateOTP,
} = require("../../../utils/auth");

// Mock process.env cho testing
const originalEnv = process.env;

describe("Auth Utils", () => {
  beforeEach(() => {
    // Reset environment variables trước mỗi test
    process.env = { ...originalEnv };
    process.env.JWT_SECRET = "test-jwt-secret-key";
  });

  afterAll(() => {
    // Khôi phục environment variables sau tất cả tests
    process.env = originalEnv;
    // Clear all mocks and timers
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe("hashPassword", () => {
    test("nên hash mật khẩu thành công", async () => {
      const password = "TestPassword123!";
      const hashedPassword = await hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(typeof hashedPassword).toBe("string");
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(50); // bcrypt hash thường dài
    });

    test("nên throw error khi password rỗng", async () => {
      await expect(hashPassword("")).rejects.toThrow("Không thể hash mật khẩu");
    });

    test("nên throw error khi password null/undefined", async () => {
      await expect(hashPassword(null)).rejects.toThrow(
        "Không thể hash mật khẩu"
      );
      await expect(hashPassword(undefined)).rejects.toThrow(
        "Không thể hash mật khẩu"
      );
    });
  });

  describe("comparePassword", () => {
    test("nên trả về true khi mật khẩu khớp", async () => {
      const password = "TestPassword123!";
      const hashedPassword = await hashPassword(password);
      const isMatch = await comparePassword(password, hashedPassword);

      expect(isMatch).toBe(true);
    });

    test("nên trả về false khi mật khẩu không khớp", async () => {
      const password = "TestPassword123!";
      const wrongPassword = "WrongPassword123!";
      const hashedPassword = await hashPassword(password);
      const isMatch = await comparePassword(wrongPassword, hashedPassword);

      expect(isMatch).toBe(false);
    });

    test("nên throw error khi password rỗng", async () => {
      const hashedPassword = await hashPassword("TestPassword123!");
      await expect(comparePassword("", hashedPassword)).rejects.toThrow(
        "Không thể xác minh mật khẩu"
      );
    });
  });

  describe("generateToken", () => {
    test("nên tạo token thành công với payload hợp lệ", () => {
      const payload = { userId: "12345", email: "test@example.com" };
      const token = generateToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".").length).toBe(3); // JWT có 3 phần
    });

    test("nên tạo token với thời gian hết hạn tùy chỉnh", () => {
      const payload = { userId: "12345" };
      const token = generateToken(payload, "1h");

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
    });

    test("nên throw error khi không có JWT_SECRET", () => {
      delete process.env.JWT_SECRET;

      expect(() => {
        generateToken({ userId: "12345" });
      }).toThrow("JWT_SECRET không được cấu hình");
    });

    test("nên tạo token với các thông tin chuẩn", () => {
      const payload = { userId: "12345", role: "admin" };
      const token = generateToken(payload);

      // Verify token để kiểm tra nội dung
      const decoded = verifyToken(token);
      expect(decoded.userId).toBe("12345");
      expect(decoded.role).toBe("admin");
      expect(decoded.iss).toBe("backend-api");
      expect(decoded.aud).toBe("backend-users");
    });
  });

  describe("verifyToken", () => {
    test("nên xác minh token hợp lệ thành công", () => {
      const payload = { userId: "12345", email: "test@example.com" };
      const token = generateToken(payload);
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe("12345");
      expect(decoded.email).toBe("test@example.com");
    });

    test("nên trả về null khi token không hợp lệ", () => {
      const invalidToken = "invalid.jwt.token";
      const decoded = verifyToken(invalidToken);

      expect(decoded).toBeNull();
    });

    test("nên trả về null khi token hết hạn", () => {
      // Tạo token hết hạn ngay lập tức
      const payload = { userId: "12345" };
      const token = generateToken(payload, "-1ms");
      const decoded = verifyToken(token);

      expect(decoded).toBeNull();
    });

    test("nên trả về null khi không có JWT_SECRET", () => {
      const payload = { userId: "12345" };
      const token = generateToken(payload);

      delete process.env.JWT_SECRET;

      const decoded = verifyToken(token);
      expect(decoded).toBeNull();
    });
  });

  describe("generateRefreshToken", () => {
    test("nên tạo refresh token thành công", () => {
      const payload = { userId: "12345" };
      const refreshToken = generateRefreshToken(payload);

      expect(refreshToken).toBeDefined();
      expect(typeof refreshToken).toBe("string");
      expect(refreshToken.split(".").length).toBe(3);
    });

    test("nên tạo refresh token với thông tin chuẩn", () => {
      const payload = { userId: "12345", role: "user" };
      const refreshToken = generateRefreshToken(payload);

      const decoded = verifyRefreshToken(refreshToken);
      expect(decoded.userId).toBe("12345");
      expect(decoded.role).toBe("user");
      expect(decoded.aud).toBe("backend-refresh");
    });
  });

  describe("verifyRefreshToken", () => {
    test("nên xác minh refresh token hợp lệ", () => {
      const payload = { userId: "12345" };
      const refreshToken = generateRefreshToken(payload);
      const decoded = verifyRefreshToken(refreshToken);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe("12345");
    });

    test("nên trả về null khi refresh token không hợp lệ", () => {
      const invalidToken = "invalid.refresh.token";
      const decoded = verifyRefreshToken(invalidToken);

      expect(decoded).toBeNull();
    });
  });

  describe("generateRandomString", () => {
    test("nên tạo chuỗi ngẫu nhiên với độ dài mặc định", () => {
      const randomString = generateRandomString();

      expect(randomString).toBeDefined();
      expect(typeof randomString).toBe("string");
      expect(randomString.length).toBe(64); // 32 bytes * 2 hex chars
    });

    test("nên tạo chuỗi ngẫu nhiên với độ dài tùy chỉnh", () => {
      const length = 16;
      const randomString = generateRandomString(length);

      expect(randomString.length).toBe(32); // 16 bytes * 2 hex chars
    });

    test("nên tạo các chuỗi khác nhau mỗi lần gọi", () => {
      const string1 = generateRandomString(8);
      const string2 = generateRandomString(8);

      expect(string1).not.toBe(string2);
    });
  });

  describe("generateCSRFToken", () => {
    test("nên tạo CSRF token với độ dài chuẩn", () => {
      const csrfToken = generateCSRFToken();

      expect(csrfToken).toBeDefined();
      expect(typeof csrfToken).toBe("string");
      expect(csrfToken.length).toBe(32); // 16 bytes * 2 hex chars
    });

    test("nên tạo các CSRF token khác nhau mỗi lần", () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();

      expect(token1).not.toBe(token2);
    });
  });

  describe("generateSessionId", () => {
    test("nên tạo session ID duy nhất", () => {
      const sessionId = generateSessionId();

      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe("string");
      expect(sessionId.length).toBeGreaterThan(50); // SHA256 hash
    });

    test("nên tạo các session ID khác nhau mỗi lần", () => {
      const sessionId1 = generateSessionId();
      const sessionId2 = generateSessionId();

      expect(sessionId1).not.toBe(sessionId2);
    });
  });

  describe("isValidEmail", () => {
    test("nên trả về true với email hợp lệ", () => {
      const validEmails = [
        "test@example.com",
        "user.name@domain.co.uk",
        "user+tag@example.org",
        "123@domain.com",
      ];

      validEmails.forEach((email) => {
        expect(isValidEmail(email)).toBe(true);
      });
    });

    test("nên trả về false với email không hợp lệ", () => {
      const invalidEmails = [
        "invalid-email",
        "@domain.com",
        "user@",
        "user..name@domain.com",
        "user@domain",
        "",
        null,
        undefined,
      ];

      invalidEmails.forEach((email) => {
        expect(isValidEmail(email)).toBe(false);
      });
    });
  });

  describe("validatePasswordStrength", () => {
    test("nên xác thực mật khẩu mạnh thành công", () => {
      const strongPassword = "StrongPass123!";
      const result = validatePasswordStrength(strongPassword);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test("nên phát hiện mật khẩu quá ngắn", () => {
      const shortPassword = "Short1!";
      const result = validatePasswordStrength(shortPassword);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Mật khẩu phải có ít nhất 8 ký tự");
    });

    test("nên phát hiện thiếu chữ thường", () => {
      const noLowerCase = "NOLOWERCASE123!";
      const result = validatePasswordStrength(noLowerCase);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Mật khẩu phải chứa ít nhất một chữ cái thường"
      );
    });

    test("nên phát hiện thiếu chữ hoa", () => {
      const noUpperCase = "nouppercase123!";
      const result = validatePasswordStrength(noUpperCase);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Mật khẩu phải chứa ít nhất một chữ cái hoa"
      );
    });

    test("nên phát hiện thiếu chữ số", () => {
      const noNumber = "NoNumber!";
      const result = validatePasswordStrength(noNumber);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Mật khẩu phải chứa ít nhất một chữ số");
    });

    test("nên phát hiện thiếu ký tự đặc biệt", () => {
      const noSpecial = "NoSpecial123";
      const result = validatePasswordStrength(noSpecial);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Mật khẩu phải chứa ít nhất một ký tự đặc biệt"
      );
    });

    test("nên trả về tất cả lỗi cho mật khẩu yếu", () => {
      const weakPassword = "weak";
      const result = validatePasswordStrength(weakPassword);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(3);
    });
  });

  describe("sanitizeInput", () => {
    test("nên sanitize các ký tự đặc biệt", () => {
      const input = '<script>alert("xss")</script>&"\'/';
      const sanitized = sanitizeInput(input);

      expect(sanitized).not.toContain("<");
      expect(sanitized).not.toContain(">");
      expect(sanitized).not.toContain('"');
      expect(sanitized).toContain("<");
      expect(sanitized).toContain(">");
    });

    test("nên trả về input gốc nếu không phải string", () => {
      expect(sanitizeInput(123)).toBe(123);
      expect(sanitizeInput(null)).toBe(null);
      expect(sanitizeInput(undefined)).toBe(undefined);
      expect(sanitizeInput({})).toEqual({});
    });

    test("nên xử lý string rỗng", () => {
      expect(sanitizeInput("")).toBe("");
    });

    test("nên xử lý string bình thường", () => {
      const normalInput = "This is a normal string";
      expect(sanitizeInput(normalInput)).toBe(normalInput);
    });
  });

  describe("generateOTP", () => {
    test("nên tạo OTP với độ dài mặc định (6)", () => {
      const otp = generateOTP();

      expect(otp).toBeDefined();
      expect(typeof otp).toBe("string");
      expect(otp.length).toBe(6);
      expect(/^\d+$/.test(otp)).toBe(true); // Chỉ chứa chữ số
    });

    test("nên tạo OTP với độ dài tùy chỉnh", () => {
      const length = 8;
      const otp = generateOTP(length);

      expect(otp.length).toBe(length);
      expect(/^\d+$/.test(otp)).toBe(true);
    });

    test("nên tạo OTP chỉ chứa chữ số", () => {
      const otp = generateOTP(10);

      expect(/^\d+$/.test(otp)).toBe(true);
      expect(/[a-zA-Z]/.test(otp)).toBe(false);
    });

    test("nên tạo các OTP khác nhau mỗi lần", () => {
      const otp1 = generateOTP();
      const otp2 = generateOTP();

      expect(otp1).not.toBe(otp2);
    });
  });
});
