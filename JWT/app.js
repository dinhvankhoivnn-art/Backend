const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const expressLayouts = require("express-ejs-layouts");
const { connectDB } = require("./db/connectDB");
const { errorHandler, notFound } = require("./middlewares/errorHandler");
const { userRouter } = require("./routes/userRouter");
const { loginRouter } = require("./routes/loginRouter");
const { webRouter } = require("./routes/webRouter");
const { authMiddleware } = require("./middlewares/authMiddleware");

const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;

// Security middleware
app.use(helmet()); // Security headers
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",")
      : "*",
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Quá nhiều requests từ IP này, vui lòng thử lại sau 15 phút",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Trust proxy (for rate limiting behind reverse proxy)
app.set("trust proxy", 1);

// Set EJS as template engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Use express-ejs-layouts
app.use(expressLayouts);
app.set("layout", "layout");

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Kết nối DB
connectDB();

// Health check endpoint
app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "JWT Authentication API is running",
    version: "1.0.0",
    time: new Date().toISOString(),
  });
});

// Favicon route
app.get("/favicon.ico", (req, res) => {
  res.status(204).end();
});

// Robots.txt
app.get("/robots.txt", (req, res) => {
  res.type('text/plain');
  res.send('User-agent: *\nDisallow: /api/');
});

// Web routes (EJS templates)
app.use("/", webRouter);

// API routes
app.use("/api/auth", loginRouter);
app.use("/api/users", authMiddleware, userRouter);

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  process.exit(0);
});

app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 API URL: http://localhost:${port}`);
});
