/**
 * Middleware tối ưu hoá performance và security cho hệ thống chat
 * Bao gồm caching, compression, connection pooling và security hardening
 */

const compression = require("compression");
const crypto = require("crypto");

/**
 * 1. Chat Compression - Nén response để tối ưu bandwidth
 * Giảm size response cho chat APIs
 */
const chatCompression = compression({
  level: 6, // Compression level (1-9)
  threshold: 1024, // Chỉ nén response > 1KB
  filter: (req, res) => {
    // Chỉ áp dụng cho chat routes
    if (req.path.startsWith("/chat")) {
      return compression.filter(req, res);
    }
    return false;
  },
});

/**
 * 2. Chat Response Caching - Cache responses cho chat data
 * Cache thông tin user, friends list để giảm database queries
 */
const chatCache = (() => {
  const cache = new Map();
  const CACHE_TTL = 5 * 60 * 1000; // 5 phút

  return {
    set: (key, value) => {
      cache.set(key, {
        data: value,
        timestamp: Date.now(),
        ttl: CACHE_TTL,
      });
    },

    get: (key) => {
      const item = cache.get(key);
      if (!item) return null;

      if (Date.now() - item.timestamp > item.ttl) {
        cache.delete(key);
        return null;
      }

      return item.data;
    },

    delete: (key) => {
      cache.delete(key);
    },

    clear: () => {
      cache.clear();
    },

    middleware: (req, res, next) => {
      // Chỉ cache GET requests
      if (req.method !== "GET") return next();

      const cacheKey = `chat:${req.originalUrl}`;
      const cachedData = chatCache.get(cacheKey);

      if (cachedData) {
        console.log(`💾 Chat Cache Hit: ${cacheKey}`);
        return res.json(cachedData);
      }

      // Override res.json để cache response
      const originalJson = res.json;
      res.json = function (data) {
        chatCache.set(cacheKey, data);
        return originalJson.call(this, data);
      };

      next();
    },
  };
})();

/**
 * 3. Chat Connection Pooling - Quản lý database connections hiệu quả
 * Sử dụng connection pooling để tối ưu database performance
 */
const chatConnectionPool = {
  pool: new Map(),
  maxConnections: 10,
  timeout: 30000, // 30 giây

  getConnection: async (collection) => {
    const poolKey = `chat_${collection}`;

    if (chatConnectionPool.pool.has(poolKey)) {
      const connection = chatConnectionPool.pool.get(poolKey);
      if (Date.now() - connection.created < chatConnectionPool.timeout) {
        return connection.model;
      }
      chatConnectionPool.pool.delete(poolKey);
    }

    // Tạo connection mới nếu chưa có hoặc đã timeout
    if (chatConnectionPool.pool.size < chatConnectionPool.maxConnections) {
      const mongoose = require("mongoose");
      const model = mongoose.model(collection);

      chatConnectionPool.pool.set(poolKey, {
        model,
        created: Date.now(),
        lastUsed: Date.now(),
      });

      console.log(`🔗 New Chat Connection: ${poolKey}`);
      return model;
    }

    throw new Error("Connection pool exhausted");
  },

  middleware: async (req, res, next) => {
    try {
      // Attach connection getter to request
      req.getChatModel = (collection) =>
        chatConnectionPool.getConnection(collection);
      next();
    } catch (error) {
      console.error("❌ Chat Connection Pool Error:", error);
      res.status(500).json({
        success: false,
        message: "Database connection error",
        code: "CHAT_DB_CONNECTION_ERROR",
      });
    }
  },
};

/**
 * 4. Chat Memory Management - Quản lý memory usage
 * Garbage collection và memory monitoring cho chat
 */
const chatMemoryManager = {
  memoryStats: new Map(),

  monitor: (req, res, next) => {
    const startMemory = process.memoryUsage();
    const startTime = process.hrtime.bigint();

    res.on("finish", () => {
      const endMemory = process.memoryUsage();
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1_000_000; // ms

      const memoryDelta = {
        rss: endMemory.rss - startMemory.rss,
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        external: endMemory.external - startMemory.external,
      };

      // Log nếu memory usage quá cao
      if (Math.abs(memoryDelta.heapUsed) > 50 * 1024 * 1024) {
        // 50MB
        console.warn(`🧠 High Chat Memory Usage:`, {
          path: req.path,
          duration: `${duration.toFixed(2)}ms`,
          memoryDelta: {
            heapUsed: `${(memoryDelta.heapUsed / 1024 / 1024).toFixed(2)}MB`,
            rss: `${(memoryDelta.rss / 1024 / 1024).toFixed(2)}MB`,
          },
        });

        // Force garbage collection nếu có
        if (global.gc) {
          global.gc();
          console.log("🗑️ Forced GC for chat memory optimization");
        }
      }
    });

    next();
  },

  cleanup: () => {
    // Cleanup chat cache entries older than 30 minutes
    const now = Date.now();
    const maxAge = 30 * 60 * 1000;

    for (const [key, value] of chatCache.pool || new Map()) {
      if (now - value.timestamp > maxAge) {
        chatCache.pool.delete(key);
      }
    }

    console.log("🧹 Chat Memory Cleanup Completed");
  },
};

/**
 * 5. Chat Request Batching - Batch multiple requests
 * Tối ưu cho bulk operations như get multiple user info
 */
const chatRequestBatching = {
  batchQueue: new Map(),
  batchTimeout: 100, // ms

  middleware: (req, res, next) => {
    // Chỉ áp dụng cho certain endpoints
    if (!req.path.includes("/batch")) {
      return next();
    }

    const batchId = req.body.batchId || crypto.randomUUID();
    const operations = req.body.operations || [];

    if (!chatRequestBatching.batchQueue.has(batchId)) {
      chatRequestBatching.batchQueue.set(batchId, {
        operations: [],
        timeout: setTimeout(() => {
          chatRequestBatching.processBatch(batchId, res);
        }, chatRequestBatching.batchTimeout),
      });
    }

    const batch = chatRequestBatching.batchQueue.get(batchId);
    batch.operations.push(...operations);

    // Nếu đủ operations hoặc force execute
    if (batch.operations.length >= 10 || req.body.forceExecute) {
      clearTimeout(batch.timeout);
      chatRequestBatching.processBatch(batchId, res);
    } else {
      res.json({ batchId, status: "queued", count: batch.operations.length });
    }
  },

  processBatch: async (batchId, res) => {
    const batch = chatRequestBatching.batchQueue.get(batchId);
    if (!batch) return;

    try {
      const results = [];
      for (const operation of batch.operations) {
        // Process each operation
        const result = await chatRequestBatching.executeOperation(operation);
        results.push(result);
      }

      chatRequestBatching.batchQueue.delete(batchId);

      if (res && !res.headersSent) {
        res.json({
          batchId,
          success: true,
          results,
          count: results.length,
        });
      }
    } catch (error) {
      console.error("❌ Chat Batch Processing Error:", error);
      if (res && !res.headersSent) {
        res.status(500).json({
          success: false,
          message: "Batch processing failed",
          code: "CHAT_BATCH_ERROR",
        });
      }
    }
  },

  executeOperation: async (operation) => {
    // Mock operation execution - implement based on needs
    const { type, data } = operation;

    switch (type) {
      case "getUser":
        const UserChatNew = require("../models/UserChatNew");
        return await UserChatNew.findById(data.userId);
      case "getFriends":
        const chatUser = await UserChatNew.findById(data.userId).populate(
          "friends"
        );
        return chatUser?.friends || [];
      default:
        throw new Error(`Unknown operation type: ${type}`);
    }
  },
};

/**
 * 6. Chat Security Headers - Additional security headers
 * Thêm security headers chuyên biệt cho chat
 */
const chatSecurityHeaders = (req, res, next) => {
  // Prevent caching of sensitive chat data
  res.set({
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
    // Prevent clickjacking
    "X-Frame-Options": "DENY",
    // Prevent MIME type sniffing
    "X-Content-Type-Options": "nosniff",
    // Enable XSS protection
    "X-XSS-Protection": "1; mode=block",
    // Custom chat security headers
    "X-Chat-Version": "1.0",
    "X-Chat-Security": "enabled",
    "X-Chat-Request-ID": crypto.randomUUID(),
  });

  next();
};

/**
 * 7. Chat Health Check - Monitoring system health
 * Check health của chat system components
 */
const chatHealthCheck = async (req, res) => {
  const health = {
    timestamp: new Date().toISOString(),
    status: "healthy",
    components: {},
  };

  try {
    // Check database connection
    const mongoose = require("mongoose");
    health.components.database =
      mongoose.connection.readyState === 1 ? "healthy" : "unhealthy";

    // Check cache
    health.components.cache = chatCache ? "healthy" : "unhealthy";

    // Check memory usage
    const memUsage = process.memoryUsage();
    health.components.memory = {
      rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)}MB`,
      heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
      status: memUsage.heapUsed < 500 * 1024 * 1024 ? "healthy" : "warning", // < 500MB
    };

    // Check connection pool
    health.components.connectionPool = {
      active: chatConnectionPool.pool.size,
      max: chatConnectionPool.maxConnections,
      status:
        chatConnectionPool.pool.size < chatConnectionPool.maxConnections
          ? "healthy"
          : "warning",
    };

    // Overall status
    const unhealthyComponents = Object.values(health.components).filter(
      (comp) => typeof comp === "string" && comp === "unhealthy"
    );

    health.status = unhealthyComponents.length === 0 ? "healthy" : "unhealthy";

    res.json(health);
  } catch (error) {
    console.error("❌ Chat Health Check Error:", error);
    res.status(500).json({
      timestamp: new Date().toISOString(),
      status: "unhealthy",
      error: error.message,
    });
  }
};

/**
 * 8. Chat Request Deduplication - Tránh duplicate requests
 * Ngăn gửi duplicate requests trong thời gian ngắn
 */
const chatRequestDeduplication = (() => {
  const requestHashes = new Map();
  const DEDUP_WINDOW = 5000; // 5 giây

  return (req, res, next) => {
    // Tạo hash của request
    const requestData = {
      method: req.method,
      path: req.path,
      body: req.body,
      userId: req.user?.id,
    };

    const hash = crypto
      .createHash("md5")
      .update(JSON.stringify(requestData))
      .digest("hex");

    const now = Date.now();
    const existingRequest = requestHashes.get(hash);

    if (existingRequest && now - existingRequest.timestamp < DEDUP_WINDOW) {
      console.warn(`🔄 Duplicate Chat Request Detected:`, {
        hash,
        path: req.path,
        userId: req.user?.id,
      });

      // Return cached response if available
      if (existingRequest.response) {
        return res.json(existingRequest.response);
      }

      return res.status(429).json({
        success: false,
        message: "Request đang được xử lý. Vui lòng đợi.",
        code: "CHAT_DUPLICATE_REQUEST",
      });
    }

    // Store request hash
    requestHashes.set(hash, { timestamp: now });

    // Override res.json để lưu response
    const originalJson = res.json;
    res.json = function (data) {
      requestHashes.set(hash, {
        timestamp: now,
        response: data,
      });
      return originalJson.call(this, data);
    };

    // Cleanup old hashes
    for (const [key, value] of requestHashes) {
      if (now - value.timestamp > DEDUP_WINDOW) {
        requestHashes.delete(key);
      }
    }

    next();
  };
})();

/**
 * 9. Chat Response Optimization - Tối ưu response format
 * Minimize response size và tối ưu structure
 */
const chatResponseOptimization = (req, res, next) => {
  // Override res.json để tối ưu response
  const originalJson = res.json;
  res.json = function (data) {
    // Nếu request có query param minimize=true, loại bỏ fields không cần thiết
    if (req.query.minimize === "true" && data.success && data.data) {
      data.data = chatResponseOptimization.minimizeObject(data.data);
    }

    return originalJson.call(this, data);
  };

  next();
};

chatResponseOptimization.minimizeObject = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map((item) => chatResponseOptimization.minimizeObject(item));
  }

  if (obj && typeof obj === "object") {
    const minimized = {};
    const keepFields = [
      "_id",
      "name",
      "username",
      "status",
      "avatar",
      "lastOnlineAt",
    ];

    for (const [key, value] of Object.entries(obj)) {
      if (keepFields.includes(key) || key.startsWith("_")) {
        minimized[key] = chatResponseOptimization.minimizeObject(value);
      }
    }

    return minimized;
  }

  return obj;
};

/**
 * 10. Chat Circuit Breaker - Bảo vệ khỏi cascade failures
 * Ngắt kết nối tạm thời nếu system quá tải
 */
const chatCircuitBreaker = (() => {
  let state = "CLOSED"; // CLOSED, OPEN, HALF_OPEN
  let failureCount = 0;
  let lastFailureTime = 0;
  const FAILURE_THRESHOLD = 5;
  const TIMEOUT = 60000; // 1 phút
  const RESET_TIMEOUT = 30000; // 30 giây

  return {
    middleware: (req, res, next) => {
      const now = Date.now();

      if (state === "OPEN") {
        if (now - lastFailureTime > RESET_TIMEOUT) {
          state = "HALF_OPEN";
          console.log("🔄 Chat Circuit Breaker: HALF_OPEN");
        } else {
          return res.status(503).json({
            success: false,
            message: "Chat system tạm thời không khả dụng",
            code: "CHAT_CIRCUIT_OPEN",
            retryAfter: Math.ceil(
              (RESET_TIMEOUT - (now - lastFailureTime)) / 1000
            ),
          });
        }
      }

      // Wrap next() để track failures
      const originalNext = next;
      let called = false;

      const trackFailure = () => {
        if (!called) {
          called = true;
          failureCount++;
          lastFailureTime = now;

          if (failureCount >= FAILURE_THRESHOLD) {
            state = "OPEN";
            console.error("🔴 Chat Circuit Breaker: OPEN (too many failures)");
          }
        }
      };

      res.on("finish", () => {
        if (res.statusCode >= 500) {
          trackFailure();
        } else if (state === "HALF_OPEN") {
          // Success in HALF_OPEN state - reset circuit
          state = "CLOSED";
          failureCount = 0;
          console.log("🟢 Chat Circuit Breaker: CLOSED (recovery successful)");
        }
      });

      res.on("error", trackFailure);

      originalNext();
    },
  };
})();

module.exports = {
  chatCompression,
  chatCache,
  chatConnectionPool,
  chatMemoryManager,
  chatRequestBatching,
  chatSecurityHeaders,
  chatHealthCheck,
  chatRequestDeduplication,
  chatResponseOptimization,
  chatCircuitBreaker,
};
