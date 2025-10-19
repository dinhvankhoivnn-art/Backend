/**
 * Test cho error handler middleware
 * Đảm bảo các hàm xử lý lỗi hoạt động đúng và phát hiện lỗi khi có thay đổi
 */

const {
  errorHandlerValidation,
  errorHandlerDatabase,
  errorHandlerJwt,
  errorHandlerAuth,
  errorHandlerRateLimit,
  errorHandlerFileUpload,
  errorHandlerGlobal,
  errorHandlerAsync,
  errorHandler404,
  errorHandlerCsrf,
} = require("../../../middlewares/errorHandler");

// Mock các dependencies
jest.mock("../../../middlewares/loggingError", () => ({
  logErrorToFile: jest.fn(),
}));

// Mock console methods
const originalConsole = { ...console };
beforeEach(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterEach(() => {
  Object.assign(console, originalConsole);
});

describe("Error Handler Middleware", () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    mockReq = {
      originalUrl: "/api/test",
      method: "POST",
      ip: "127.0.0.1",
      user: { id: "user123", role: "user" },
      body: {},
      query: {},
      get: jest.fn((header) => {
        if (header === "User-Agent") return "test-agent";
        return null;
      }),
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      clearCookie: jest.fn(),
      get: jest.fn(() => "60"),
    };

    mockNext = jest.fn();
  });

  describe("errorHandlerValidation", () => {
    test("nên xử lý lỗi ValidationError từ Mongoose", () => {
      const validationError = new Error("Validation failed");
      validationError.name = "ValidationError";
      validationError.errors = {
        name: {
          path: "name",
          message: "Name is required",
          value: "",
        },
        email: {
          path: "email",
          message: "Invalid email format",
          value: "invalid-email",
        },
      };

      errorHandlerValidation(validationError, mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Dữ liệu đầu vào không hợp lệ",
        errors: [
          {
            field: "name",
            message: "Name is required",
            value: "",
          },
          {
            field: "email",
            message: "Invalid email format",
            value: "invalid-email",
          },
        ],
        code: "VALIDATION_ERROR",
      });
    });

    test("nên gọi next() khi không phải ValidationError", () => {
      const otherError = new Error("Other error");

      errorHandlerValidation(otherError, mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(otherError);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe("errorHandlerDatabase", () => {
    test("nên xử lý lỗi duplicate key (11000)", () => {
      const dbError = new Error("Duplicate key error");
      dbError.name = "MongoError";
      dbError.code = 11000;

      errorHandlerDatabase(dbError, mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Dữ liệu đã tồn tại",
        code: "DATABASE_ERROR",
      });
    });

    test("nên xử lý lỗi document validation (121)", () => {
      const dbError = new Error("Document validation failed");
      dbError.name = "MongoServerError";
      dbError.code = 121;

      errorHandlerDatabase(dbError, mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Dữ liệu không hợp lệ",
        code: "DATABASE_ERROR",
      });
    });

    test("nên xử lý lỗi database khác với status 500", () => {
      const dbError = new Error("Connection failed");
      dbError.name = "MongoError";
      dbError.code = 12345;

      errorHandlerDatabase(dbError, mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Lỗi cơ sở dữ liệu",
        code: "DATABASE_ERROR",
      });
    });

    test("nên gọi next() khi không phải MongoError", () => {
      const otherError = new Error("Other error");

      errorHandlerDatabase(otherError, mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(otherError);
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe("errorHandlerJwt", () => {
    test("nên xử lý lỗi JsonWebTokenError", () => {
      const jwtError = new Error("invalid token");
      jwtError.name = "JsonWebTokenError";

      errorHandlerJwt(jwtError, mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Token không hợp lệ",
        code: "INVALID_TOKEN",
      });
    });

    test("nên xử lý lỗi TokenExpiredError", () => {
      const expiredError = new Error("jwt expired");
      expiredError.name = "TokenExpiredError";

      errorHandlerJwt(expiredError, mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Token đã hết hạn",
        code: "TOKEN_EXPIRED",
      });
    });

    test("nên gọi next() khi không phải JWT error", () => {
      const otherError = new Error("Other error");

      errorHandlerJwt(otherError, mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(otherError);
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe("errorHandlerAuth", () => {
    test("nên xử lý lỗi authorization", () => {
      const authError = new Error(
        "User does not have authorization to access this resource"
      );
      authError.requiredRole = "admin";

      errorHandlerAuth(authError, mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Không có quyền truy cập",
        code: "AUTHORIZATION_ERROR",
        requiredRole: "admin",
      });
    });

    test("nên gọi next() khi không phải authorization error", () => {
      const otherError = new Error("Other error");

      errorHandlerAuth(otherError, mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(otherError);
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe("errorHandlerRateLimit", () => {
    test("nên xử lý lỗi rate limit", () => {
      const rateLimitError = new Error(
        "Too many requests, rate limit exceeded"
      );

      errorHandlerRateLimit(rateLimitError, mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Quá nhiều request. Vui lòng thử lại sau.",
        code: "RATE_LIMIT_ERROR",
        retryAfter: "60",
      });
    });

    test("nên gọi next() khi không phải rate limit error", () => {
      const otherError = new Error("Other error");

      errorHandlerRateLimit(otherError, mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(otherError);
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe("errorHandlerFileUpload", () => {
    test("nên xử lý lỗi LIMIT_FILE_SIZE", () => {
      const fileError = new Error("File too large");
      fileError.code = "LIMIT_FILE_SIZE";

      errorHandlerFileUpload(fileError, mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(413);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "File quá lớn",
        code: "FILE_TOO_LARGE",
      });
    });

    test("nên xử lý lỗi LIMIT_UNEXPECTED_FILE", () => {
      const fileError = new Error("Unexpected file");
      fileError.code = "LIMIT_UNEXPECTED_FILE";

      errorHandlerFileUpload(fileError, mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Loại file không được phép",
        code: "INVALID_FILE_TYPE",
      });
    });

    test("nên gọi next() khi không phải file upload error", () => {
      const otherError = new Error("Other error");

      errorHandlerFileUpload(otherError, mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(otherError);
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe("errorHandlerGlobal", () => {
    test("nên xử lý lỗi tổng quát và log chi tiết", () => {
      const { logErrorToFile } = require("../../../middlewares/loggingError");
      const globalError = new Error("Unhandled error occurred");

      errorHandlerGlobal(globalError, mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Đã xảy ra lỗi server",
        code: "INTERNAL_ERROR",
      });

      expect(logErrorToFile).toHaveBeenCalledWith("error", globalError, {
        url: "/api/test",
        method: "POST",
        userId: "user123",
        ip: "127.0.0.1",
        userAgent: "test-agent",
        requestBody: {},
        requestQuery: {},
      });
    });

    test("nên xóa cookie khi có lỗi liên quan đến token", () => {
      const tokenError = new Error("Invalid token provided");

      errorHandlerGlobal(tokenError, mockReq, mockRes, mockNext);

      expect(mockRes.clearCookie).toHaveBeenCalledWith("token");
    });

    test("nên trả về message tùy chỉnh trong development", () => {
      process.env.NODE_ENV = "development";
      const error = new Error("Detailed error message");

      errorHandlerGlobal(error, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Detailed error message",
        code: "INTERNAL_ERROR",
        stack: error.stack,
        details: "Detailed error message",
      });

      delete process.env.NODE_ENV;
    });
  });

  describe("errorHandlerAsync", () => {
    test("nên wrap async function và catch errors", async () => {
      const asyncFunction = jest
        .fn()
        .mockRejectedValue(new Error("Async error"));
      const wrappedFunction = errorHandlerAsync(asyncFunction);

      await wrappedFunction(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    test("nên gọi next() với lỗi khi async function throw", async () => {
      const error = new Error("Test error");
      const asyncFunction = jest.fn().mockRejectedValue(error);
      const wrappedFunction = errorHandlerAsync(asyncFunction);

      await wrappedFunction(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("errorHandler404", () => {
    test("nên trả về lỗi 404 với thông tin chi tiết", () => {
      errorHandler404(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Endpoint không tồn tại",
        code: "NOT_FOUND",
        requestedUrl: "/api/test",
        method: "POST",
      });
    });
  });

  describe("errorHandlerCsrf", () => {
    test("nên xử lý lỗi CSRF token không hợp lệ", () => {
      const csrfError = new Error("Invalid CSRF token");
      csrfError.code = "EBADCSRFTOKEN";

      errorHandlerCsrf(csrfError, mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "CSRF token không hợp lệ",
        code: "CSRF_ERROR",
      });
    });

    test("nên gọi next() khi không phải CSRF error", () => {
      const otherError = new Error("Other error");

      errorHandlerCsrf(otherError, mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(otherError);
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });
});
