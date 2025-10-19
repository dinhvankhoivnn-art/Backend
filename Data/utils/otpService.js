/**
 * Hệ thống OTP (One-Time Password) qua email
 * Cung cấp các chức năng tạo, gửi và xác minh OTP
 * Tích hợp với nodemailer và bảo mật cao
 */

const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const CreateNewUser = require("../models/CreateNewUser");

/**
 * Cấu hình OTP
 */
const OTP_CONFIG = {
  // Độ dài OTP
  LENGTH: 6,

  // Thời gian hết hạn (phút)
  EXPIRY_MINUTES: 15,

  // Số lần thử tối đa
  MAX_ATTEMPTS: 3,

  // Thời gian cooldown giữa các lần gửi (giây)
  COOLDOWN_SECONDS: 60,

  // Subject email
  EMAIL_SUBJECT: "Mã xác minh OTP",

  // Template email
  EMAIL_TEMPLATE: (otp, expiryMinutes) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Mã xác minh OTP</h2>
      <p>Xin chào,</p>
      <p>Bạn đã yêu cầu mã xác minh OTP. Mã của bạn là:</p>
      <div style="background-color: #f0f0f0; padding: 20px; text-align: center; margin: 20px 0;">
        <h1 style="color: #333; margin: 0; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
      </div>
      <p><strong>Lưu ý:</strong></p>
      <ul>
        <li>Mã này có hiệu lực trong ${expiryMinutes} phút</li>
        <li>Không chia sẻ mã này với bất kỳ ai</li>
        <li>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này</li>
      </ul>
      <p>Nếu bạn gặp vấn đề, vui lòng liên hệ hỗ trợ.</p>
      <hr style="margin: 30px 0;">
      <p style="color: #666; font-size: 12px;">
        Email này được gửi tự động từ hệ thống. Vui lòng không trả lời.
      </p>
    </div>
  `,
};

/**
 * Lớp quản lý OTP
 */
class OTPService {
  constructor() {
    this.otpStore = new Map(); // Trong production, sử dụng Redis
    this.cooldownStore = new Map();
    this.attemptStore = new Map();
    this.transporter = null;
    this.initialized = false;
  }

  /**
   * Khởi tạo OTP service
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Khởi tạo nodemailer transporter
      await this.initializeEmailTransporter();

      this.initialized = true;
      console.log("📧 OTP Service initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize OTP Service:", error);
      throw new Error("OTP Service initialization failed");
    }
  }

  /**
   * Khởi tạo email transporter
   */
  async initializeEmailTransporter() {
    try {
      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: process.env.SMTP_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          ciphers: "SSLv3",
          rejectUnauthorized: false,
        },
      });

      // Verify connection
      await this.transporter.verify();
      console.log("✅ Email transporter verified");
    } catch (error) {
      console.error("❌ Email transporter initialization failed:", error);
      // Fallback to console logging in development
      if (process.env.NODE_ENV === "development") {
        console.warn("⚠️ Using console fallback for OTP emails");
        this.transporter = null;
      } else {
        throw error;
      }
    }
  }

  /**
   * Tạo OTP ngẫu nhiên
   */
  generateOTP() {
    const digits = "0123456789";
    let otp = "";

    for (let i = 0; i < OTP_CONFIG.LENGTH; i++) {
      const randomIndex = crypto.randomInt(0, digits.length);
      otp += digits[randomIndex];
    }

    return otp;
  }

  /**
   * Tạo OTP với entropy cao
   */
  generateSecureOTP() {
    // Tạo entropy từ nhiều nguồn
    const timestamp = Date.now().toString();
    const randomBytes = crypto.randomBytes(32).toString("hex");
    const combined = timestamp + randomBytes;

    // Tạo hash và lấy 6 chữ số cuối
    const hash = crypto.createHash("sha256").update(combined).digest("hex");
    const otp = hash.substring(hash.length - OTP_CONFIG.LENGTH);

    return otp;
  }

  /**
   * Tạo mã OTP với metadata
   */
  async createOTP(email, purpose = "general", metadata = {}) {
    try {
      // Kiểm tra cooldown
      if (this.isInCooldown(email)) {
        const remainingTime = this.getRemainingCooldownTime(email);
        throw new Error(
          `Vui lòng đợi ${remainingTime} giây trước khi yêu cầu OTP mới`
        );
      }

      // Tạo OTP
      const otp = this.generateSecureOTP();
      const expiresAt = new Date(
        Date.now() + OTP_CONFIG.EXPIRY_MINUTES * 60 * 1000
      );

      // Tạo key để lưu trữ
      const storageKey = this.generateStorageKey(email, purpose);

      // Lưu OTP vào store
      this.otpStore.set(storageKey, {
        otp: otp,
        email: email,
        purpose: purpose,
        expiresAt: expiresAt,
        attempts: 0,
        createdAt: new Date(),
        metadata: metadata,
      });

      // Set cooldown
      this.cooldownStore.set(
        email,
        Date.now() + OTP_CONFIG.COOLDOWN_SECONDS * 1000
      );

      // Reset attempt count
      this.attemptStore.delete(storageKey);

      console.log(`📱 OTP created:`, {
        email: email,
        purpose: purpose,
        expiresAt: expiresAt,
        metadata: metadata,
      });

      return {
        otp: otp,
        expiresAt: expiresAt,
        purpose: purpose,
      };
    } catch (error) {
      console.error("❌ Create OTP error:", error);
      throw error;
    }
  }

  /**
   * Gửi OTP qua email
   */
  async sendOTPByEmail(email, purpose = "general", metadata = {}) {
    try {
      // Tạo OTP
      const otpData = await this.createOTP(email, purpose, metadata);

      // Chuẩn bị email
      const mailOptions = {
        from: {
          name: "Hệ thống xác thực",
          address: process.env.SMTP_USER,
        },
        to: email,
        subject: OTP_CONFIG.EMAIL_SUBJECT,
        html: OTP_CONFIG.EMAIL_TEMPLATE(otpData.otp, OTP_CONFIG.EXPIRY_MINUTES),
        text: `Mã OTP của bạn là: ${otpData.otp}. Hiệu lực trong ${OTP_CONFIG.EXPIRY_MINUTES} phút.`,
      };

      // Gửi email
      if (this.transporter) {
        await this.transporter.sendMail(mailOptions);
        console.log(`📧 OTP email sent to:`, { email, purpose });
      } else {
        // Fallback to console in development
        console.log(`📧 OTP Email (Development Mode):`, {
          to: email,
          otp: otpData.otp,
          purpose: purpose,
        });
      }

      return {
        success: true,
        message: "OTP đã được gửi qua email",
        expiresAt: otpData.expiresAt,
        purpose: purpose,
      };
    } catch (error) {
      console.error("❌ Send OTP by email error:", error);
      throw new Error("Không thể gửi OTP qua email");
    }
  }

  /**
   * Xác minh OTP
   */
  async verifyOTP(email, otp, purpose = "general") {
    try {
      const storageKey = this.generateStorageKey(email, purpose);

      // Lấy OTP data từ store
      const otpData = this.otpStore.get(storageKey);
      if (!otpData) {
        throw new Error("OTP không tồn tại hoặc đã hết hạn");
      }

      // Kiểm tra hết hạn
      if (new Date() > otpData.expiresAt) {
        this.otpStore.delete(storageKey);
        throw new Error("OTP đã hết hạn");
      }

      // Kiểm tra số lần thử
      const currentAttempts = this.attemptStore.get(storageKey) || 0;
      if (currentAttempts >= OTP_CONFIG.MAX_ATTEMPTS) {
        this.otpStore.delete(storageKey);
        this.attemptStore.delete(storageKey);
        throw new Error("Đã vượt quá số lần thử cho phép");
      }

      // Xác minh OTP
      const isValid = otpData.otp === otp;

      if (isValid) {
        // Xóa OTP sau khi sử dụng thành công
        this.otpStore.delete(storageKey);
        this.attemptStore.delete(storageKey);
        this.cooldownStore.delete(email);

        console.log(`✅ OTP verified successfully:`, {
          email: email,
          purpose: purpose,
          attempts: currentAttempts + 1,
        });

        return {
          success: true,
          message: "OTP xác minh thành công",
          purpose: purpose,
          metadata: otpData.metadata,
        };
      } else {
        // Tăng số lần thử
        this.attemptStore.set(storageKey, currentAttempts + 1);

        console.log(`❌ OTP verification failed:`, {
          email: email,
          purpose: purpose,
          attempt: currentAttempts + 1,
          maxAttempts: OTP_CONFIG.MAX_ATTEMPTS,
        });

        const remainingAttempts =
          OTP_CONFIG.MAX_ATTEMPTS - (currentAttempts + 1);

        throw new Error(`OTP không đúng. Còn ${remainingAttempts} lần thử`);
      }
    } catch (error) {
      console.error("❌ Verify OTP error:", error);
      throw error;
    }
  }

  /**
   * Lấy thông tin OTP (cho admin)
   */
  getOTPInfo(email, purpose = "general") {
    const storageKey = this.generateStorageKey(email, purpose);
    const otpData = this.otpStore.get(storageKey);

    if (!otpData) {
      return null;
    }

    return {
      email: otpData.email,
      purpose: otpData.purpose,
      expiresAt: otpData.expiresAt,
      attempts: this.attemptStore.get(storageKey) || 0,
      maxAttempts: OTP_CONFIG.MAX_ATTEMPTS,
      createdAt: otpData.createdAt,
      timeRemaining: Math.max(
        0,
        Math.floor((otpData.expiresAt - new Date()) / 1000)
      ),
      isExpired: new Date() > otpData.expiresAt,
    };
  }

  /**
   * Xóa OTP
   */
  deleteOTP(email, purpose = "general") {
    const storageKey = this.generateStorageKey(email, purpose);

    this.otpStore.delete(storageKey);
    this.attemptStore.delete(storageKey);
    this.cooldownStore.delete(email);

    console.log(`🗑️ OTP deleted:`, { email, purpose });
  }

  /**
   * Xóa tất cả OTP của email
   */
  deleteAllOTPs(email) {
    for (const [key, value] of this.otpStore.entries()) {
      if (value.email === email) {
        this.otpStore.delete(key);
        this.attemptStore.delete(key);
      }
    }

    this.cooldownStore.delete(email);
    console.log(`🗑️ All OTPs deleted for email:`, { email });
  }

  /**
   * Cleanup OTP hết hạn
   */
  cleanupExpiredOTPs() {
    const now = new Date();
    let cleanedCount = 0;

    for (const [key, otpData] of this.otpStore.entries()) {
      if (now > otpData.expiresAt) {
        this.otpStore.delete(key);
        this.attemptStore.delete(key);
        cleanedCount++;
      }
    }

    // Cleanup cooldown cũ
    for (const [email, cooldownEnd] of this.cooldownStore.entries()) {
      if (now > new Date(cooldownEnd)) {
        this.cooldownStore.delete(email);
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired OTPs`);
    }

    return cleanedCount;
  }

  /**
   * Lấy thống kê OTP
   */
  getStats() {
    const now = new Date();
    let activeCount = 0;
    let expiredCount = 0;
    let totalAttempts = 0;

    for (const [key, otpData] of this.otpStore.entries()) {
      if (now > otpData.expiresAt) {
        expiredCount++;
      } else {
        activeCount++;
      }

      const attempts = this.attemptStore.get(key) || 0;
      totalAttempts += attempts;
    }

    return {
      activeOTPs: activeCount,
      expiredOTPs: expiredCount,
      totalAttempts: totalAttempts,
      cooldownActive: this.cooldownStore.size,
      totalStored: this.otpStore.size,
    };
  }

  /**
   * Utility: Tạo storage key
   */
  generateStorageKey(email, purpose) {
    const keyData = `${email}:${purpose}:${Date.now()}`;
    return crypto.createHash("sha256").update(keyData).digest("hex");
  }

  /**
   * Utility: Kiểm tra cooldown
   */
  isInCooldown(email) {
    const cooldownEnd = this.cooldownStore.get(email);
    if (!cooldownEnd) return false;

    return new Date() < new Date(cooldownEnd);
  }

  /**
   * Utility: Lấy thời gian cooldown còn lại
   */
  getRemainingCooldownTime(email) {
    const cooldownEnd = this.cooldownStore.get(email);
    if (!cooldownEnd) return 0;

    const remaining = new Date(cooldownEnd) - new Date();
    return Math.max(0, Math.floor(remaining / 1000));
  }
}

/**
 * Hệ thống 2FA (Two-Factor Authentication)
 */
class TwoFactorAuthService {
  constructor(otpService) {
    this.otpService = otpService;
    this.twoFactorStore = new Map();
    this.initialized = false;
  }

  /**
   * Khởi tạo 2FA service
   */
  async initialize() {
    this.initialized = true;
    console.log("🔐 2FA Service initialized");
  }

  /**
   * Bật 2FA cho user
   */
  async enable2FA(userId, email) {
    try {
      // Kiểm tra user có tồn tại không
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User không tồn tại");
      }

      // Tạo secret key cho 2FA
      const secretKey = crypto.randomBytes(32).toString("hex");

      // Lưu thông tin 2FA
      this.twoFactorStore.set(userId, {
        enabled: false, // Chưa enable cho đến khi xác minh
        secretKey: secretKey,
        backupCodes: await this.generateBackupCodes(),
        enabledAt: null,
        lastUsed: null,
      });

      // Gửi OTP để xác minh việc bật 2FA
      const otpResult = await this.otpService.sendOTPByEmail(
        email,
        "enable_2fa",
        { userId, action: "enable_2fa" }
      );

      console.log(`🔐 2FA enable initiated:`, { userId, email });

      return {
        success: true,
        message: "OTP đã được gửi để xác minh việc bật 2FA",
        requiresVerification: true,
        expiresAt: otpResult.expiresAt,
      };
    } catch (error) {
      console.error("❌ Enable 2FA error:", error);
      throw error;
    }
  }

  /**
   * Xác minh và hoàn thành việc bật 2FA
   */
  async verifyAndEnable2FA(userId, email, otp) {
    try {
      // Xác minh OTP
      const otpResult = await this.otpService.verifyOTP(
        email,
        otp,
        "enable_2fa"
      );

      // Lấy thông tin 2FA
      const twoFactorData = this.twoFactorStore.get(userId);
      if (!twoFactorData) {
        throw new Error("Không tìm thấy thông tin 2FA");
      }

      // Bật 2FA
      twoFactorData.enabled = true;
      twoFactorData.enabledAt = new Date();

      console.log(`✅ 2FA enabled successfully:`, { userId });

      return {
        success: true,
        message: "2FA đã được bật thành công",
        backupCodes: twoFactorData.backupCodes,
        enabledAt: twoFactorData.enabledAt,
      };
    } catch (error) {
      console.error("❌ Verify and enable 2FA error:", error);
      throw error;
    }
  }

  /**
   * Tắt 2FA
   */
  async disable2FA(userId, email) {
    try {
      // Xác minh OTP trước khi tắt
      await this.otpService.verifyOTP(email, otp, "disable_2fa");

      // Tắt 2FA
      this.twoFactorStore.delete(userId);

      console.log(`🚫 2FA disabled:`, { userId });

      return {
        success: true,
        message: "2FA đã được tắt",
      };
    } catch (error) {
      console.error("❌ Disable 2FA error:", error);
      throw error;
    }
  }

  /**
   * Xác minh 2FA
   */
  async verify2FA(userId, otp) {
    try {
      // Lấy thông tin 2FA
      const twoFactorData = this.twoFactorStore.get(userId);
      if (!twoFactorData || !twoFactorData.enabled) {
        throw new Error("2FA chưa được bật");
      }

      // Lấy email của user
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User không tồn tại");
      }

      // Xác minh OTP
      const otpResult = await this.otpService.verifyOTP(
        user.email,
        otp,
        "2fa_verification"
      );

      // Cập nhật thời gian sử dụng cuối
      twoFactorData.lastUsed = new Date();

      return {
        success: true,
        message: "Xác minh 2FA thành công",
        verifiedAt: new Date(),
      };
    } catch (error) {
      console.error("❌ Verify 2FA error:", error);
      throw error;
    }
  }

  /**
   * Tạo backup codes
   */
  async generateBackupCodes() {
    const codes = [];
    const usedCodes = new Set();

    for (let i = 0; i < 10; i++) {
      let code;
      do {
        code = crypto.randomBytes(4).toString("hex").toUpperCase();
      } while (usedCodes.has(code));

      usedCodes.add(code);
      codes.push({
        code: code,
        used: false,
        createdAt: new Date(),
      });
    }

    return codes;
  }

  /**
   * Xác minh backup code
   */
  async verifyBackupCode(userId, backupCode) {
    try {
      const twoFactorData = this.twoFactorStore.get(userId);
      if (!twoFactorData || !twoFactorData.enabled) {
        throw new Error("2FA chưa được bật");
      }

      // Tìm backup code
      const codeIndex = twoFactorData.backupCodes.findIndex(
        (code) => code.code === backupCode && !code.used
      );

      if (codeIndex === -1) {
        throw new Error("Backup code không hợp lệ hoặc đã sử dụng");
      }

      // Đánh dấu code đã sử dụng
      twoFactorData.backupCodes[codeIndex].used = true;
      twoFactorData.backupCodes[codeIndex].usedAt = new Date();

      console.log(`🔑 Backup code used:`, { userId, codeIndex: codeIndex + 1 });

      return {
        success: true,
        message: "Backup code xác minh thành công",
        usedAt: new Date(),
      };
    } catch (error) {
      console.error("❌ Verify backup code error:", error);
      throw error;
    }
  }

  /**
   * Lấy thông tin 2FA của user
   */
  get2FAInfo(userId) {
    const twoFactorData = this.twoFactorStore.get(userId);

    if (!twoFactorData) {
      return { enabled: false };
    }

    return {
      enabled: twoFactorData.enabled,
      enabledAt: twoFactorData.enabledAt,
      lastUsed: twoFactorData.lastUsed,
      backupCodesCount: twoFactorData.backupCodes.filter((code) => !code.used)
        .length,
      totalBackupCodes: twoFactorData.backupCodes.length,
    };
  }

  /**
   * Tạo backup codes mới
   */
  async regenerateBackupCodes(userId, email) {
    try {
      // Xác minh OTP trước khi tạo backup codes mới
      await this.otpService.verifyOTP(email, otp, "regenerate_backup_codes");

      const twoFactorData = this.twoFactorStore.get(userId);
      if (!twoFactorData) {
        throw new Error("2FA chưa được bật");
      }

      // Tạo backup codes mới
      twoFactorData.backupCodes = await this.generateBackupCodes();

      console.log(`🔄 Backup codes regenerated:`, { userId });

      return {
        success: true,
        message: "Backup codes đã được tạo mới",
        backupCodes: twoFactorData.backupCodes,
      };
    } catch (error) {
      console.error("❌ Regenerate backup codes error:", error);
      throw error;
    }
  }
}

/**
 * Hệ thống mã dự phòng
 */
class BackupCodeService {
  constructor() {
    this.backupCodeStore = new Map();
    this.initialized = false;
  }

  /**
   * Khởi tạo backup code service
   */
  async initialize() {
    this.initialized = true;
    console.log("🔑 Backup Code Service initialized");
  }

  /**
   * Tạo backup codes cho user
   */
  async generateBackupCodes(userId, count = 10) {
    try {
      const codes = [];
      const usedCodes = new Set();

      for (let i = 0; i < count; i++) {
        let code;
        do {
          // Tạo code 8 ký tự với chữ và số
          const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
          code = "";
          for (let j = 0; j < 8; j++) {
            code += chars[crypto.randomInt(0, chars.length)];
          }
        } while (usedCodes.has(code));

        usedCodes.add(code);
        codes.push({
          code: code,
          used: false,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 phút
        });
      }

      // Lưu vào store
      this.backupCodeStore.set(userId, {
        codes: codes,
        generatedAt: new Date(),
      });

      console.log(`🔑 Backup codes generated:`, {
        userId,
        count: codes.length,
        expiresAt: codes[0].expiresAt,
      });

      return codes;
    } catch (error) {
      console.error("❌ Generate backup codes error:", error);
      throw error;
    }
  }

  /**
   * Xác minh backup code
   */
  async verifyBackupCode(userId, code) {
    try {
      const backupData = this.backupCodeStore.get(userId);
      if (!backupData) {
        throw new Error("Không tìm thấy backup codes");
      }

      // Tìm code trong danh sách
      const codeIndex = backupData.codes.findIndex(
        (c) => c.code === code && !c.used && new Date() < c.expiresAt
      );

      if (codeIndex === -1) {
        throw new Error("Backup code không hợp lệ, đã sử dụng hoặc hết hạn");
      }

      // Đánh dấu code đã sử dụng
      backupData.codes[codeIndex].used = true;
      backupData.codes[codeIndex].usedAt = new Date();

      console.log(`✅ Backup code verified:`, {
        userId,
        codeIndex: codeIndex + 1,
        expiresAt: backupData.codes[codeIndex].expiresAt,
      });

      return {
        success: true,
        message: "Backup code xác minh thành công",
        verifiedAt: new Date(),
        remainingCodes: backupData.codes.filter((c) => !c.used).length,
      };
    } catch (error) {
      console.error("❌ Verify backup code error:", error);
      throw error;
    }
  }

  /**
   * Lấy thông tin backup codes
   */
  getBackupCodeInfo(userId) {
    const backupData = this.backupCodeStore.get(userId);

    if (!backupData) {
      return { hasCodes: false };
    }

    return {
      hasCodes: true,
      generatedAt: backupData.generatedAt,
      totalCodes: backupData.codes.length,
      usedCodes: backupData.codes.filter((c) => c.used).length,
      remainingCodes: backupData.codes.filter((c) => !c.used).length,
      expiredCodes: backupData.codes.filter((c) => new Date() > c.expiresAt)
        .length,
    };
  }

  /**
   * Xóa backup codes hết hạn
   */
  cleanupExpiredCodes() {
    const now = new Date();
    let cleanedCount = 0;

    for (const [userId, backupData] of this.backupCodeStore.entries()) {
      const expiredCodes = backupData.codes.filter((c) => now > c.expiresAt);

      if (expiredCodes.length > 0) {
        // Xóa các codes hết hạn
        backupData.codes = backupData.codes.filter((c) => now <= c.expiresAt);
        cleanedCount += expiredCodes.length;
      }

      // Nếu không còn codes nào, xóa entry
      if (backupData.codes.length === 0) {
        this.backupCodeStore.delete(userId);
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired backup codes`);
    }

    return cleanedCount;
  }
}

/**
 * Service chính cho authentication với OTP và 2FA
 */
class AdvancedAuthService {
  constructor() {
    this.otpService = new OTPService();
    this.twoFactorService = null;
    this.backupCodeService = new BackupCodeService();
    this.initialized = false;
  }

  /**
   * Khởi tạo toàn bộ auth service
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Khởi tạo các services
      await this.otpService.initialize();
      await this.backupCodeService.initialize();
      this.twoFactorService = new TwoFactorAuthService(this.otpService);
      await this.twoFactorService.initialize();

      // Setup cleanup interval
      this.setupCleanupInterval();

      this.initialized = true;
      console.log("🔐 Advanced Auth Service initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize Advanced Auth Service:", error);
      throw new Error("Advanced Auth Service initialization failed");
    }
  }

  /**
   * Setup cleanup interval
   */
  setupCleanupInterval() {
    // Cleanup mỗi 5 phút
    setInterval(() => {
      this.otpService.cleanupExpiredOTPs();
      this.backupCodeService.cleanupExpiredCodes();
    }, 5 * 60 * 1000);
  }

  /**
   * Xác thực với nhiều lớp bảo mật
   */
  async authenticateWithLayers(
    userId,
    password,
    otp = null,
    backupCode = null
  ) {
    try {
      // Bước 1: Kiểm tra user tồn tại
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User không tồn tại");
      }

      // Bước 2: Xác minh mật khẩu
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new Error("Mật khẩu không đúng");
      }

      // Bước 3: Kiểm tra 2FA nếu được bật
      const twoFactorInfo = this.twoFactorService.get2FAInfo(userId);

      if (twoFactorInfo.enabled) {
        if (!otp && !backupCode) {
          throw new Error("Yêu cầu OTP hoặc backup code cho 2FA");
        }

        if (otp) {
          // Xác minh OTP
          await this.twoFactorService.verify2FA(userId, otp);
        } else if (backupCode) {
          // Xác minh backup code
          await this.backupCodeService.verifyBackupCode(userId, backupCode);
        }
      }

      console.log(`🔐 Multi-layer authentication successful:`, {
        userId,
        has2FA: twoFactorInfo.enabled,
        usedOTP: !!otp,
        usedBackupCode: !!backupCode,
      });

      return {
        success: true,
        message: "Xác thực thành công",
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          has2FA: twoFactorInfo.enabled,
        },
        authentication: {
          passwordVerified: true,
          twoFactorVerified: twoFactorInfo.enabled,
          method: otp ? "otp" : backupCode ? "backup_code" : "password_only",
        },
      };
    } catch (error) {
      console.error("❌ Multi-layer authentication error:", error);
      throw error;
    }
  }

  /**
   * Gửi OTP cho admin access
   */
  async requestAdminAccess(email, purpose = "admin_access") {
    try {
      // Kiểm tra user có phải admin không
      const user = await User.findByEmail(email);
      if (!user) {
        throw new Error("User không tồn tại");
      }

      if (user.role !== "admin") {
        throw new Error("Chỉ admin mới có quyền truy cập");
      }

      // Gửi OTP
      const result = await this.otpService.sendOTPByEmail(email, purpose, {
        userId: user._id,
        role: user.role,
        action: "admin_access",
      });

      return {
        success: true,
        message: "OTP đã được gửi để xác minh quyền admin",
        expiresAt: result.expiresAt,
      };
    } catch (error) {
      console.error("❌ Request admin access error:", error);
      throw error;
    }
  }

  /**
   * Xác minh admin access
   */
  async verifyAdminAccess(email, otp, purpose = "admin_access") {
    try {
      // Xác minh OTP
      const otpResult = await this.otpService.verifyOTP(email, otp, purpose);

      // Lấy thông tin user
      const user = await User.findByEmail(email);

      return {
        success: true,
        message: "Xác minh quyền admin thành công",
        adminUser: {
          id: user._id,
          email: user.email,
          role: user.role,
        },
        verifiedAt: new Date(),
      };
    } catch (error) {
      console.error("❌ Verify admin access error:", error);
      throw error;
    }
  }

  /**
   * Lấy thống kê authentication
   */
  getAuthStats() {
    return {
      otp: this.otpService.getStats(),
      twoFactor: {
        enabledUsers: Array.from(
          this.twoFactorService?.twoFactorStore.keys() || []
        ).length,
      },
      backupCodes: {
        usersWithCodes: this.backupCodeService.backupCodeStore.size,
      },
    };
  }
}

/**
 * Export services
 */
module.exports = {
  OTPService,
  TwoFactorAuthService,
  BackupCodeService,
  AdvancedAuthService,
  OTP_CONFIG,
};
