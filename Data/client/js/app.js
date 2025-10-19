// Modern Chat Client Application
class ChatApp {
  constructor() {
    this.token = localStorage.getItem("chatToken");
    this.user = null;
    this.currentSection = "chat";
    this.init();
  }

  init() {
    this.bindEvents();
    this.checkAuth();
    this.setupAnimations();
  }

  bindEvents() {
    // Auth forms
    const loginForm = document.getElementById("login");
    const registerForm = document.getElementById("register");

    if (loginForm) {
      loginForm.addEventListener("submit", (e) => this.handleLogin(e));
    }
    if (registerForm) {
      registerForm.addEventListener("submit", (e) => this.handleRegister(e));
    }

    // Auth toggles
    const showRegister = document.getElementById("showRegister");
    const showLogin = document.getElementById("showLogin");

    if (showRegister) {
      showRegister.addEventListener("click", (e) => {
        e.preventDefault();
        this.showForm("registerForm");
      });
    }
    if (showLogin) {
      showLogin.addEventListener("click", (e) => {
        e.preventDefault();
        this.showForm("loginForm");
      });
    }

    // Navigation
    document.querySelectorAll(".nav-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        const section = e.currentTarget.dataset.section;
        this.switchSection(section);
      });
    });

    // Profile form
    const profileForm = document.getElementById("profileForm");
    if (profileForm) {
      profileForm.addEventListener("submit", (e) =>
        this.handleProfileUpdate(e)
      );
    }

    // Logout
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => this.handleLogout());
    }

    // Add friend
    const addFriend = document.getElementById("addFriend");
    if (addFriend) {
      addFriend.addEventListener("click", () => this.showAddFriendModal());
    }

    // Modal close
    const modalClose = document.querySelector(".modal-close");
    if (modalClose) {
      modalClose.addEventListener("click", () => this.closeModal());
    }

    // Settings
    this.bindSettings();
  }

  setupAnimations() {
    // Add entrance animations
    setTimeout(() => {
      document.querySelectorAll(".form-group").forEach((el, index) => {
        el.style.animationDelay = `${index * 0.1}s`;
        el.classList.add("animate-slide-in-up");
      });
    }, 100);
  }

  checkAuth() {
    const loading = document.getElementById("loading");
    const auth = document.getElementById("auth");
    const chatInterface = document.getElementById("chatInterface");

    if (this.token) {
      // Verify token and load user data
      this.verifyToken().then((success) => {
        if (success) {
          loading.classList.add("hidden");
          auth.classList.add("hidden");
          chatInterface.classList.remove("hidden");
          this.loadUserData();
          this.loadInitialData();
        } else {
          this.logout();
        }
      });
    } else {
      loading.classList.add("hidden");
      auth.classList.remove("hidden");
      chatInterface.classList.add("hidden");
      this.showForm("loginForm");
    }
  }

  async verifyToken() {
    try {
      const response = await fetch("/api/v1/verify-token", {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });
      const result = await response.json();
      return result.authenticated || response.ok;
    } catch (error) {
      console.error("Token verification failed:", error);
      return false;
    }
  }

  showForm(formId) {
    document.querySelectorAll(".form-section").forEach((form) => {
      form.classList.remove("active");
    });
    document.getElementById(formId).classList.add("active");
  }

  async handleLogin(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(data).toString(),
      });

      const result = await response.json();

      if (result.success) {
        this.token = result.token;
        this.user = result.user;
        localStorage.setItem("chatToken", this.token);
        this.showToast("Đăng nhập thành công!", "success");
        setTimeout(() => {
          location.reload();
        }, 1000);
      } else {
        this.showToast(result.message || "Đăng nhập thất bại", "error");
      }
    } catch (error) {
      console.error("Login error:", error);
      this.showToast("Lỗi kết nối", "error");
    }
  }

  async handleRegister(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    try {
      const response = await fetch("/api/v1/signIn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        this.showToast("Đăng ký thành công! Vui lòng đăng nhập.", "success");
        this.showForm("loginForm");
        e.target.reset();
      } else {
        this.showToast(result.message || "Đăng ký thất bại", "error");
      }
    } catch (error) {
      console.error("Register error:", error);
      this.showToast("Lỗi kết nối", "error");
    }
  }

  async loadUserData() {
    try {
      const response = await fetch("/api/v1/profile", {
        headers: { Authorization: `Bearer ${this.token}` },
      });

      if (response.ok) {
        this.user = await response.json();
        this.updateUserUI();
      }
    } catch (error) {
      console.error("Failed to load user data:", error);
    }
  }

  updateUserUI() {
    if (!this.user) return;

    const userName = document.getElementById("userName");
    const userStatus = document.getElementById("userStatus");

    if (userName) userName.textContent = this.user.name || "Người dùng";
    if (userStatus)
      userStatus.innerHTML = '<i class="fas fa-circle online"></i> Online';
  }

  switchSection(section) {
    // Update navigation
    document.querySelectorAll(".nav-item").forEach((item) => {
      item.classList.remove("active");
    });
    document
      .querySelector(`[data-section="${section}"]`)
      .classList.add("active");

    // Update content
    document.querySelectorAll(".content-section").forEach((content) => {
      content.classList.remove("active");
    });
    document.getElementById(`${section}Section`).classList.add("active");

    this.currentSection = section;
    this.loadSectionData(section);
  }

  async loadSectionData(section) {
    switch (section) {
      case "chat":
        await this.loadChatList();
        break;
      case "friends":
        await this.loadFriendsList();
        break;
      case "profile":
        await this.loadProfile();
        break;
    }
  }

  async loadInitialData() {
    await Promise.all([
      this.loadChatList(),
      this.loadFriendsList(),
      this.loadProfile(),
    ]);
  }

  async loadChatList() {
    try {
      const response = await fetch("/chat/users", {
        headers: { Authorization: `Bearer ${this.token}` },
      });

      if (response.ok) {
        const users = await response.json();
        this.renderChatList(users);
      }
    } catch (error) {
      console.error("Failed to load chat list:", error);
    }
  }

  renderChatList(users) {
    const chatList = document.getElementById("chatList");
    if (!chatList) return;

    chatList.innerHTML = "";

    if (!users || users.length === 0) {
      chatList.innerHTML =
        '<div class="empty-state">Chưa có cuộc trò chuyện nào</div>';
      return;
    }

    users.forEach((user) => {
      const chatItem = document.createElement("div");
      chatItem.className = "chat-item animate-fade-in";
      chatItem.innerHTML = `
                <div class="avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="chat-info">
                    <h4>${user.name}</h4>
                    <p>@${user.username}</p>
                </div>
                <div class="chat-time">
                    ${this.formatTime(user.lastActive)}
                </div>
            `;
      chatItem.addEventListener("click", () => this.openChat(user));
      chatList.appendChild(chatItem);
    });
  }

  async loadFriendsList() {
    try {
      const response = await fetch("/chat/friends", {
        headers: { Authorization: `Bearer ${this.token}` },
      });

      if (response.ok) {
        const friends = await response.json();
        this.renderFriendsList(friends);
      }
    } catch (error) {
      console.error("Failed to load friends list:", error);
    }
  }

  renderFriendsList(friends) {
    const friendsList = document.getElementById("friendsList");
    if (!friendsList) return;

    friendsList.innerHTML = "";

    if (!friends || friends.length === 0) {
      friendsList.innerHTML =
        '<div class="empty-state">Chưa có bạn bè nào</div>';
      return;
    }

    friends.forEach((friend) => {
      const friendItem = document.createElement("div");
      friendItem.className = "friend-item animate-fade-in";
      friendItem.innerHTML = `
                <div class="avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="friend-info">
                    <h4>${friend.name}</h4>
                    <p>@${friend.username}</p>
                </div>
                <div class="friend-actions">
                    <button class="btn btn-outline btn-sm">
                        <i class="fas fa-comment"></i>
                    </button>
                </div>
            `;
      friendsList.appendChild(friendItem);
    });
  }

  async loadProfile() {
    if (!this.user) return;

    const profileName = document.getElementById("profileName");
    const profileUsername = document.getElementById("profileUsername");
    const profileAge = document.getElementById("profileAge");
    const profileAddress = document.getElementById("profileAddress");
    const profilePhone = document.getElementById("profilePhone");
    const profileBio = document.getElementById("profileBio");

    if (profileName) profileName.textContent = this.user.name;
    if (profileUsername) profileUsername.value = this.user.username || "";
    if (profileAge) profileAge.value = this.user.age || "";
    if (profileAddress) profileAddress.value = this.user.address || "";
    if (profilePhone) profilePhone.value = this.user.phone || "";
    if (profileBio) profileBio.value = this.user.bio || "";
  }

  async handleProfileUpdate(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    try {
      const response = await fetch("/chat/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        this.showToast("Cập nhật hồ sơ thành công!", "success");
        await this.loadUserData();
        await this.loadProfile();
      } else {
        this.showToast(result.message || "Cập nhật thất bại", "error");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      this.showToast("Lỗi kết nối", "error");
    }
  }

  showAddFriendModal() {
    const modal = document.getElementById("modal");
    const modalTitle = document.getElementById("modalTitle");
    const modalBody = document.getElementById("modalBody");

    modalTitle.textContent = "Thêm bạn bè";
    modalBody.innerHTML = `
            <form id="addFriendForm">
                <div class="form-group">
                    <label for="friendUsername">Tên đăng nhập:</label>
                    <input type="text" id="friendUsername" required>
                </div>
                <button type="submit" class="btn btn-primary">Gửi lời mời</button>
            </form>
        `;

    const addFriendForm = document.getElementById("addFriendForm");
    addFriendForm.addEventListener("submit", (e) => this.handleAddFriend(e));

    modal.classList.add("active");
  }

  async handleAddFriend(e) {
    e.preventDefault();
    const username = document.getElementById("friendUsername").value;

    try {
      const response = await fetch("/chat/add-friend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({ username }),
      });

      const result = await response.json();

      if (result.success) {
        this.showToast("Gửi lời mời kết bạn thành công!", "success");
        this.closeModal();
        await this.loadFriendsList();
      } else {
        this.showToast(result.message || "Gửi lời mời thất bại", "error");
      }
    } catch (error) {
      console.error("Add friend error:", error);
      this.showToast("Lỗi kết nối", "error");
    }
  }

  closeModal() {
    const modal = document.getElementById("modal");
    modal.classList.remove("active");
  }

  bindSettings() {
    const themeToggle = document.getElementById("themeToggle");
    const notifications = document.getElementById("notifications");
    const soundEnabled = document.getElementById("soundEnabled");

    if (themeToggle) {
      themeToggle.addEventListener("change", (e) => {
        document.body.classList.toggle("dark-theme", e.target.checked);
        localStorage.setItem("darkTheme", e.target.checked);
      });

      // Load saved theme
      const savedTheme = localStorage.getItem("darkTheme") === "true";
      themeToggle.checked = savedTheme;
      document.body.classList.toggle("dark-theme", savedTheme);
    }

    if (notifications) {
      notifications.addEventListener("change", (e) => {
        localStorage.setItem("notifications", e.target.checked);
      });
      notifications.checked = localStorage.getItem("notifications") !== "false";
    }

    if (soundEnabled) {
      soundEnabled.addEventListener("change", (e) => {
        localStorage.setItem("soundEnabled", e.target.checked);
      });
      soundEnabled.checked = localStorage.getItem("soundEnabled") !== "false";
    }
  }

  handleLogout() {
    this.logout();
    location.reload();
  }

  logout() {
    localStorage.removeItem("chatToken");
    this.token = null;
    this.user = null;
  }

  showToast(message, type = "info") {
    const toast = document.getElementById("toast");
    const toastMessage = document.getElementById("toastMessage");

    toastMessage.textContent = message;
    toast.className = `toast ${type}`;

    toast.classList.add("show");

    setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  }

  formatTime(dateString) {
    if (!dateString) return "";

    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Vừa xong";
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    return `${days} ngày trước`;
  }

  openChat(user) {
    // Implement chat opening logic
    this.showToast(`Mở chat với ${user.name}`, "info");
  }
}

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.chatApp = new ChatApp();
});
