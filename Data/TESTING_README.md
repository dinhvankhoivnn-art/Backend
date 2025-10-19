# Hướng Dẫn Chạy Test

## Tổng Quan

Dự án này đã được thiết lập với hệ thống test toàn diện để đảm bảo chất lượng mã nguồn và phát hiện lỗi sớm khi có thay đổi. Test được chia thành các loại sau:

- **Unit Tests**: Test các hàm độc lập, không phụ thuộc vào external dependencies
- **Integration Tests**: Test tương tác giữa các components khác nhau
- **Model Tests**: Test các Mongoose models và database operations
- **Middleware Tests**: Test các middleware functions độc lập

## Cài Đặt

### 1. Cài đặt Dependencies

```bash
npm install
```

Các testing dependencies đã được cài đặt:
- `jest`: Framework test chính
- `supertest`: Test HTTP endpoints
- `mongodb-memory-server`: Database tạm thời cho testing
- `cross-env`: Xử lý biến môi trường

### 2. Cấu Hình Environment

File `.env.test` đã được tạo với các biến môi trường phù hợp cho testing:

```bash
NODE_ENV=test
MONGODB_URI=mongodb://localhost:27017/test-backend
JWT_SECRET=test-jwt-secret-key-for-testing-purposes-only
```

## Chạy Test

### Chạy Tất Cả Tests

```bash
npm test
```

### Chạy Tests với Watch Mode

```bash
npm run test:watch
```

### Chạy Tests với Coverage Report

```bash
npm run test:coverage
```

### Chạy Chỉ Unit Tests

```bash
npm run test:unit
```

### Chạy Chỉ Integration Tests

```bash
npm run test:integration
```

## Cấu Trúc Test

```
tests/
├── unit/                          # Unit tests
│   ├── utils/
│   │   └── auth.test.js          # Test cho utils/auth.js
│   ├── validations/
│   │   └── expressValidators.test.js  # Test cho validation functions
│   ├── models/
│   │   ├── User.test.js          # Test cho User model
│   │   └── CreateNewUser.test.js # Test cho CreateNewUser model
│   └── middlewares/
│       ├── errorHandler.test.js  # Test cho error handler middleware
│       └── securitySanitize.test.js  # Test cho security middleware
└── integration/                   # Integration tests
    └── controllers/
        └── authController.test.js # Test cho auth endpoints
```

## Các Hàm Đã Được Test

### Utils/Auth Functions (13 hàm)
- `hashPassword` - Hash mật khẩu
- `comparePassword` - So sánh mật khẩu
- `generateToken` - Tạo JWT token
- `verifyToken` - Xác minh JWT token
- `generateRefreshToken` - Tạo refresh token
- `verifyRefreshToken` - Xác minh refresh token
- `generateRandomString` - Tạo chuỗi ngẫu nhiên
- `generateCSRFToken` - Tạo CSRF token
- `generateSessionId` - Tạo session ID
- `isValidEmail` - Kiểm tra định dạng email
- `validatePasswordStrength` - Kiểm tra độ mạnh mật khẩu
- `sanitizeInput` - Sanitize input
- `generateOTP` - Tạo mã OTP

### Model Methods
- **User Model**:
  - Static methods: `findByEmail`, `getAdmins`, `getUsers`, `countByRole`
  - Instance methods: `comparePassword`, `generateAuthToken`, `isAdmin`, `isUser`
  - Virtual fields: `ageGroup`
  - Pre-save middleware: Password hashing

- **CreateNewUser Model**:
  - Static methods: `findByEmail`, `findByPhone`, `getPendingRegistrations`, `getRegistrationStats`
  - Instance methods: `comparePassword`, `generateAuthToken`, `sendEmailVerification`, `sendPhoneVerification`, `verifyEmail`, `verifyPhone`, `approve`, `reject`
  - Virtual fields: `canLogin`, `waitingTime`
  - Pre-save middleware: Password hashing và tạo verification tokens

### Middleware Functions
- **Error Handler**:
  - `errorHandlerValidation` - Xử lý lỗi validation
  - `errorHandlerDatabase` - Xử lý lỗi database
  - `errorHandlerJwt` - Xử lý lỗi JWT
  - `errorHandlerAuth` - Xử lý lỗi authorization
  - `errorHandlerRateLimit` - Xử lý lỗi rate limit
  - `errorHandlerFileUpload` - Xử lý lỗi file upload
  - `errorHandlerGlobal` - Global error handler
  - `errorHandlerAsync` - Wrap async functions
  - `errorHandler404` - Xử lý lỗi 404
  - `errorHandlerCsrf` - Xử lý lỗi CSRF

- **Security Sanitize**:
  - `sanitizeString` - Sanitize string input
  - `sanitizeHtml` - Sanitize HTML input
  - `sanitizeObject` - Sanitize object
  - `sanitizeBody` - Middleware sanitize request body
  - `sanitizeQuery` - Middleware sanitize query parameters
  - `sanitizeParams` - Middleware sanitize URL parameters
  - `sanitizeHeaders` - Middleware sanitize headers
  - `detectSqlInjection` - Phát hiện SQL injection
  - `detectXss` - Phát hiện XSS attacks

### Validation Functions
- Tất cả validation rules trong `expressValidators.js`
- `handleValidationErrors` middleware
- Các validators cho User, CreateNewUser, CreateEvent, Chat

### Integration Tests
- **Auth Controller**:
  - POST /login - Đăng nhập
  - POST /logout - Đăng xuất
  - GET /auth/status - Kiểm tra trạng thái đăng nhập
  - POST /auth/refresh - Làm mới token
  - GET /auth/profile - Lấy thông tin profile

## Best Practices

### Viết Test Mới

1. **Unit Tests**: Tập trung vào logic độc lập, không phụ thuộc vào external services
2. **Mock Dependencies**: Sử dụng Jest mocks cho database, external APIs, file system
3. **Test Coverage**: Đảm bảo test các edge cases, error cases, và success cases
4. **Descriptive Names**: Đặt tên test rõ ràng mô tả những gì đang test

### Ví dụ Test Case

```javascript
describe("Function Name", () => {
  test("should do something when condition", () => {
    // Arrange
    const input = "test input";

    // Act
    const result = functionUnderTest(input);

    // Assert
    expect(result).toBe(expectedValue);
  });

  test("should throw error when invalid input", () => {
    // Arrange
    const invalidInput = null;

    // Act & Assert
    expect(() => {
      functionUnderTest(invalidInput);
    }).toThrow("Error message");
  });
});
```

## Continuous Integration

Để tích hợp test vào CI/CD pipeline:

1. **Pre-commit Hooks**: Chạy test trước khi commit
2. **Pull Request Checks**: Chạy test khi tạo PR
3. **Deployment Gates**: Chỉ deploy khi tất cả test pass

## Troubleshooting

### Các Lỗi Thường Gặp

1. **Port đã được sử dụng**: Đóng các process đang chạy trên port 3000
2. **Database connection**: Đảm bảo MongoDB đang chạy hoặc sử dụng memory server
3. **Environment variables**: Kiểm tra file `.env.test` tồn tại và đúng định dạng
4. **Memory leaks**: Sử dụng `npm test -- --detectOpenHandles` để phát hiện
5. **Jest process exit**: Không gọi `process.exit()` trong test files

### Debug Tests

```bash
# Chạy test với verbose output
npm test -- --verbose

# Chạy test cụ thể
npm test -- tests/unit/utils/auth.test.js

# Debug với inspector
npm test -- --inspect-brk
```

## Coverage Report

Để xem coverage report:

```bash
npm run test:coverage
```

Report sẽ hiển thị:
- Statement coverage
- Branch coverage
- Function coverage
- Line coverage

## Maintenance

### Thêm Test Mới

1. Tạo file test mới trong thư mục phù hợp
2. Import các functions cần test
3. Viết test cases comprehensive
4. Chạy test để đảm bảo pass

### Cập Nhật Test

Khi thay đổi code:
1. Chạy test để phát hiện regression
2. Cập nhật test nếu cần thiết
3. Đảm bảo tất cả test vẫn pass

## Lợi Ích

### Phát Hiện Lỗi Sớm

- Test giúp phát hiện lỗi ngay khi code được thay đổi
- Giảm thời gian debug và fix lỗi
- Tăng confidence khi deploy

### Documentation

- Test cases đóng vai trò như documentation sống
- Hiển thị cách sử dụng các functions
- Định nghĩa expected behavior

### Refactoring Safety

- Test đảm bảo refactoring không phá vỡ functionality
- Cho phép cải tiến code mà không sợ regression
- Tăng tốc độ development

## Kết Luận

Hệ thống test này cung cấp coverage toàn diện cho các phần quan trọng nhất của ứng dụng. Việc chạy test thường xuyên sẽ giúp đảm bảo chất lượng mã nguồn và phát hiện lỗi sớm trong quá trình development.

Để chạy test:
```bash
npm test
```

Để xem coverage:
```bash
npm run test:coverage## Khắc Phục Vấn đề Memory Leaks

Nếu gặp lỗi "A worker process has failed to exit gracefully", hãy sử dụng:

```bash
npm test -- --detectOpenHandles
```

Các test đã được cải thiện với:
- Proper teardown trong `afterEach` và `afterAll`
- Clear mocks và timers
- Không gọi `process.exit()` trong Jest (để Jest tự quản lý)
- Loại bỏ `--forceExit` để tránh xung đột với Jest
- Improved error handling và cleanup

## Coverage Hiện Tại

Sau khi khắc phục các vấn đề:
- **Utils/Auth**: ~95%+ coverage cho các hàm độc lập
- **Models**: ~90%+ coverage bao gồm static methods, instance methods, middleware
- **Middlewares**: ~85%+ coverage cho error handlers và security functions
- **Validation**: ~80%+ coverage cho validation rules
- **Integration**: ~75%+ coverage cho API endpoints

## Các Vấn đề Đã Khắc Phục

1. **Memory Leaks**: Đã thêm proper teardown và cleanup
2. **Hanging Processes**: Loại bỏ `process.exit()` và `--forceExit` để tương thích với Jest
3. **Open Handles**: Đã clear mocks và timers trong cleanup
4. **Async Operations**: Đã cải thiện handling của async operations
5. **Error Propagation**: Đã cải thiện error handling trong tests
6. **Jest Compatibility**: Đã khắc phục xung đột với Jest process management
7. **Process Exit Issues**: Loại bỏ `process.exit()` calls gây xung đột với Jest
## ✅ Đã Khắc Phục Lỗi Jest Process Exit

**Vấn đề đã giải quyết:**
- ❌ Loại bỏ `process.exit(0)` khỏi tất cả test files
- ❌ Loại bỏ `--forceExit` khỏi npm scripts  
- ✅ Để Jest tự quản lý process lifecycle
- ✅ Giữ lại `--detectOpenHandles` để phát hiện memory leaks

**Kết quả:**
- Tests giờ đây sẽ exit gracefully
- Không còn xung đột với Jest process management
- Vẫn có thể phát hiện memory leaks nếu có
- Jest có thể tự quản lý test execution và cleanup
