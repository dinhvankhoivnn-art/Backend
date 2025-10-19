/**
 * Test cho security sanitize middleware
 * Đảm bảo các hàm sanitize hoạt động đúng và phát hiện lỗi khi có thay đổi
 */

const {
  sanitizeString,
  sanitizeHtml,
  sanitizeObject,
  sanitizeBody,
  sanitizeQuery,
  sanitizeParams,
  sanitizeHeaders,
  detectSqlInjection,
  detectXss,
} = require("../../../middlewares/securitySanitize");

describe("Security Sanitize Middleware", () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    mockReq = {
      body: {},
      query: {},
      params: {},
      get: jest.fn(),
      ip: "127.0.0.1",
      originalUrl: "/api/test",
      method: "POST",
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe("sanitizeString", () => {
    test("nên trả về input gốc nếu không phải string", () => {
      expect(sanitizeString(123)).toBe(123);
      expect(sanitizeString(null)).toBe(null);
      expect(sanitizeString(undefined)).toBe(undefined);
      expect(sanitizeString({})).toEqual({});
      expect(sanitizeString([])).toEqual([]);
    });

    test("nên sanitize string input cơ bản", () => {
      const input = "Hello World";
      const result = sanitizeString(input);

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });

    test("nên loại bỏ ký tự control", () => {
      const input = "Hello\x00\x01\x1F\x7FWorld";
      const result = sanitizeString(input);

      expect(result).not.toMatch(/[\x00-\x1F\x7F]/);
    });

    test("nên trim whitespace", () => {
      const input = "  Hello World  ";
      const result = sanitizeString(input);

      expect(result).toBe("Hello World");
    });
  });

  describe("sanitizeHtml", () => {
    test("nên trả về input gốc nếu không phải string", () => {
      expect(sanitizeHtml(123)).toBe(123);
      expect(sanitizeHtml(null)).toBe(null);
    });

    test("nên xử lý HTML input", () => {
      const input = "<p>Hello World</p>";
      const result = sanitizeHtml(input);

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });
  });

  describe("sanitizeObject", () => {
    test("nên trả về input gốc nếu không phải object", () => {
      expect(sanitizeObject("string")).toBe("string");
      expect(sanitizeObject(123)).toBe(123);
      expect(sanitizeObject(null)).toBe(null);
    });

    test("nên sanitize object với string values", () => {
      const input = {
        name: "John",
        content: "<p>Safe content</p>",
        age: 25,
        nested: {
          description: "Nested text",
        },
      };

      const result = sanitizeObject(input);

      expect(result).toBeDefined();
      expect(result.name).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.age).toBe(25);
      expect(result.nested.description).toBeDefined();
    });

    test("nên sanitize array values", () => {
      const input = ["Item 1", "Item 2", { nested: "Nested text" }];

      const result = sanitizeObject(input);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(3);
      expect(result[0]).toBeDefined();
      expect(result[2].nested).toBeDefined();
    });
  });

  describe("sanitizeBody", () => {
    test("nên sanitize request body thành công", () => {
      mockReq.body = {
        name: "John",
        email: "john@example.com",
        age: 25,
      };

      sanitizeBody(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.body.name).toBeDefined();
      expect(mockReq.body.email).toBe("john@example.com");
      expect(mockReq.body.age).toBe(25);
    });

    test("nên bỏ qua khi body không phải object", () => {
      mockReq.body = "not an object";

      sanitizeBody(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.body).toBe("not an object");
    });
  });

  describe("sanitizeQuery", () => {
    test("nên sanitize query parameters", () => {
      mockReq.query = {
        search: "search term",
        page: "1",
        limit: "10",
      };

      sanitizeQuery(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.query.search).toBeDefined();
      expect(mockReq.query.page).toBe("1");
      expect(mockReq.query.limit).toBe("10");
    });

    test("nên bỏ qua khi query không phải object", () => {
      mockReq.query = "not an object";

      sanitizeQuery(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.query).toBe("not an object");
    });
  });

  describe("sanitizeParams", () => {
    test("nên sanitize URL parameters", () => {
      mockReq.params = {
        id: "123",
        category: "tech",
      };

      sanitizeParams(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.params.id).toBeDefined();
      expect(mockReq.params.category).toBe("tech");
    });

    test("nên bỏ qua khi params không phải object", () => {
      mockReq.params = "not an object";

      sanitizeParams(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.params).toBe("not an object");
    });
  });

  describe("sanitizeHeaders", () => {
    test("nên kiểm tra các headers đáng ngờ", () => {
      mockReq.get = jest.fn((header) => {
        const headers = {
          "user-agent": "Mozilla/5.0",
          referer: "https://example.com",
          "x-forwarded-for": "192.168.1.1",
        };
        return headers[header];
      });

      sanitizeHeaders(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    test("nên bỏ qua khi không có headers đáng ngờ", () => {
      mockReq.get = jest.fn((header) => {
        const headers = {
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          referer: "https://trusted-site.com",
          "x-forwarded-for": "192.168.1.1",
        };
        return headers[header];
      });

      sanitizeHeaders(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe("detectSqlInjection", () => {
    test("nên phát hiện SQL injection patterns trong body", () => {
      mockReq.body = {
        username: "admin' OR '1'='1",
        password: "password",
      };

      detectSqlInjection(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Dữ liệu đầu vào chứa ký tự không hợp lệ",
      });
    });

    test("nên phát hiện SQL injection patterns trong query", () => {
      mockReq.query = {
        search: "test'; DROP TABLE users; --",
      };

      detectSqlInjection(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test("nên phát hiện SQL injection patterns trong params", () => {
      mockReq.params = {
        id: "1; DELETE FROM users WHERE 1=1; --",
      };

      detectSqlInjection(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test("nên cho phép dữ liệu bình thường", () => {
      mockReq.body = {
        username: "normal_user",
        email: "user@example.com",
      };
      mockReq.query = {
        page: "1",
        limit: "10",
      };
      mockReq.params = {
        id: "507f1f77bcf86cd799439011",
      };

      detectSqlInjection(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test("nên bỏ qua khi không có dữ liệu để kiểm tra", () => {
      mockReq.body = {};
      mockReq.query = {};
      mockReq.params = {};

      detectSqlInjection(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe("detectXss", () => {
    test("nên phát hiện XSS patterns trong body", () => {
      mockReq.body = {
        content: "<script>alert('XSS')</script>",
        comment: "Normal comment",
      };

      detectXss(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Dữ liệu đầu vào chứa nội dung không an toàn",
      });
    });

    test("nên phát hiện XSS patterns trong query", () => {
      mockReq.query = {
        redirect: "javascript:alert('XSS')",
      };

      detectXss(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test("nên phát hiện các loại XSS patterns khác nhau", () => {
      const xssPayloads = [
        "<iframe src='javascript:alert(1)'></iframe>",
        "<object data='data:text/html,<script>alert(1)</script>'></object>",
        "<embed src='data:text/html,<script>alert(1)</script>'>",
        "expression(alert(1))",
        "vbscript:msgbox(1)",
      ];

      xssPayloads.forEach((payload) => {
        mockReq.body = { content: payload };
        mockRes.status.mockClear();
        mockRes.json.mockClear();
        mockNext.mockClear();

        detectXss(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
      });
    });

    test("nên cho phép nội dung an toàn", () => {
      mockReq.body = {
        title: "Safe Title",
        content:
          "This is safe content with <b>bold</b> and <i>italic</i> text.",
      };

      detectXss(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe("Integration Tests", () => {
    test("nên áp dụng tất cả sanitization steps", () => {
      mockReq.body = {
        name: "John",
        htmlContent: "<p>Safe content</p>",
        age: 25,
      };
      mockReq.query = {
        search: "test",
      };
      mockReq.params = {
        id: "123",
      };

      // Áp dụng tất cả middleware theo thứ tự
      sanitizeHeaders(mockReq, mockRes, () => {
        sanitizeQuery(mockReq, mockRes, () => {
          sanitizeParams(mockReq, mockRes, () => {
            sanitizeBody(mockReq, mockRes, () => {
              detectSqlInjection(mockReq, mockRes, () => {
                detectXss(mockReq, mockRes, mockNext);
              });
            });
          });
        });
      });

      // Kiểm tra rằng các hàm đã được gọi
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
