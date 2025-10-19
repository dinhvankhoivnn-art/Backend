# JWT Authentication API

Một API xác thực JWT hoàn chỉnh với Node.js, Express, MongoDB và Mongoose.

## 🚀 Tính năng

- ✅ **Frontend hoàn chỉnh** với EJS templates
- ✅ **Xác thực JWT** an toàn
- ✅ **Đăng ký và đăng nhập** user
- ✅ **Quản lý user (CRUD)** với giao diện đẹp
- ✅ **Phân quyền admin/user**
- ✅ **Bảo mật cao** với Helmet, CORS, Rate Limiting
- ✅ **Validation dữ liệu** với express-validator
- ✅ **Pagination** cho danh sách user
- ✅ **Tìm kiếm user** theo tên/email/ID
- ✅ **Soft delete** thay vì xóa vĩnh viễn
- ✅ **Error handling** toàn diện
- ✅ **Responsive design** trên mọi thiết bị
- ✅ **Giao diện hiện đại** với CSS animations

## 📋 Yêu cầu hệ thống

- Node.js >= 14.0.0
- MongoDB >= 4.0.0
- npm hoặc yarn

## 🛠️ Cài đặt

1. **Clone repository**
```bash
git clone <repository-url>
cd JWT
```

2. **Cài đặt dependencies**
```bash
npm install
```

3. **Cấu hình environment**
```bash
cp env.example .env
```

4. **Chỉnh sửa file .env**
```env
# Database Configuration
MONGO_URI=mongodb://localhost:27017/jwt_auth
COLLECTION_NAME=users

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_secure
JWT_EXPIRES_IN=1d

# Server Configuration
PORT=5000
NODE_ENV=development

# Security Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Admin Configuration (for seeding)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
ADMIN_NAME=Admin User
ADMIN_PHONE=0123456789
ADMIN_AGE=30
```

5. **Tạo admin user**
```bash
npm run seed
```

6. **Chạy server**
```bash
# Development
npm run dev

# Production
npm start
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký user mới
- `POST /api/auth/login` - Đăng nhập

### Users (Yêu cầu JWT token)
- `GET /api/users` - Lấy danh sách user (Admin only)
- `GET /api/users/search?query=keyword` - Tìm kiếm user (Admin only)
- `GET /api/users/:id` - Lấy thông tin user theo ID
- `POST /api/users` - Tạo user mới
- `PUT /api/users/:id` - Cập nhật user
- `DELETE /api/users/:id` - Xóa user (Admin only)

## 🔐 Authentication

Tất cả các endpoint user đều yêu cầu JWT token trong header:
```
Authorization: Bearer <your-jwt-token>
```

## 📝 Request/Response Examples

### Đăng ký
```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "age": 25,
  "phone": "0123456789",
  "email": "john@example.com",
  "password": "password123"
}
```

### Đăng nhập
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Lấy danh sách user
```bash
GET /api/users?page=1&limit=10
Authorization: Bearer <token>
```

## 🛡️ Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: 100 requests per 15 minutes
- **JWT**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds 12
- **Input Validation**: express-validator
- **Error Handling**: Comprehensive error management

## 🏗️ Project Structure

```
JWT/
├── config/           # Configuration files
├── controllers/       # Route controllers
├── db/               # Database connection
├── helpers/          # Utility functions
├── middlewares/      # Custom middlewares
├── models/           # Mongoose models
├── routes/           # API routes
├── app.js           # Main application file
├── seedAdmin.js     # Admin seeding script
└── package.json     # Dependencies
```

## 🧪 Testing

```bash
# Test đăng ký
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","age":25,"phone":"0123456789","email":"test@example.com","password":"password123"}'

# Test đăng nhập
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 📊 Response Format

Tất cả API responses đều có format chuẩn:

```json
{
  "success": true,
  "message": "Success message",
  "data": { ... },
  "time": "2024-01-01 12:00:00"
}
```

## 🚨 Error Handling

API trả về error codes chuẩn HTTP:
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

## 📄 License

MIT License

## 👨‍💻 Author

Đinh Văn Khôi
