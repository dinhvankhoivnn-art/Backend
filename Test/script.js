// QR Code Generator Application
// Tích hợp đầy đủ tính năng với localStorage và animations

class QRCodeApp {
  constructor() {
    this.currentQR = null;
    this.qrHistory = [];
    this.settings = {};
    this.scannerStream = null;
    this.isScanning = false;

    this.init();
  }

  init() {
    this.loadSettings();
    this.loadHistory();
    this.bindEvents();
    this.setupNavigation();
    this.setupScanner();
    this.applyTheme();

    // Khởi tạo AOS
    AOS.init({
      duration: 1000,
      once: true,
      offset: 100,
      easing: "ease-out-cubic",
    });

    // Hiển thị thông báo chào mừng với animation
    setTimeout(() => {
      this.showNotification(
        "Chào mừng bạn đến với QR Code Generator!",
        "success"
      );
    }, 1000);
  }

  // ==================== UTILITIES ====================

  showNotification(message, type = "success") {
    const notification = document.getElementById("notification");
    const text = document.getElementById("notificationText");

    text.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add("show");

    // Phát âm thanh nếu được bật
    if (this.settings.soundEnabled !== false) {
      this.playSound("notification");
    }

    setTimeout(() => {
      notification.classList.remove("show");
    }, 4000);
  }

  playSound(type) {
    if (this.settings.soundEnabled === false) return;

    // Tạo âm thanh đơn giản bằng Web Audio API
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    switch (type) {
      case "notification":
        oscillator.frequency.value = 800;
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.2
        );
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
        break;
      case "success":
        oscillator.frequency.value = 600;
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.3
        );
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
        break;
    }
  }

  showLoading(show = true) {
    const overlay = document.getElementById("loadingOverlay");
    if (show) {
      overlay.style.display = "flex";
    } else {
      overlay.style.display = "none";
    }
  }

  // ==================== QR CODE GENERATION ====================

  generateQRCode(options = {}) {
    const text = document.getElementById("qrText").value.trim();
    if (!text) {
      this.showNotification("Vui lòng nhập nội dung để tạo QR Code!", "error");
      return;
    }

    this.showLoading(true);

    // Lấy các tùy chọn từ form
    const qrOptions = {
      text: text,
      size: parseInt(document.getElementById("qrSize").value) || 300,
      correction: document.getElementById("qrCorrection").value || "M",
      color: document.getElementById("qrColor").value || "#000000",
      background: document.getElementById("bgColor").value || "#ffffff",
    };

    try {
      // Tạo QR Code type number
      const qr = qrcode(0, qrOptions.correction);
      qr.addData(qrOptions.text);
      qr.make();

      // Tạo canvas để vẽ QR Code tùy chỉnh
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = qrOptions.size;
      canvas.height = qrOptions.size;

      // Vẽ nền
      ctx.fillStyle = qrOptions.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Tính toán kích thước và vị trí để căn giữa
      const cellSize = Math.floor(qrOptions.size / qr.getModuleCount());
      const margin = Math.floor(
        (qrOptions.size - cellSize * qr.getModuleCount()) / 2
      );

      // Vẽ QR Code
      ctx.fillStyle = qrOptions.color;
      for (let row = 0; row < qr.getModuleCount(); row++) {
        for (let col = 0; col < qr.getModuleCount(); col++) {
          if (qr.isDark(row, col)) {
            ctx.fillRect(
              margin + col * cellSize,
              margin + row * cellSize,
              cellSize,
              cellSize
            );
          }
        }
      }

      // Thêm logo nếu có
      if (options.logo) {
        this.addLogoToQR(canvas, ctx, options.logo);
      }

      this.displayQRCode(canvas, qrOptions);
      this.currentQR = { canvas, options: qrOptions };

      // Tự động lưu nếu được bật
      if (this.settings.autoSave) {
        this.saveQRToHistory(qrOptions);
      }

      this.showNotification("QR Code đã được tạo thành công!", "success");
      this.playSound("success");

      // Refresh AOS để áp dụng animations cho elements mới
      setTimeout(() => {
        AOS.refresh();
      }, 100);
    } catch (error) {
      console.error("Lỗi tạo QR Code:", error);
      this.showNotification(
        "Có lỗi xảy ra khi tạo QR Code. Vui lòng thử lại!",
        "error"
      );
    } finally {
      this.showLoading(false);
    }
  }

  addLogoToQR(canvas, ctx, logoImg) {
    const logoSize = canvas.width * 0.2; // Logo chiếm 20% kích thước
    const logoX = (canvas.width - logoSize) / 2;
    const logoY = (canvas.height - logoSize) / 2;

    // Tạo vùng tròn cho logo
    ctx.save();
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, logoSize / 2, 0, Math.PI * 2);
    ctx.clip();

    // Vẽ logo
    ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
    ctx.restore();

    // Thêm viền trắng xung quanh logo để dễ đọc
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = logoSize * 0.1;
    ctx.stroke();
  }

  displayQRCode(canvas, options) {
    const qrContainer = document.getElementById("qrContainer");
    const qrCanvas = document.getElementById("qrCanvas");
    const qrPlaceholder = document.getElementById("qrPlaceholder");

    // Hiển thị canvas mới
    qrCanvas.width = canvas.width;
    qrCanvas.height = canvas.height;
    qrCanvas.getContext("2d").drawImage(canvas, 0, 0);

    // Hiển thị container và ẩn placeholder
    qrPlaceholder.style.display = "none";
    qrContainer.style.display = "block";

    // Animation
    qrContainer.style.animation = "slideIn 0.5s ease-out";
  }

  // ==================== LOCALSTORAGE ====================

  saveQRToHistory(options) {
    const qrData = {
      id: Date.now(),
      text: options.text,
      size: options.size,
      correction: options.correction,
      color: options.color,
      background: options.background,
      timestamp: new Date().toISOString(),
      canvasData: this.currentQR.canvas.toDataURL(),
    };

    this.qrHistory.unshift(qrData);

    // Giới hạn số lượng lịch sử
    const limit = this.settings.historyLimit || 100;
    if (limit > 0 && this.qrHistory.length > limit) {
      this.qrHistory = this.qrHistory.slice(0, limit);
    }

    localStorage.setItem("qrHistory", JSON.stringify(this.qrHistory));
    this.updateHistoryDisplay();
  }

  loadHistory() {
    const saved = localStorage.getItem("qrHistory");
    if (saved) {
      this.qrHistory = JSON.parse(saved);
      this.updateHistoryDisplay();
    }
  }

  updateHistoryDisplay() {
    const historyList = document.getElementById("historyList");
    const noHistory = document.getElementById("noHistory");

    if (this.qrHistory.length === 0) {
      historyList.innerHTML = "";
      noHistory.style.display = "block";
      return;
    }

    noHistory.style.display = "none";

    historyList.innerHTML = this.qrHistory
      .map(
        (item) => `
            <div class="history-item" data-id="${item.id}">
                <div class="history-preview">
                    <img src="${item.canvasData}" alt="QR Code">
                </div>
                <div class="history-info">
                    <div class="history-text">${this.truncateText(
                      item.text,
                      50
                    )}</div>
                    <div class="history-meta">
                        <small>${new Date(item.timestamp).toLocaleString(
                          "vi-VN"
                        )}</small>
                        <small>${item.size}x${item.size}px</small>
                    </div>
                </div>
                <div class="history-actions">
                    <button class="btn-icon" onclick="app.loadQRFromHistory(${
                      item.id
                    })" title="Tải lại">
                        <i class="fas fa-redo"></i>
                    </button>
                    <button class="btn-icon" onclick="app.downloadHistoryQR(${
                      item.id
                    })" title="Tải xuống">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="btn-icon danger" onclick="app.deleteHistoryItem(${
                      item.id
                    })" title="Xóa">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `
      )
      .join("");
  }

  loadQRFromHistory(id) {
    const item = this.qrHistory.find((h) => h.id === id);
    if (!item) return;

    // Điền thông tin vào form
    document.getElementById("qrText").value = item.text;
    document.getElementById("qrSize").value = item.size;
    document.getElementById("qrCorrection").value = item.correction;
    document.getElementById("qrColor").value = item.color;
    document.getElementById("bgColor").value = item.background;

    // Hiển thị QR Code
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = item.size;
      canvas.height = item.size;
      canvas.getContext("2d").drawImage(img, 0, 0);
      this.displayQRCode(canvas, item);
    };
    img.src = item.canvasData;

    // Chuyển đến tab generator
    this.showSection("generator");

    this.showNotification("Đã tải QR Code từ lịch sử!", "success");
  }

  deleteHistoryItem(id) {
    this.qrHistory = this.qrHistory.filter((h) => h.id !== id);
    localStorage.setItem("qrHistory", JSON.stringify(this.qrHistory));
    this.updateHistoryDisplay();
    this.showNotification("Đã xóa QR Code khỏi lịch sử!", "success");
  }

  clearHistory() {
    this.qrHistory = [];
    localStorage.removeItem("qrHistory");
    this.updateHistoryDisplay();
    this.showNotification("Đã xóa toàn bộ lịch sử!", "success");
  }

  truncateText(text, length) {
    return text.length > length ? text.substring(0, length) + "..." : text;
  }

  // ==================== FILE OPERATIONS ====================

  downloadQR() {
    if (!this.currentQR) {
      this.showNotification("Chưa có QR Code để tải xuống!", "error");
      return;
    }

    const canvas = this.currentQR.canvas;
    const link = document.createElement("a");
    link.download = `qr-code-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();

    this.showNotification("Đã tải xuống QR Code!", "success");
  }

  downloadHistoryQR(id) {
    const item = this.qrHistory.find((h) => h.id === id);
    if (!item) return;

    const link = document.createElement("a");
    link.download = `qr-code-history-${id}.png`;
    link.href = item.canvasData;
    link.click();

    this.showNotification("Đã tải xuống QR Code từ lịch sử!", "success");
  }

  printQR() {
    if (!this.currentQR) {
      this.showNotification("Chưa có QR Code để in!", "error");
      return;
    }

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
            <html>
                <head>
                    <title>QR Code</title>
                    <style>
                        body { text-align: center; margin: 20px; }
                        canvas { max-width: 100%; height: auto; }
                        .info { margin-top: 20px; font-family: Arial, sans-serif; }
                    </style>
                </head>
                <body>
                    <h1>QR Code</h1>
                    <canvas width="${this.currentQR.options.size}" height="${
      this.currentQR.options.size
    }"></canvas>
                    <div class="info">
                        <p><strong>Nội dung:</strong> ${
                          this.currentQR.options.text
                        }</p>
                        <p><strong>Ngày tạo:</strong> ${new Date().toLocaleString(
                          "vi-VN"
                        )}</p>
                    </div>
                </body>
            </html>
        `);

    const canvas = printWindow.document.querySelector("canvas");
    canvas.getContext("2d").drawImage(this.currentQR.canvas, 0, 0);

    printWindow.document.close();
    printWindow.print();
  }

  // ==================== SETTINGS ====================

  loadSettings() {
    const saved = localStorage.getItem("qrSettings");
    this.settings = saved
      ? JSON.parse(saved)
      : {
          darkMode: false,
          autoCollapse: false,
          soundEnabled: true,
          previewEnabled: true,
          autoSave: true,
          historyLimit: 100,
        };
  }

  saveSettings() {
    localStorage.setItem("qrSettings", JSON.stringify(this.settings));
  }

  applyTheme() {
    document.documentElement.setAttribute(
      "data-theme",
      this.settings.darkMode ? "dark" : "light"
    );
  }

  // ==================== UI INTERACTIONS ====================

  bindEvents() {
    // Form submission
    document.getElementById("qrForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.generateQRCode();
    });

    // Alternative button click for QR generation
    document
      .querySelector('button[onclick="app.generateQRCode()"]')
      .addEventListener("click", () => {
        this.generateQRCode();
      });

    // Action buttons
    document.getElementById("clearBtn").addEventListener("click", () => {
      this.clearForm();
    });

    document.getElementById("downloadBtn").addEventListener("click", () => {
      this.downloadQR();
    });

    document.getElementById("saveBtn").addEventListener("click", () => {
      if (this.currentQR) {
        this.saveQRToHistory(this.currentQR.options);
      }
    });

    document.getElementById("printBtn").addEventListener("click", () => {
      this.printQR();
    });

    // Logo upload
    document.getElementById("logoUpload").addEventListener("click", () => {
      document.getElementById("qrLogo").click();
    });

    document.getElementById("qrLogo").addEventListener("change", (e) => {
      this.handleLogoUpload(e);
    });

    // Drag & drop for logo
    const uploadArea = document.getElementById("logoUpload");
    uploadArea.addEventListener("dragover", (e) => {
      e.preventDefault();
      uploadArea.classList.add("drag-over");
    });

    uploadArea.addEventListener("dragleave", () => {
      uploadArea.classList.remove("drag-over");
    });

    uploadArea.addEventListener("drop", (e) => {
      e.preventDefault();
      uploadArea.classList.remove("drag-over");
      this.handleLogoDrop(e);
    });

    // History
    document.getElementById("historySearch").addEventListener("input", (e) => {
      this.searchHistory(e.target.value);
    });

    document.getElementById("clearHistoryBtn").addEventListener("click", () => {
      this.clearHistory();
    });

    // Settings
    document
      .getElementById("darkModeToggle")
      .addEventListener("change", (e) => {
        this.settings.darkMode = e.target.checked;
        this.applyTheme();
        this.saveSettings();
      });

    document
      .getElementById("autoCollapseToggle")
      .addEventListener("change", (e) => {
        this.settings.autoCollapse = e.target.checked;
        this.saveSettings();
      });

    document.getElementById("soundToggle").addEventListener("change", (e) => {
      this.settings.soundEnabled = e.target.checked;
      this.saveSettings();
    });

    document.getElementById("previewToggle").addEventListener("change", (e) => {
      this.settings.previewEnabled = e.target.checked;
      this.saveSettings();
    });

    document
      .getElementById("autoSaveToggle")
      .addEventListener("change", (e) => {
        this.settings.autoSave = e.target.checked;
        this.saveSettings();
      });

    document.getElementById("historyLimit").addEventListener("input", (e) => {
      this.settings.historyLimit = parseInt(e.target.value) || 0;
      this.saveSettings();
    });

    // Sidebar toggle
    document.getElementById("sidebarToggle").addEventListener("click", () => {
      this.toggleSidebar();
    });

    // Overlay click to close sidebar on mobile
    document.getElementById("overlay").addEventListener("click", () => {
      this.toggleSidebar(true);
    });
  }

  setupNavigation() {
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach((item) => {
      item.addEventListener("click", () => {
        const section = item.getAttribute("data-section");
        this.showSection(section);
      });
    });
  }

  showSection(sectionName) {
    // Ẩn tất cả sections
    document.querySelectorAll(".section").forEach((section) => {
      section.classList.remove("active");
    });

    // Bỏ active từ tất cả nav items
    document.querySelectorAll(".nav-item").forEach((item) => {
      item.classList.remove("active");
    });

    // Hiển thị section được chọn
    document.getElementById(sectionName).classList.add("active");

    // Đánh dấu nav item là active
    document
      .querySelector(`[data-section="${sectionName}"]`)
      .classList.add("active");

    // Thu gọn sidebar nếu được bật
    if (this.settings.autoCollapse) {
      setTimeout(() => {
        this.toggleSidebar(true);
      }, 1000);
    }
  }

  toggleSidebar(collapse = null) {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");
    const isCollapsed = sidebar.classList.contains("collapsed");
    const isMobile = window.innerWidth <= 767.98;

    if (collapse === null) {
      collapse = !isCollapsed;
    }

    if (isMobile) {
      // Mobile behavior: slide in/out from left
      if (collapse) {
        sidebar.style.transform = "translateX(-100%)";
        overlay.classList.remove("active");
      } else {
        sidebar.style.transform = "translateX(0)";
        overlay.classList.add("active");
      }
    } else {
      // Desktop behavior: collapse/expand
      if (collapse) {
        sidebar.classList.add("collapsed");
      } else {
        sidebar.classList.remove("collapsed");
      }
    }
  }

  clearForm() {
    document.getElementById("qrForm").reset();
    document.getElementById("qrContainer").style.display = "none";
    document.getElementById("qrPlaceholder").style.display = "block";
    this.currentQR = null;
  }

  handleLogoUpload(event) {
    const file = event.target.files[0];
    if (file) {
      this.processLogoFile(file);
    }
  }

  handleLogoDrop(event) {
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      this.processLogoFile(files[0]);
    }
  }

  processLogoFile(file) {
    if (!file.type.startsWith("image/")) {
      this.showNotification("Chỉ chấp nhận file hình ảnh!", "error");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      this.showNotification(
        "Kích thước file không được vượt quá 2MB!",
        "error"
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Lưu logo vào biến tạm để sử dụng khi tạo QR
        this.tempLogo = img;
        document.querySelector(
          ".upload-content span"
        ).textContent = `Đã chọn: ${file.name}`;
        this.showNotification("Logo đã được tải lên thành công!", "success");
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  searchHistory(query) {
    const items = document.querySelectorAll(".history-item");
    const lowerQuery = query.toLowerCase();

    items.forEach((item) => {
      const text = item
        .querySelector(".history-text")
        .textContent.toLowerCase();
      if (text.includes(lowerQuery)) {
        item.style.display = "flex";
      } else {
        item.style.display = "none";
      }
    });
  }

  // ==================== CAMERA SCANNER ====================

  setupScanner() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn("Camera not supported");
      return;
    }

    document.getElementById("startScanBtn").addEventListener("click", () => {
      this.startScanning();
    });
  }

  async startScanning() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      this.scannerStream = stream;
      const video = document.getElementById("scannerVideo");
      const canvas = document.getElementById("scannerCanvas");
      const placeholder = document.getElementById("scannerPlaceholder");

      video.srcObject = stream;
      video.style.display = "block";
      placeholder.style.display = "none";

      this.isScanning = true;
      this.scanQRCode(video, canvas);
    } catch (error) {
      console.error("Lỗi truy cập camera:", error);
      this.showNotification(
        "Không thể truy cập camera. Vui lòng kiểm tra quyền!",
        "error"
      );
    }
  }

  scanQRCode(video, canvas) {
    const ctx = canvas.getContext("2d");

    const scan = () => {
      if (!this.isScanning) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Sử dụng jsQR để quét QR Code
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        // Tìm thấy QR Code!
        this.showScanResult(code.data);
        this.stopScanning();
        this.showNotification("Đã quét thành công QR Code!", "success");
        this.playSound("success");
        return;
      }

      // Tiếp tục quét
      requestAnimationFrame(scan);
    };

    // Hiển thị thông báo hướng dẫn
    this.showNotification(
      "Đang quét... Hãy đưa QR Code vào khung hình!",
      "info"
    );

    scan();
  }

  showScanResult(data) {
    const resultContent = document.getElementById("resultContent");
    const scanResults = document.getElementById("scanResults");

    resultContent.textContent = data;
    scanResults.style.display = "block";

    // Setup các nút action
    document.getElementById("copyResultBtn").onclick = () => {
      navigator.clipboard.writeText(data).then(() => {
        this.showNotification("Đã sao chép vào clipboard!", "success");
      });
    };

    document.getElementById("openResultBtn").onclick = () => {
      // Kiểm tra nếu là URL
      if (data.startsWith("http://") || data.startsWith("https://")) {
        window.open(data, "_blank");
      } else {
        this.showNotification("Nội dung không phải là URL hợp lệ!", "warning");
      }
    };

    // Tự động điền vào form tạo QR Code
    document.getElementById("qrText").value = data;
    this.showSection("generator");
  }

  stopScanning() {
    if (this.scannerStream) {
      this.scannerStream.getTracks().forEach((track) => track.stop());
    }
    this.isScanning = false;

    const video = document.getElementById("scannerVideo");
    const placeholder = document.getElementById("scannerPlaceholder");

    video.style.display = "none";
    placeholder.style.display = "block";
  }
}

// Khởi tạo ứng dụng khi DOM đã sẵn sàng
let app;
document.addEventListener("DOMContentLoaded", () => {
  app = new QRCodeApp();
});

// Global functions để gọi từ HTML onclick
function loadQRFromHistory(id) {
  app.loadQRFromHistory(id);
}
function downloadHistoryQR(id) {
  app.downloadHistoryQR(id);
}
function deleteHistoryItem(id) {
  app.deleteHistoryItem(id);
}
