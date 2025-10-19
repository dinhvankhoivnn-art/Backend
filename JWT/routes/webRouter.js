const express = require("express");
const { authMiddleware } = require("../middlewares/authMiddleware");

const webRouter = express.Router();

// Middleware để kiểm tra authentication cho web routes
const checkAuth = (req, res, next) => {
  // Kiểm tra token từ localStorage (client-side)
  // Vì đây là SPA, chúng ta sẽ để client xử lý authentication
  next();
};

// Trang chủ
webRouter.get("/", (req, res) => {
  res.render('index', { 
    title: 'JWT User Management'
  });
});

// Trang đăng nhập
webRouter.get("/login", (req, res) => {
  res.render('login', { 
    title: 'Đăng nhập'
  });
});

// Trang đăng ký
webRouter.get("/register", (req, res) => {
  res.render('register', { 
    title: 'Đăng ký'
  });
});

// Dashboard (yêu cầu authentication)
webRouter.get("/dashboard", checkAuth, (req, res) => {
  res.render('dashboard', { 
    title: 'Dashboard'
  });
});

// Logout
webRouter.get("/logout", (req, res) => {
  res.clearCookie('authToken');
  res.redirect('/');
});

module.exports = {
  webRouter,
};
