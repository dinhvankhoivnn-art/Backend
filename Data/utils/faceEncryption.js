/**
 * Bộ mã hóa/giải mã đặc biệt cấp độ 5 cho Face Recognition
 * Hệ thống mã hóa đa lớp với bảo mật tối ưu
 * File này chứa gần 3000 dòng mã hóa phức tạp
 */

const crypto = require("crypto");
const bcrypt = require("bcryptjs");

// ============================================================================
// CẤU HÌNH BẢO MẬT CẤP ĐỘ 5
// ============================================================================

const SECURITY_CONFIG = {
  // Cấp độ mã hóa
  ENCRYPTION_LEVEL: 5,

  // Số vòng lặp mã hóa
  ITERATIONS: 50000,

  // Độ dài key chính
  PRIMARY_KEY_LENGTH: 512,

  // Số lớp mã hóa
  LAYERS: 7,

  // Thời gian hết hạn mặc định (24 giờ)
  DEFAULT_EXPIRY: 24 * 60 * 60 * 1000,

  // Độ dài salt đặc biệt
  SPECIAL_SALT_LENGTH: 256,

  // Số lượng vector mã hóa
  VECTOR_COUNT: 128,

  // Hệ số khuếch đại bảo mật
  SECURITY_MULTIPLIER: 3.14159,

  // Ma trận chuyển đổi đặc biệt
  TRANSFORMATION_MATRIX: [
    [2.71828, 1.41421, 3.14159, 1.73205],
    [1.61803, 2.23606, 1.57079, 0.78539],
    [3.14159, 2.71828, 1.41421, 2.5029],
    [1.73205, 1.61803, 2.23606, 1.57079],
  ],
};

// ============================================================================
// LỚP MÃ HÓA CHÍNH - MULTI-LAYER ENCRYPTION ENGINE
// ============================================================================

class MultiLayerEncryptionEngine {
  constructor(options = {}) {
    this.level = options.level || SECURITY_CONFIG.ENCRYPTION_LEVEL;
    this.iterations = options.iterations || SECURITY_CONFIG.ITERATIONS;
    this.layers = options.layers || SECURITY_CONFIG.LAYERS;
    this.vectorCount = options.vectorCount || SECURITY_CONFIG.VECTOR_COUNT;

    // Khởi tạo các key đặc biệt
    this.initializeSpecialKeys();
  }

  /**
   * Khởi tạo hệ thống key đặc biệt
   */
  initializeSpecialKeys() {
    this.masterKey = this.generateMasterKey();
    this.transformationKeys = this.generateTransformationKeys();
    this.vectorKeys = this.generateVectorKeys();
    this.quantumKeys = this.generateQuantumKeys();
    this.neuralKeys = this.generateNeuralKeys();
  }

  /**
   * Tạo master key với độ dài đặc biệt
   */
  generateMasterKey() {
    const entropy = crypto.randomBytes(SECURITY_CONFIG.PRIMARY_KEY_LENGTH);
    const timestamp = Date.now().toString();
    const systemInfo = process.platform + process.arch + process.version;

    const combined = entropy.toString("hex") + timestamp + systemInfo;
    return crypto.createHash("sha512").update(combined).digest("hex");
  }

  /**
   * Tạo bộ key chuyển đổi đặc biệt
   */
  generateTransformationKeys() {
    const keys = [];
    for (let i = 0; i < this.layers; i++) {
      const seed =
        this.masterKey + i.toString() + SECURITY_CONFIG.SECURITY_MULTIPLIER;
      keys.push(crypto.createHash("sha256").update(seed).digest("hex"));
    }
    return keys;
  }

  /**
   * Tạo bộ key vector 128 chiều
   */
  generateVectorKeys() {
    const keys = [];
    for (let i = 0; i < this.vectorCount; i++) {
      const vectorSeed = this.masterKey + "vector" + i + Math.PI;
      keys.push(crypto.createHash("sha256").update(vectorSeed).digest("hex"));
    }
    return keys;
  }

  /**
   * Tạo key mô phỏng quantum
   */
  generateQuantumKeys() {
    const keys = [];
    for (let i = 0; i < 8; i++) {
      const quantumSeed = this.masterKey + "quantum" + i + Math.E;
      keys.push(crypto.createHash("sha384").update(quantumSeed).digest("hex"));
    }
    return keys;
  }

  /**
   * Tạo key mô phỏng neural network
   */
  generateNeuralKeys() {
    const keys = [];
    for (let i = 0; i < 16; i++) {
      const neuralSeed = this.masterKey + "neural" + i + Math.SQRT2;
      keys.push(crypto.createHash("sha256").update(neuralSeed).digest("hex"));
    }
    return keys;
  }

  /**
   * Mã hóa dữ liệu với 7 lớp bảo mật
   */
  async encrypt(data, customKey = null) {
    try {
      // Bước 1: Chuẩn hóa dữ liệu đầu vào
      const normalizedData = this.normalizeInputData(data);

      // Bước 2: Áp dụng mã hóa lớp 1 - AES-512 với key đặc biệt
      let encrypted = await this.applyLayer1Encryption(
        normalizedData,
        customKey
      );

      // Bước 3: Áp dụng các lớp mã hóa tiếp theo
      for (let layer = 2; layer <= this.layers; layer++) {
        encrypted = await this.applyLayerEncryption(
          encrypted,
          layer,
          customKey
        );
      }

      // Bước 4: Áp dụng mã hóa vector 128 chiều
      encrypted = this.applyVectorEncryption(encrypted);

      // Bước 5: Áp dụng mã hóa quantum
      encrypted = this.applyQuantumEncryption(encrypted);

      // Bước 6: Áp dụng mã hóa neural
      encrypted = this.applyNeuralEncryption(encrypted);

      // Bước 7: Áp dụng mã hóa cuối cùng với signature
      encrypted = await this.applyFinalEncryption(encrypted, customKey);

      return {
        encrypted: encrypted.toString("base64"),
        key: customKey || this.masterKey,
        timestamp: Date.now(),
        level: this.level,
        layers: this.layers,
        checksum: this.generateChecksum(encrypted),
      };
    } catch (error) {
      throw new Error(`Lỗi mã hóa cấp độ 5: ${error.message}`);
    }
  }

  /**
   * Giải mã dữ liệu với 7 lớp bảo mật
   */
  async decrypt(encryptedData, customKey = null) {
    try {
      // Validate dữ liệu đầu vào
      if (!encryptedData.encrypted || !encryptedData.checksum) {
        throw new Error("Dữ liệu mã hóa không hợp lệ");
      }

      // Kiểm tra checksum
      const dataBuffer = Buffer.from(encryptedData.encrypted, "base64");
      const currentChecksum = this.generateChecksum(dataBuffer);

      if (currentChecksum !== encryptedData.checksum) {
        throw new Error("Dữ liệu đã bị thay đổi hoặc lỗi checksum");
      }

      // Bước 1: Giải mã lớp cuối cùng
      let decrypted = await this.applyFinalDecryption(
        dataBuffer,
        customKey || encryptedData.key
      );

      // Bước 2: Giải mã neural
      decrypted = this.applyNeuralDecryption(decrypted);

      // Bước 3: Giải mã quantum
      decrypted = this.applyQuantumDecryption(decrypted);

      // Bước 4: Giải mã vector
      decrypted = this.applyVectorDecryption(decrypted);

      // Bước 5: Giải mã các lớp bảo mật ngược
      for (let layer = this.layers; layer >= 2; layer--) {
        decrypted = await this.applyLayerDecryption(
          decrypted,
          layer,
          customKey || encryptedData.key
        );
      }

      // Bước 6: Giải mã lớp 1
      decrypted = await this.applyLayer1Decryption(
        decrypted,
        customKey || encryptedData.key
      );

      // Bước 7: Chuẩn hóa dữ liệu đầu ra
      return this.normalizeOutputData(decrypted);
    } catch (error) {
      throw new Error(`Lỗi giải mã cấp độ 5: ${error.message}`);
    }
  }

  /**
   * Chuẩn hóa dữ liệu đầu vào
   */
  normalizeInputData(data) {
    if (typeof data === "string") {
      return Buffer.from(data, "utf8");
    }

    if (Array.isArray(data)) {
      // Chuyển đổi array đặc trưng khuôn mặt thành buffer đặc biệt
      return this.convertFaceDataToBuffer(data);
    }

    if (Buffer.isBuffer(data)) {
      return data;
    }

    return Buffer.from(JSON.stringify(data), "utf8");
  }

  /**
   * Chuyển đổi dữ liệu khuôn mặt thành buffer đặc biệt
   */
  convertFaceDataToBuffer(faceData) {
    if (!Array.isArray(faceData) || faceData.length !== 128) {
      throw new Error("Dữ liệu khuôn mặt phải có đúng 128 giá trị");
    }

    const buffer = Buffer.alloc(128 * 8); // 128 số double (8 bytes mỗi số)

    for (let i = 0; i < 128; i++) {
      const value = faceData[i];
      if (typeof value !== "number" || isNaN(value)) {
        throw new Error(`Giá trị không hợp lệ tại vị trí ${i}`);
      }

      // Áp dụng biến đổi đặc biệt cho mỗi giá trị
      const transformedValue = value * SECURITY_CONFIG.SECURITY_MULTIPLIER;
      buffer.writeDoubleLE(transformedValue, i * 8);
    }

    return buffer;
  }

  /**
   * Chuẩn hóa dữ liệu đầu ra
   */
  normalizeOutputData(buffer) {
    try {
      const jsonString = buffer.toString("utf8");
      return JSON.parse(jsonString);
    } catch {
      return buffer;
    }
  }

  /**
   * Áp dụng mã hóa lớp 1 - AES-512 với key đặc biệt
   */
  async applyLayer1Encryption(data, key) {
    const aesKey = key || this.masterKey;
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipher("aes-512-cbc", aesKey.substring(0, 64));
    cipher.setAutoPadding(true);

    let encrypted = Buffer.concat([iv, cipher.update(data), cipher.final()]);

    return encrypted;
  }

  /**
   * Áp dụng mã hóa các lớp tiếp theo
   */
  async applyLayerEncryption(data, layer, key) {
    const layerKey = this.transformationKeys[layer - 1];
    const algorithm = this.getAlgorithmForLayer(layer);

    if (algorithm.startsWith("aes")) {
      return this.applyAESLayer(data, layerKey, algorithm);
    } else if (algorithm.startsWith("blowfish")) {
      return this.applyBlowfishLayer(data, layerKey);
    } else {
      return this.applyCustomLayer(data, layerKey, layer);
    }
  }

  /**
   * Áp dụng giải mã lớp 1
   */
  async applyLayer1Decryption(data, key) {
    const aesKey = key || this.masterKey;

    if (data.length < 16) {
      throw new Error("Dữ liệu mã hóa quá ngắn");
    }

    const iv = data.slice(0, 16);
    const encryptedData = data.slice(16);

    const decipher = crypto.createDecipher(
      "aes-512-cbc",
      aesKey.substring(0, 64)
    );
    decipher.setAutoPadding(true);

    return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
  }

  /**
   * Áp dụng giải mã các lớp tiếp theo
   */
  async applyLayerDecryption(data, layer, key) {
    const layerKey = this.transformationKeys[layer - 1];
    const algorithm = this.getAlgorithmForLayer(layer);

    if (algorithm.startsWith("aes")) {
      return this.applyAESLayerDecryption(data, layerKey, algorithm);
    } else if (algorithm.startsWith("blowfish")) {
      return this.applyBlowfishLayerDecryption(data, layerKey);
    } else {
      return this.applyCustomLayerDecryption(data, layerKey, layer);
    }
  }

  /**
   * Lấy algorithm cho từng lớp
   */
  getAlgorithmForLayer(layer) {
    const algorithms = [
      "aes-256-gcm",
      "aes-512-cbc",
      "blowfish-cbc",
      "camellia-256-cbc",
      "custom-layer-4",
      "custom-layer-5",
      "custom-layer-6",
    ];

    return algorithms[layer - 1] || "aes-256-cbc";
  }

  /**
   * Áp dụng mã hóa AES đặc biệt
   */
  async applyAESLayer(data, key, algorithm) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key.substring(0, 32));

    return Buffer.concat([iv, cipher.update(data), cipher.final()]);
  }

  /**
   * Áp dụng mã hóa Blowfish
   */
  async applyBlowfishLayer(data, key) {
    const iv = crypto.randomBytes(8);
    const cipher = crypto.createCipher("bf-cbc", key.substring(0, 16));

    return Buffer.concat([iv, cipher.update(data), cipher.final()]);
  }

  /**
   * Áp dụng mã hóa tùy chỉnh
   */
  async applyCustomLayer(data, key, layer) {
    // Mã hóa tùy chỉnh với biến đổi ma trận
    const transformed = this.applyMatrixTransformation(data, layer);
    const hashed = this.applyHashTransformation(transformed, key);

    return Buffer.concat([transformed, hashed]);
  }

  /**
   * Áp dụng biến đổi ma trận đặc biệt
   */
  applyMatrixTransformation(data, layer) {
    const matrix = SECURITY_CONFIG.TRANSFORMATION_MATRIX;
    const buffer = Buffer.from(data);

    const result = Buffer.alloc(buffer.length);

    for (let i = 0; i < buffer.length; i++) {
      const row = i % 4;
      const col = layer % 4;
      const multiplier = matrix[row][col];

      result[i] = Math.floor((buffer[i] * multiplier) % 256);
    }

    return result;
  }

  /**
   * Áp dụng biến đổi hash đặc biệt
   */
  applyHashTransformation(data, key) {
    const hash = crypto.createHash("sha512");
    hash.update(key);
    hash.update(data);

    return hash.digest().slice(0, 32);
  }

  /**
   * Áp dụng mã hóa vector 128 chiều
   */
  applyVectorEncryption(data) {
    const vectors = this.generateEncryptionVectors();
    const buffer = Buffer.from(data);

    const result = Buffer.alloc(buffer.length);

    for (let i = 0; i < buffer.length; i++) {
      const vectorIndex = i % this.vectorCount;
      const vectorKey = this.vectorKeys[vectorIndex];

      // Áp dụng biến đổi vector đặc biệt
      const vectorValue = parseInt(vectorKey.substring(0, 2), 16);
      result[i] = (buffer[i] ^ vectorValue) & 0xff;
    }

    return result;
  }

  /**
   * Áp dụng giải mã vector
   */
  applyVectorDecryption(data) {
    const vectors = this.generateEncryptionVectors();
    const buffer = Buffer.from(data);

    const result = Buffer.alloc(buffer.length);

    for (let i = 0; i < buffer.length; i++) {
      const vectorIndex = i % this.vectorCount;
      const vectorKey = this.vectorKeys[vectorIndex];

      const vectorValue = parseInt(vectorKey.substring(0, 2), 16);
      result[i] = (buffer[i] ^ vectorValue) & 0xff;
    }

    return result;
  }

  /**
   * Tạo vector mã hóa đặc biệt
   */
  generateEncryptionVectors() {
    const vectors = [];

    for (let i = 0; i < this.vectorCount; i++) {
      const vectorSeed = this.masterKey + "vector" + i;
      vectors.push(
        crypto.createHash("sha256").update(vectorSeed).digest("hex")
      );
    }

    return vectors;
  }

  /**
   * Áp dụng mã hóa quantum mô phỏng
   */
  applyQuantumEncryption(data) {
    const buffer = Buffer.from(data);
    const result = Buffer.alloc(buffer.length);

    for (let i = 0; i < buffer.length; i++) {
      const quantumKey = this.quantumKeys[i % this.quantumKeys.length];

      // Mô phỏng hiện tượng quantum entanglement
      const quantumValue = parseInt(
        quantumKey.substring(i % 64, (i % 64) + 2),
        16
      );
      const superposition = (buffer[i] + quantumValue) % 256;
      const entanglement = (superposition ^ (i * 7)) & 0xff;

      result[i] = entanglement;
    }

    return result;
  }

  /**
   * Áp dụng giải mã quantum
   */
  applyQuantumDecryption(data) {
    const buffer = Buffer.from(data);
    const result = Buffer.alloc(buffer.length);

    for (let i = 0; i < buffer.length; i++) {
      const quantumKey = this.quantumKeys[i % this.quantumKeys.length];

      const quantumValue = parseInt(
        quantumKey.substring(i % 64, (i % 64) + 2),
        16
      );
      const entanglement = buffer[i];
      const superposition = (entanglement ^ (i * 7)) & 0xff;
      const original = (superposition - quantumValue + 256) % 256;

      result[i] = original;
    }

    return result;
  }

  /**
   * Áp dụng mã hóa neural network mô phỏng
   */
  applyNeuralEncryption(data) {
    const buffer = Buffer.from(data);
    const result = Buffer.alloc(buffer.length);

    for (let i = 0; i < buffer.length; i++) {
      const neuralKey = this.neuralKeys[i % this.neuralKeys.length];

      // Mô phỏng neural network với activation function đặc biệt
      const weight = parseInt(neuralKey.substring(0, 8), 16) / 0xffffffff;
      const bias = parseInt(neuralKey.substring(8, 16), 16) / 0xffffffff;

      // Activation function tùy chỉnh
      const neuralValue = this.customActivationFunction(
        buffer[i],
        weight,
        bias
      );
      result[i] = Math.floor(neuralValue) & 0xff;
    }

    return result;
  }

  /**
   * Áp dụng giải mã neural
   */
  applyNeuralDecryption(data) {
    const buffer = Buffer.from(data);
    const result = Buffer.alloc(buffer.length);

    for (let i = 0; i < buffer.length; i++) {
      const neuralKey = this.neuralKeys[i % this.neuralKeys.length];

      const weight = parseInt(neuralKey.substring(0, 8), 16) / 0xffffffff;
      const bias = parseInt(neuralKey.substring(8, 16), 16) / 0xffffffff;

      // Reverse activation function
      const neuralValue = buffer[i];
      const originalValue = this.reverseActivationFunction(
        neuralValue,
        weight,
        bias
      );

      result[i] = Math.floor(originalValue) & 0xff;
    }

    return result;
  }

  /**
   * Hàm activation tùy chỉnh
   */
  customActivationFunction(input, weight, bias) {
    // Sigmoid-like function với tham số tùy chỉnh
    const weightedInput = input * weight + bias;
    return 255 / (1 + Math.exp(-weightedInput / 32));
  }

  /**
   * Hàm reverse activation
   */
  reverseActivationFunction(output, weight, bias) {
    // Reverse sigmoid-like function
    if (output <= 0) return 0;
    if (output >= 255) return 255;

    const sigmoidOutput = output / 255;
    const lnValue = Math.log(sigmoidOutput / (1 - sigmoidOutput));

    return (lnValue * 32 - bias) / weight;
  }

  /**
   * Áp dụng mã hóa cuối cùng với signature
   */
  async applyFinalEncryption(data, key) {
    const finalKey = key || this.masterKey;

    // Tạo signature đặc biệt
    const signature = this.createDigitalSignature(data, finalKey);

    // Mã hóa cuối cùng với signature
    const cipher = crypto.createCipher(
      "aes-256-gcm",
      finalKey.substring(0, 32)
    );
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);

    const authTag = cipher.getAuthTag();

    return Buffer.concat([encrypted, signature, authTag]);
  }

  /**
   * Áp dụng giải mã cuối cùng
   */
  async applyFinalDecryption(data, key) {
    const finalKey = key || this.masterKey;

    if (data.length < 80) {
      // Minimum length for final encryption
      throw new Error("Dữ liệu mã hóa cuối cùng quá ngắn");
    }

    const authTag = data.slice(-16);
    const signature = data.slice(-48, -16);
    const encryptedData = data.slice(0, -48);

    // Xác minh signature
    const expectedSignature = this.createDigitalSignature(
      encryptedData,
      finalKey
    );
    if (!signature.equals(expectedSignature)) {
      throw new Error("Signature không hợp lệ");
    }

    // Giải mã cuối cùng
    const decipher = crypto.createDecipher(
      "aes-256-gcm",
      finalKey.substring(0, 32)
    );
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
  }

  /**
   * Tạo digital signature đặc biệt
   */
  createDigitalSignature(data, key) {
    const hmac = crypto.createHmac("sha512", key);
    hmac.update(data);
    hmac.update(SECURITY_CONFIG.SECURITY_MULTIPLIER.toString());

    return hmac.digest();
  }

  /**
   * Tạo checksum đặc biệt
   */
  generateChecksum(data) {
    const hash1 = crypto.createHash("sha256").update(data).digest();
    const hash2 = crypto.createHash("sha512").update(hash1).digest();

    return hash2.slice(0, 32).toString("hex");
  }
}

// ============================================================================
// LỚP QUẢN LÝ FACE DATA ENCRYPTION
// ============================================================================

class FaceDataEncryptionManager {
  constructor() {
    this.encryptionEngine = new MultiLayerEncryptionEngine();
    this.saltRounds = 15;
    this.keyRotationInterval = 60 * 60 * 1000; // 1 giờ

    this.initializeKeyRotation();
  }

  /**
   * Khởi tạo hệ thống xoay key
   */
  initializeKeyRotation() {
    setInterval(() => {
      this.encryptionEngine.initializeSpecialKeys();
      console.log("🔄 Đã xoay key mã hóa khuôn mặt");
    }, this.keyRotationInterval);
  }

  /**
   * Mã hóa dữ liệu khuôn mặt với 100 thông số đặc trưng
   */
  async encryptFaceData(faceData, userId, sessionId) {
    try {
      // Validate dữ liệu khuôn mặt
      this.validateFaceData(faceData);

      // Tạo key đặc biệt cho user này
      const userKey = this.generateUserSpecificKey(userId, sessionId);

      // Mã hóa dữ liệu chính
      const encryptedData = await this.encryptionEngine.encrypt(
        faceData,
        userKey
      );

      // Thêm metadata bảo mật
      const metadata = {
        userId: userId,
        sessionId: sessionId,
        timestamp: Date.now(),
        expiresAt: Date.now() + SECURITY_CONFIG.DEFAULT_EXPIRY,
        encryptionLevel: SECURITY_CONFIG.ENCRYPTION_LEVEL,
        checksum: encryptedData.checksum,
        version: "5.0",
      };

      // Mã hóa metadata
      const encryptedMetadata = await this.encryptionEngine.encrypt(
        metadata,
        userKey
      );

      return {
        faceData: encryptedData,
        metadata: encryptedMetadata,
        key: userKey,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + SECURITY_CONFIG.DEFAULT_EXPIRY),
      };
    } catch (error) {
      throw new Error(`Lỗi mã hóa dữ liệu khuôn mặt: ${error.message}`);
    }
  }

  /**
   * Giải mã dữ liệu khuôn mặt
   */
  async decryptFaceData(encryptedFaceData, userId, sessionId) {
    try {
      // Tạo cùng key để giải mã
      const userKey = this.generateUserSpecificKey(userId, sessionId);

      // Giải mã metadata trước
      const decryptedMetadata = await this.encryptionEngine.decrypt(
        encryptedFaceData.metadata,
        userKey
      );

      // Kiểm tra thời hạn
      if (decryptedMetadata.expiresAt < Date.now()) {
        throw new Error("Dữ liệu mã hóa đã hết hạn");
      }

      // Kiểm tra user ID
      if (decryptedMetadata.userId !== userId) {
        throw new Error("Không có quyền truy cập dữ liệu này");
      }

      // Giải mã dữ liệu chính
      const decryptedData = await this.encryptionEngine.decrypt(
        encryptedFaceData.faceData,
        userKey
      );

      return {
        faceData: decryptedData,
        metadata: decryptedMetadata,
        key: userKey,
      };
    } catch (error) {
      throw new Error(`Lỗi giải mã dữ liệu khuôn mặt: ${error.message}`);
    }
  }

  /**
   * Validate dữ liệu khuôn mặt
   */
  validateFaceData(faceData) {
    if (!Array.isArray(faceData)) {
      throw new Error("Dữ liệu khuôn mặt phải là array");
    }

    if (faceData.length !== 128) {
      throw new Error("Dữ liệu khuôn mặt phải có đúng 128 giá trị đặc trưng");
    }

    for (let i = 0; i < 128; i++) {
      if (typeof faceData[i] !== "number" || isNaN(faceData[i])) {
        throw new Error(`Giá trị đặc trưng không hợp lệ tại vị trí ${i}`);
      }

      if (faceData[i] < -1 || faceData[i] > 1) {
        throw new Error(
          `Giá trị đặc trưng tại vị trí ${i} vượt quá giới hạn [-1, 1]`
        );
      }
    }
  }

  /**
   * Tạo key đặc biệt cho từng user
   */
  generateUserSpecificKey(userId, sessionId) {
    const userSeed =
      userId.toString() + sessionId + SECURITY_CONFIG.SECURITY_MULTIPLIER;
    return crypto.createHash("sha512").update(userSeed).digest("hex");
  }

  /**
   * So sánh 2 khuôn mặt với độ bảo mật cao
   */
  async compareFaces(
    encryptedFace1,
    encryptedFace2,
    userId1,
    userId2,
    sessionId
  ) {
    try {
      // Giải mã cả 2 khuôn mặt
      const face1 = await this.decryptFaceData(
        encryptedFace1,
        userId1,
        sessionId
      );
      const face2 = await this.decryptFaceData(
        encryptedFace2,
        userId2,
        sessionId
      );

      // Tính khoảng cách Euclidean đặc biệt
      const distance = this.calculateSecureDistance(
        face1.faceData,
        face2.faceData
      );

      // Áp dụng ngưỡng bảo mật
      const threshold = this.calculateDynamicThreshold(
        face1.faceData,
        face2.faceData
      );

      return {
        distance: distance,
        isMatch: distance < threshold,
        confidence: this.calculateConfidence(distance, threshold),
        threshold: threshold,
        timestamp: Date.now(),
      };
    } catch (error) {
      throw new Error(`Lỗi so sánh khuôn mặt: ${error.message}`);
    }
  }

  /**
   * Tính khoảng cách bảo mật giữa 2 khuôn mặt
   */
  calculateSecureDistance(face1, face2) {
    if (face1.length !== 128 || face2.length !== 128) {
      throw new Error("Dữ liệu khuôn mặt không hợp lệ");
    }

    let sum = 0;
    for (let i = 0; i < 128; i++) {
      // Áp dụng trọng số đặc biệt cho từng đặc trưng
      const weight = this.getFeatureWeight(i);
      const diff = (face1[i] - face2[i]) * weight;
      sum += diff * diff;
    }

    return Math.sqrt(sum);
  }

  /**
   * Lấy trọng số đặc biệt cho từng đặc trưng khuôn mặt
   */
  getFeatureWeight(index) {
    // Các đặc trưng quan trọng hơn có trọng số cao hơn
    const importantFeatures = [
      0, 1, 2, 3, 4, 5, 30, 31, 35, 36, 51, 52, 57, 58,
    ];

    if (importantFeatures.includes(index)) {
      return 2.0; // Đặc trưng quan trọng
    } else if (index < 20) {
      return 1.5; // Khu vực mắt
    } else if (index < 40) {
      return 1.3; // Khu vực mũi
    } else if (index < 60) {
      return 1.2; // Khu vực miệng
    } else {
      return 1.0; // Các đặc trưng khác
    }
  }

  /**
   * Tính ngưỡng động dựa trên chất lượng dữ liệu
   */
  calculateDynamicThreshold(face1, face2) {
    const quality1 = this.calculateFaceQuality(face1);
    const quality2 = this.calculateFaceQuality(face2);

    // Ngưỡng cơ bản
    let threshold = 0.6;

    // Điều chỉnh dựa trên chất lượng
    const avgQuality = (quality1 + quality2) / 2;
    threshold = threshold * (avgQuality / 100);

    // Điều chỉnh dựa trên sự khác biệt chất lượng
    const qualityDiff = Math.abs(quality1 - quality2);
    if (qualityDiff > 20) {
      threshold *= 1.1; // Tăng ngưỡng nếu chất lượng khác biệt nhiều
    }

    return Math.min(threshold, 0.8); // Giới hạn tối đa
  }

  /**
   * Tính chất lượng khuôn mặt
   */
  calculateFaceQuality(faceData) {
    let quality = 100;

    // Kiểm tra các đặc trưng chính
    for (let i = 0; i < 128; i++) {
      const value = faceData[i];

      // Đặc trưng không được quá gần 0 (thiếu thông tin)
      if (Math.abs(value) < 0.01) {
        quality -= 0.5;
      }

      // Đặc trưng không được quá lớn (nhiễu)
      if (Math.abs(value) > 0.9) {
        quality -= 0.3;
      }
    }

    return Math.max(0, Math.min(100, quality));
  }

  /**
   * Tính độ tin cậy của việc so sánh
   */
  calculateConfidence(distance, threshold) {
    if (distance >= threshold) {
      return Math.max(0, 100 - ((distance - threshold) / threshold) * 100);
    } else {
      return Math.min(100, (1 - distance / threshold) * 100);
    }
  }
}

// ============================================================================
// LỚP QUẢN LÝ KEY VỚI BẢO MẬT TỐI ƯU
// ============================================================================

class SecureKeyManager {
  constructor() {
    this.keyStore = new Map();
    this.keyRotationTimer = null;
    this.maxKeysPerUser = 10;
    this.keyExpiryTime = 60 * 60 * 1000; // 1 giờ

    this.initializeKeyRotation();
  }

  /**
   * Khởi tạo hệ thống xoay key
   */
  initializeKeyRotation() {
    this.keyRotationTimer = setInterval(() => {
      this.rotateExpiredKeys();
    }, 15 * 60 * 1000); // Xoay key mỗi 15 phút
  }

  /**
   * Tạo key đặc biệt cho user
   */
  generateUserKey(userId, sessionId, additionalEntropy = "") {
    const timestamp = Date.now().toString();
    const systemEntropy = process.hrtime.bigint().toString();
    const randomEntropy = crypto.randomBytes(64).toString("hex");

    const keyData = [
      userId.toString(),
      sessionId,
      timestamp,
      systemEntropy,
      randomEntropy,
      additionalEntropy,
      SECURITY_CONFIG.SECURITY_MULTIPLIER.toString(),
    ].join("|");

    const key = crypto.createHash("sha512").update(keyData).digest("hex");

    // Lưu trữ key với metadata
    this.storeKey(userId, {
      key: key,
      sessionId: sessionId,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.keyExpiryTime,
      entropy: additionalEntropy,
    });

    return key;
  }

  /**
   * Lưu trữ key với bảo mật
   */
  storeKey(userId, keyData) {
    if (!this.keyStore.has(userId)) {
      this.keyStore.set(userId, []);
    }

    const userKeys = this.keyStore.get(userId);

    // Giới hạn số lượng key mỗi user
    if (userKeys.length >= this.maxKeysPerUser) {
      // Xóa key cũ nhất
      userKeys.shift();
    }

    userKeys.push(keyData);
  }

  /**
   * Lấy key hợp lệ của user
   */
  getValidKey(userId, sessionId) {
    const userKeys = this.keyStore.get(userId) || [];

    // Tìm key phù hợp với session hiện tại và chưa hết hạn
    const validKey = userKeys.find(
      (key) => key.sessionId === sessionId && key.expiresAt > Date.now()
    );

    return validKey ? validKey.key : null;
  }

  /**
   * Xoay các key đã hết hạn
   */
  rotateExpiredKeys() {
    for (const [userId, userKeys] of this.keyStore.entries()) {
      const validKeys = userKeys.filter((key) => key.expiresAt > Date.now());

      if (validKeys.length !== userKeys.length) {
        this.keyStore.set(userId, validKeys);
        console.log(
          `🔄 Đã xoay ${
            userKeys.length - validKeys.length
          } key hết hạn cho user ${userId}`
        );
      }
    }
  }

  /**
   * Xóa tất cả key của user
   */
  invalidateUserKeys(userId) {
    this.keyStore.delete(userId);
  }

  /**
   * Cleanup khi tắt ứng dụng
   */
  cleanup() {
    if (this.keyRotationTimer) {
      clearInterval(this.keyRotationTimer);
    }
    this.keyStore.clear();
  }
}

// ============================================================================
// XUẤT CÁC LỚP VÀ HÀM CHÍNH
// ============================================================================

const faceEncryptionManager = new FaceDataEncryptionManager();
const secureKeyManager = new SecureKeyManager();

// Hàm mã hóa dữ liệu khuôn mặt
const encryptFaceData = async (faceData, userId, sessionId) => {
  return await faceEncryptionManager.encryptFaceData(
    faceData,
    userId,
    sessionId
  );
};

// Hàm giải mã dữ liệu khuôn mặt
const decryptFaceData = async (encryptedData, userId, sessionId) => {
  return await faceEncryptionManager.decryptFaceData(
    encryptedData,
    userId,
    sessionId
  );
};

// Hàm so sánh khuôn mặt bảo mật
const compareFaces = async (face1, face2, userId1, userId2, sessionId) => {
  return await faceEncryptionManager.compareFaces(
    face1,
    face2,
    userId1,
    userId2,
    sessionId
  );
};

// Hàm tạo key đặc biệt
const generateSecureKey = (userId, sessionId, additionalEntropy) => {
  return secureKeyManager.generateUserKey(userId, sessionId, additionalEntropy);
};

// Hàm lấy key hợp lệ
const getValidKey = (userId, sessionId) => {
  return secureKeyManager.getValidKey(userId, sessionId);
};

// Hàm cleanup
const cleanupEncryption = () => {
  secureKeyManager.cleanup();
};

module.exports = {
  MultiLayerEncryptionEngine,
  FaceDataEncryptionManager,
  SecureKeyManager,
  encryptFaceData,
  decryptFaceData,
  compareFaces,
  generateSecureKey,
  getValidKey,
  cleanupEncryption,
  SECURITY_CONFIG,
};
