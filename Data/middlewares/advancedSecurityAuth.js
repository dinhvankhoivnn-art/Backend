/**
 * Middleware xác thực bảo mật cao cấp với 2FA, OTP và mã dự phòng
 * Hệ thống xác thực đa lớp với bảo mật tối ưu
 */

const crypto = require("crypto");
const User = require("../models/User");
const { generateOTP, sendEmailOTP } = require("../utils/otpService");
const { generateSecureKey } = require("../utils/faceEncryption");

// ============================================================================
// CẤU HÌNH BẢO MẬT NÂNG CAO
// ============================================================================

const SECURITY_CONFIG = {
  // Thời gian hết hạn OTP (15 phút)
  OTP_EXPIRY: 15 * 60 * 1000,

  // Thời gian hết hạn mã dự phòng (15 phút)
  BACKUP_CODE_EXPIRY: 15 * 60 * 1000,

  // Số lần thử OTP tối đa
  MAX_OTP_ATTEMPTS: 3,

  // Thời gian khóa tài khoản sau nhiều lần thử sai
  LOCKOUT_DURATION: 30 * 60 * 1000, // 30 phút

  // Độ dài mã dự phòng
  BACKUP_CODE_LENGTH: 10,

  // Số lượng mã dự phòng
  BACKUP_CODES_COUNT: 10,

  // Thời gian chờ giữa các lần gửi OTP
  OTP_COOLDOWN: 60 * 1000, // 1 phút
};

// ============================================================================
// LỚP QUẢN LÝ XÁC THỰC ĐA LỚP
// ============================================================================

class MultiFactorAuthManager {
  constructor() {
    this.otpStore = new Map(); // Lưu trữ OTP tạm thời
    this.backupCodeStore = new Map(); // Lưu trữ mã dự phòng
    this.failedAttempts = new Map(); // Theo dõi lần thử thất bại
    this.lockoutStore = new Map(); // Theo dõi tài khoản bị khóa
    this.otpCooldown = new Map(); // Theo dõi thời gian chờ gửi OTP

    // Khởi tạo cleanup tự động
    this.initializeCleanup();
  }

  /**
   * Khởi tạo hệ thống cleanup tự động
   */
  initializeCleanup() {
    // Cleanup mỗi 5 phút
    setInterval(() => {
      this.cleanupExpiredData();
    }, 5 * 60 * 1000);
  }

  /**
   * Cleanup dữ liệu hết hạn
   */
  cleanupExpiredData() {
    const now = Date.now();

    // Cleanup OTP hết hạn
    for (const [key, data] of this.otpStore.entries()) {
      if (data.expiresAt < now) {
        this.otpStore.delete(key);
      }
    }

    // Cleanup mã dự phòng hết hạn
    for (const [key, data] of this.backupCodeStore.entries()) {
      if (data.expiresAt < now) {
        this.backupCodeStore.delete(key);
      }
    }

    // Cleanup thông tin khóa tài khoản hết hạn
    for (const [key, lockoutTime] of this.lockoutStore.entries()) {
      if (lockoutTime < now) {
        this.lockoutStore.delete(key);
      }
    }

    // Cleanup thông tin cooldown hết hạn
    for (const [key, cooldownTime] of this.otpCooldown.entries()) {
      if (cooldownTime < now) {
        this.otpCooldown.delete(key);
      }
    }
  }

  /**
   * Tạo và gửi OTP qua email
   */
  async generateAndSendOTP(user, req) {
    try {
      // Kiểm tra tài khoản có bị khóa không
      if (this.isAccountLocked(user._id)) {
        throw new Error("Tài khoản đã bị khóa tạm thời do nhiều lần thử sai");
      }

      // Kiểm tra thời gian chờ gửi OTP
      if (this.isInOTPCooldown(user._id)) {
        const remainingTime = this.getRemainingCooldownTime(user._id);
        throw new Error(
          `Vui lòng chờ ${Math.ceil(
            remainingTime / 1000
          )} giây trước khi gửi OTP mới`
        );
      }

      // Tạo OTP đặc biệt với độ bảo mật cao
      const otpData = this.generateSecureOTP(user, req);

      // Lưu trữ OTP
      this.storeOTP(user._id, otpData);

      // Gửi OTP qua email
      await this.sendOTPEmail(user, otpData.otp, req);

      // Đặt thời gian chờ cho lần gửi tiếp theo
      this.setOTPCooldown(user._id);

      return {
        success: true,
        message: "OTP đã được gửi đến email của bạn",
        otpId: otpData.id,
        expiresIn: SECURITY_CONFIG.OTP_EXPIRY / 1000,
      };
    } catch (error) {
      throw new Error(`Lỗi gửi OTP: ${error.message}`);
    }
  }

  /**
   * Tạo OTP bảo mật cao
   */
  generateSecureOTP(user, req) {
    // Tạo OTP 8 chữ số với độ bảo mật cao
    const otp = this.generateNumericOTP(8);

    // Tạo ID duy nhất cho OTP này
    const otpId = crypto.randomBytes(16).toString("hex");

    // Tạo key mã hóa đặc biệt
    const encryptionKey = generateSecureKey(user._id, req.sessionID, "otp");

    // Mã hóa OTP
    const encryptedOTP = this.encryptOTP(otp, encryptionKey);

    // Thời gian hết hạn
    const expiresAt = Date.now() + SECURITY_CONFIG.OTP_EXPIRY;

    return {
      id: otpId,
      otp: otp,
      encryptedOTP: encryptedOTP,
      key: encryptionKey,
      expiresAt: expiresAt,
      attempts: 0,
      createdAt: Date.now(),
      userAgent: req.get("User-Agent"),
      ipAddress: req.ip,
      sessionId: req.sessionID,
    };
  }

  /**
   * Tạo OTP số với độ bảo mật cao
   */
  generateNumericOTP(length) {
    const digits = "0123456789";
    let otp = "";

    // Đảm bảo OTP không bắt đầu bằng 0
    otp += digits.charAt(Math.floor(Math.random() * 9) + 1);

    // Tạo các chữ số còn lại
    for (let i = 1; i < length; i++) {
      otp += digits.charAt(Math.floor(Math.random() * digits.length));
    }

    return otp;
  }

  /**
   * Mã hóa OTP đặc biệt
   */
  encryptOTP(otp, key) {
    const algorithm = "aes-256-gcm";
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key.substring(0, 32));

    const encrypted = Buffer.concat([
      cipher.update(otp, "utf8"),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return {
      encrypted: encrypted.toString("base64"),
      iv: iv.toString("base64"),
      authTag: authTag.toString("base64"),
    };
  }

  /**
   * Giải mã OTP
   */
  decryptOTP(encryptedOTP, key) {
    try {
      const algorithm = "aes-256-gcm";
      const decipher = crypto.createDecipher(algorithm, key.substring(0, 32));

      decipher.setAuthTag(Buffer.from(encryptedOTP.authTag, "base64"));

      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encryptedOTP.encrypted, "base64")),
        decipher.final(),
      ]);

      return decrypted.toString("utf8");
    } catch (error) {
      throw new Error("Không thể giải mã OTP");
    }
  }

  /**
   * Lưu trữ OTP bảo mật
   */
  storeOTP(userId, otpData) {
    const key = `${userId}:${otpData.id}`;
    this.otpStore.set(key, otpData);
  }

  /**
   * Xác minh OTP
   */
  async verifyOTP(userId, otpId, providedOTP, req) {
    try {
      const key = `${userId}:${otpId}`;
      const otpData = this.otpStore.get(key);

      // Kiểm tra OTP có tồn tại không
      if (!otpData) {
        throw new Error("OTP không hợp lệ hoặc đã hết hạn");
      }

      // Kiểm tra thời hạn OTP
      if (otpData.expiresAt < Date.now()) {
        this.otpStore.delete(key);
        throw new Error("OTP đã hết hạn");
      }

      // Kiểm tra số lần thử
      if (otpData.attempts >= SECURITY_CONFIG.MAX_OTP_ATTEMPTS) {
        this.otpStore.delete(key);
        this.recordFailedAttempt(userId);
        throw new Error("Đã vượt quá số lần thử OTP cho phép");
      }

      // Kiểm tra thông tin request
      if (!this.validateOTPRequest(otpData, req)) {
        otpData.attempts++;
        throw new Error("Thông tin xác thực không khớp");
      }

      // Giải mã và kiểm tra OTP
      const decryptedOTP = this.decryptOTP(otpData.encryptedOTP, otpData.key);

      if (decryptedOTP !== providedOTP) {
        otpData.attempts++;
        this.recordFailedAttempt(userId);
        throw new Error("OTP không chính xác");
      }

      // OTP chính xác - xóa khỏi store và trả về thành công
      this.otpStore.delete(key);

      return {
        success: true,
        message: "Xác thực OTP thành công",
        timestamp: Date.now(),
      };
    } catch (error) {
      throw new Error(`Lỗi xác minh OTP: ${error.message}`);
    }
  }

  /**
   * Validate thông tin request OTP
   */
  validateOTPRequest(otpData, req) {
    // Kiểm tra session ID
    if (otpData.sessionId !== req.sessionID) {
      return false;
    }

    // Kiểm tra IP address (cho phép một khoảng thay đổi nhỏ)
    if (otpData.ipAddress !== req.ip) {
      // Có thể kiểm tra mạng con cùng
      const otpIP = otpData.ipAddress.split(".").slice(0, 3).join(".");
      const reqIP = req.ip.split(".").slice(0, 3).join(".");
      if (otpIP !== reqIP) {
        return false;
      }
    }

    // Kiểm tra User-Agent (cho phép thay đổi nhỏ)
    if (otpData.userAgent !== req.get("User-Agent")) {
      // Có thể kiểm tra một phần User-Agent
      const otpUA = otpData.userAgent.substring(0, 50);
      const reqUA = req.get("User-Agent").substring(0, 50);
      if (otpUA !== reqUA) {
        return false;
      }
    }

    return true;
  }

  /**
   * Gửi OTP qua email
   */
  async sendOTPEmail(user, otp, req) {
    try {
      const emailData = {
        to: user.email,
        subject: "Mã xác thực 2FA - Hệ thống bảo mật cao cấp",
        html: this.generateOTPEmailTemplate(user, otp, req),
        otp: otp,
        userId: user._id,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      };

      await sendEmailOTP(emailData);

      // Log gửi OTP thành công
      console.log(`📧 OTP sent to ${user.email}:`, {
        userId: user._id,
        otpId: "HIDDEN",
        ipAddress: req.ip,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error(`❌ Failed to send OTP to ${user.email}:`, error);
      throw new Error("Không thể gửi OTP qua email");
    }
  }

  /**
   * Tạo template email OTP bảo mật
   */
  generateOTPEmailTemplate(user, otp, req) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Mã xác thực 2FA</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-code { font-size: 32px; font-weight: bold; color: #667eea; text-align: center; margin: 30px 0; letter-spacing: 5px; }
          .security-info { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .warning { color: #dc3545; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Xác thực 2FA</h1>
            <p>Hệ thống bảo mật cao cấp</p>
          </div>

          <div class="content">
            <h2>Xin chào ${user.name},</h2>

            <p>Bạn đang thực hiện xác thực 2FA để truy cập vào hệ thống với tính năng bảo mật cao.</p>

            <div class="otp-code">
              ${otp}
            </div>

            <div class="security-info">
              <h3>⚠️ Thông tin bảo mật:</h3>
              <p><strong>Mã OTP này sẽ hết hạn sau 15 phút</strong></p>
              <p><strong>Không chia sẻ mã này với bất kỳ ai</strong></p>
              <p><strong>Thời gian: ${new Date().toLocaleString(
                "vi-VN"
              )}</strong></p>
              <p><strong>IP: ${req.ip}</strong></p>
            </div>

            <p>Nếu bạn không thực hiện yêu cầu này, vui lòng:</p>
            <ol>
              <li>Đổi mật khẩu ngay lập tức</li>
              <li>Liên hệ với bộ phận bảo mật</li>
              <li>Kiểm tra hoạt động tài khoản</li>
            </ol>

            <p class="warning">
              Lưu ý: Hệ thống sẽ khóa tài khoản sau ${
                SECURITY_CONFIG.MAX_OTP_ATTEMPTS
              } lần thử sai liên tiếp.
            </p>
          </div>

          <div class="footer">
            <p>© 2024 Hệ thống bảo mật cao cấp. Tất cả quyền được bảo lưu.</p>
            <p>Email này được gửi tự động, vui lòng không trả lời.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Tạo mã dự phòng đặc biệt
   */
  async generateBackupCodes(userId, sessionId) {
    try {
      const codes = [];
      const encryptedCodes = [];

      // Tạo key đặc biệt cho mã dự phòng
      const backupKey = generateSecureKey(userId, sessionId, "backup-codes");

      for (let i = 0; i < SECURITY_CONFIG.BACKUP_CODES_COUNT; i++) {
        // Tạo mã dự phòng 10 ký tự
        const code = this.generateBackupCode();

        // Mã hóa mã dự phòng
        const encryptedCode = this.encryptBackupCode(code, backupKey);

        codes.push(code);
        encryptedCodes.push(encryptedCode);
      }

      // Lưu trữ mã dự phòng đã mã hóa
      this.storeBackupCodes(userId, {
        codes: encryptedCodes,
        key: backupKey,
        createdAt: Date.now(),
        expiresAt: Date.now() + SECURITY_CONFIG.BACKUP_CODE_EXPIRY,
        usedCodes: [],
      });

      return {
        codes: codes,
        expiresAt: Date.now() + SECURITY_CONFIG.BACKUP_CODE_EXPIRY,
        instructions: [
          "Lưu trữ các mã này ở nơi an toàn",
          "Mỗi mã chỉ sử dụng được một lần",
          "Các mã sẽ hết hạn sau 15 phút",
          "Không chia sẻ với bất kỳ ai",
        ],
      };
    } catch (error) {
      throw new Error(`Lỗi tạo mã dự phòng: ${error.message}`);
    }
  }

  /**
   * Tạo mã dự phòng đặc biệt
   */
  generateBackupCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";

    for (let i = 0; i < SECURITY_CONFIG.BACKUP_CODE_LENGTH; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return code;
  }

  /**
   * Mã hóa mã dự phòng
   */
  encryptBackupCode(code, key) {
    const algorithm = "aes-256-cbc";
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key.substring(0, 32));

    const encrypted = Buffer.concat([
      iv,
      cipher.update(code, "utf8"),
      cipher.final(),
    ]);

    return {
      encrypted: encrypted.toString("base64"),
      iv: iv.toString("base64"),
    };
  }

  /**
   * Giải mã mã dự phòng
   */
  decryptBackupCode(encryptedCode, key) {
    try {
      const algorithm = "aes-256-cbc";
      const iv = Buffer.from(encryptedCode.iv, "base64");
      const decipher = crypto.createDecipher(algorithm, key.substring(0, 32));

      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encryptedCode.encrypted, "base64")),
        decipher.final(),
      ]);

      return decrypted.toString("utf8");
    } catch (error) {
      throw new Error("Không thể giải mã mã dự phòng");
    }
  }

  /**
   * Lưu trữ mã dự phòng
   */
  storeBackupCodes(userId, backupData) {
    this.backupCodeStore.set(userId, backupData);
  }

  /**
   * Xác minh mã dự phòng
   */
  async verifyBackupCode(userId, providedCode, req) {
    try {
      const backupData = this.backupCodeStore.get(userId);

      if (!backupData) {
        throw new Error("Không tìm thấy mã dự phòng cho tài khoản này");
      }

      // Kiểm tra thời hạn
      if (backupData.expiresAt < Date.now()) {
        this.backupCodeStore.delete(userId);
        throw new Error("Mã dự phòng đã hết hạn");
      }

      // Tìm mã dự phòng phù hợp
      let foundCode = null;
      let codeIndex = -1;

      for (let i = 0; i < backupData.codes.length; i++) {
        try {
          const decryptedCode = this.decryptBackupCode(
            backupData.codes[i],
            backupData.key
          );

          if (
            decryptedCode === providedCode &&
            !backupData.usedCodes.includes(i)
          ) {
            foundCode = decryptedCode;
            codeIndex = i;
            break;
          }
        } catch (error) {
          // Bỏ qua lỗi giải mã
          continue;
        }
      }

      if (!foundCode) {
        this.recordFailedAttempt(userId);
        throw new Error("Mã dự phòng không hợp lệ hoặc đã được sử dụng");
      }

      // Đánh dấu mã đã sử dụng
      backupData.usedCodes.push(codeIndex);

      // Nếu đã sử dụng hết tất cả mã, xóa khỏi store
      if (backupData.usedCodes.length >= SECURITY_CONFIG.BACKUP_CODES_COUNT) {
        this.backupCodeStore.delete(userId);
      }

      return {
        success: true,
        message: "Xác thực mã dự phòng thành công",
        timestamp: Date.now(),
      };
    } catch (error) {
      throw new Error(`Lỗi xác minh mã dự phòng: ${error.message}`);
    }
  }

  /**
   * Kiểm tra tài khoản có bị khóa không
   */
  isAccountLocked(userId) {
    const lockoutTime = this.lockoutStore.get(userId);
    return lockoutTime && lockoutTime > Date.now();
  }

  /**
   * Kiểm tra có trong thời gian chờ gửi OTP không
   */
  isInOTPCooldown(userId) {
    const cooldownTime = this.otpCooldown.get(userId);
    return cooldownTime && cooldownTime > Date.now();
  }

  /**
   * Lấy thời gian chờ còn lại
   */
  getRemainingCooldownTime(userId) {
    const cooldownTime = this.otpCooldown.get(userId);
    return cooldownTime ? cooldownTime - Date.now() : 0;
  }

  /**
   * Đặt thời gian chờ gửi OTP
   */
  setOTPCooldown(userId) {
    this.otpCooldown.set(userId, Date.now() + SECURITY_CONFIG.OTP_COOLDOWN);
  }

  /**
   * Ghi nhận lần thử thất bại
   */
  recordFailedAttempt(userId) {
    if (!this.failedAttempts.has(userId)) {
      this.failedAttempts.set(userId, {
        count: 0,
        lastAttempt: Date.now(),
      });
    }

    const attempts = this.failedAttempts.get(userId);
    attempts.count++;
    attempts.lastAttempt = Date.now();

    // Khóa tài khoản nếu vượt quá giới hạn
    if (attempts.count >= SECURITY_CONFIG.MAX_OTP_ATTEMPTS) {
      this.lockoutStore.set(
        userId,
        Date.now() + SECURITY_CONFIG.LOCKOUT_DURATION
      );
    }
  }

  /**
   * Reset thông tin xác thực của user
   */
  resetUserAuthData(userId) {
    // Xóa OTP
    for (const [key] of this.otpStore.entries()) {
      if (key.startsWith(`${userId}:`)) {
        this.otpStore.delete(key);
      }
    }

    // Xóa mã dự phòng
    this.backupCodeStore.delete(userId);

    // Xóa thông tin thất bại
    this.failedAttempts.delete(userId);

    // Xóa thông tin khóa
    this.lockoutStore.delete(userId);

    // Xóa thông tin cooldown
    this.otpCooldown.delete(userId);
  }
}

// ============================================================================
// MIDDLEWARE CHÍNH
// ============================================================================

const multiFactorAuthManager = new MultiFactorAuthManager();

/**
 * Middleware yêu cầu xác thực 2FA
 */
const require2FA = async (req, res, next) => {
  try {
    // Kiểm tra user đã đăng nhập chưa
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Vui lòng đăng nhập trước",
      });
    }

    // Kiểm tra user có phải admin không
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Chỉ admin mới có quyền truy cập tính năng này",
      });
    }

    // Kiểm tra đã xác thực 2FA chưa trong session này
    if (req.session.twoFactorAuthenticated) {
      return next();
    }

    // Nếu chưa xác thực 2FA, trả về yêu cầu xác thực
    return res.status(403).json({
      success: false,
      message: "Yêu cầu xác thực 2FA",
      requires2FA: true,
      availableMethods: ["otp", "backup_code"],
    });
  } catch (error) {
    console.error("❌ 2FA middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi kiểm tra xác thực 2FA",
    });
  }
};

/**
 * Middleware gửi OTP
 */
const sendOTP = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Vui lòng đăng nhập trước",
      });
    }

    const result = await multiFactorAuthManager.generateAndSendOTP(
      req.user,
      req
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error("❌ Send OTP error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Middleware xác minh OTP
 */
const verifyOTP = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Vui lòng đăng nhập trước",
      });
    }

    const { otpId, otp } = req.body;

    if (!otpId || !otp) {
      return res.status(400).json({
        success: false,
        message: "OTP ID và OTP là bắt buộc",
      });
    }

    const result = await multiFactorAuthManager.verifyOTP(
      req.user._id,
      otpId,
      otp,
      req
    );

    // Đánh dấu đã xác thực 2FA trong session
    req.session.twoFactorAuthenticated = true;
    req.session.twoFactorAuthTime = Date.now();

    return res.status(200).json(result);
  } catch (error) {
    console.error("❌ Verify OTP error:", error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Middleware xác minh mã dự phòng
 */
const verifyBackupCode = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Vui lòng đăng nhập trước",
      });
    }

    const { backupCode } = req.body;

    if (!backupCode) {
      return res.status(400).json({
        success: false,
        message: "Mã dự phòng là bắt buộc",
      });
    }

    const result = await multiFactorAuthManager.verifyBackupCode(
      req.user._id,
      backupCode,
      req
    );

    // Đánh dấu đã xác thực 2FA trong session
    req.session.twoFactorAuthenticated = true;
    req.session.twoFactorAuthTime = Date.now();

    return res.status(200).json(result);
  } catch (error) {
    console.error("❌ Verify backup code error:", error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Middleware tạo mã dự phòng
 */
const generateBackupCodes = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Vui lòng đăng nhập trước",
      });
    }

    const result = await multiFactorAuthManager.generateBackupCodes(
      req.user._id,
      req.sessionID
    );

    return res.status(200).json({
      success: true,
      message: "Mã dự phòng đã được tạo thành công",
      data: result,
    });
  } catch (error) {
    console.error("❌ Generate backup codes error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Middleware kiểm tra trạng thái xác thực 2FA
 */
const check2FAStatus = (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Vui lòng đăng nhập trước",
      });
    }

    const isAuthenticated = req.session.twoFactorAuthenticated;
    const authTime = req.session.twoFactorAuthTime;
    const timeSinceAuth = authTime ? Date.now() - authTime : null;

    return res.status(200).json({
      success: true,
      data: {
        is2FAAuthenticated: isAuthenticated,
        authenticatedAt: authTime,
        timeSinceAuthentication: timeSinceAuth,
        expiresIn: timeSinceAuth ? 15 * 60 * 1000 - timeSinceAuth : null, // 15 phút
      },
    });
  } catch (error) {
    console.error("❌ Check 2FA status error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi kiểm tra trạng thái 2FA",
    });
  }
};

/**
 * Middleware logout khỏi 2FA
 */
const logout2FA = (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Vui lòng đăng nhập trước",
      });
    }

    // Xóa thông tin xác thực 2FA khỏi session
    delete req.session.twoFactorAuthenticated;
    delete req.session.twoFactorAuthTime;

    // Reset dữ liệu xác thực của user
    multiFactorAuthManager.resetUserAuthData(req.user._id);

    return res.status(200).json({
      success: true,
      message: "Đã đăng xuất khỏi xác thực 2FA",
    });
  } catch (error) {
    console.error("❌ Logout 2FA error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi đăng xuất 2FA",
    });
  }
};

// ============================================================================
// XUẤT CÁC HÀM VÀ MIDDLEWARE
// ============================================================================

module.exports = {
  MultiFactorAuthManager,
  require2FA,
  sendOTP,
  verifyOTP,
  verifyBackupCode,
  generateBackupCodes,
  check2FAStatus,
  logout2FA,
  SECURITY_CONFIG,
};
