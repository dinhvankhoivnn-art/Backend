// Main JavaScript file for JWT User Management System

// Global variables
let currentUser = null;
let authToken = localStorage.getItem('authToken');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize application
function initializeApp() {
    // Check authentication
    if (authToken) {
        try {
            currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            if (currentUser && currentUser.id) {
                showAuthenticatedContent();
            } else {
                showLoginForm();
            }
        } catch (error) {
            console.error('Error parsing user data:', error);
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            showLoginForm();
        }
    } else {
        showLoginForm();
    }
    
    // Setup event listeners
    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // User form
    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.addEventListener('submit', handleUserSubmit);
    }
    
    // Search form
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearch);
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Modal close buttons
    const closeButtons = document.querySelectorAll('.close');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                closeModal();
            }
        });
    });
}

// Show login form
function showLoginForm() {
    const content = `
        <div class="card">
            <h2>🔐 Đăng nhập</h2>
            <form id="loginForm">
                <div class="form-group">
                    <label for="email">Email:</label>
                    <input type="email" id="email" name="email" required>
                </div>
                <div class="form-group">
                    <label for="password">Mật khẩu:</label>
                    <input type="password" id="password" name="password" required>
                </div>
                <button type="submit" class="btn">Đăng nhập</button>
            </form>
            <div class="text-center mt-20">
                <p>Chưa có tài khoản? <a href="#" onclick="showRegisterForm()">Đăng ký ngay</a></p>
            </div>
        </div>
    `;
    document.getElementById('app').innerHTML = content;
    setupEventListeners();
}

// Show register form
function showRegisterForm() {
    const content = `
        <div class="card">
            <h2>📝 Đăng ký tài khoản</h2>
            <form id="registerForm">
                <div class="form-row">
                    <div class="form-group">
                        <label for="regName">Họ tên:</label>
                        <input type="text" id="regName" name="name" required>
                    </div>
                    <div class="form-group">
                        <label for="regAge">Tuổi:</label>
                        <input type="number" id="regAge" name="age" min="18" max="80" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="regPhone">Số điện thoại:</label>
                        <input type="tel" id="regPhone" name="phone" required>
                    </div>
                    <div class="form-group">
                        <label for="regEmail">Email:</label>
                        <input type="email" id="regEmail" name="email" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="regPassword">Mật khẩu:</label>
                    <input type="password" id="regPassword" name="password" required>
                </div>
                <button type="submit" class="btn btn-success">Đăng ký</button>
            </form>
            <div class="text-center mt-20">
                <p>Đã có tài khoản? <a href="#" onclick="showLoginForm()">Đăng nhập</a></p>
            </div>
        </div>
    `;
    document.getElementById('app').innerHTML = content;
    setupEventListeners();
}

// Show authenticated content
function showAuthenticatedContent() {
    const content = `
        <div class="header">
            <h1>👥 Quản lý User</h1>
            <p>Xin chào, ${currentUser.name || 'User'}!</p>
            <div class="nav">
                <a href="#" onclick="showUserList()">📋 Danh sách User</a>
                <a href="#" onclick="showCreateUser()">➕ Thêm User</a>
                <a href="#" onclick="showSearchUser()">🔍 Tìm kiếm</a>
                <a href="#" onclick="showUserById()">🔎 Tìm theo ID</a>
                <a href="#" onclick="handleLogout()" class="logout">🚪 Đăng xuất</a>
            </div>
        </div>
        <div id="content">
            ${getUserListContent()}
        </div>
    `;
    document.getElementById('app').innerHTML = content;
    loadUserList();
}

// Get user list content
function getUserListContent() {
    return `
        <div class="card">
            <h2>📋 Danh sách User</h2>
            <div class="search-container">
                <input type="text" id="searchInput" class="search-input" placeholder="Tìm kiếm user...">
                <button onclick="handleSearch()" class="btn search-btn">🔍 Tìm kiếm</button>
            </div>
            <div id="userList">
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Đang tải dữ liệu...</p>
                </div>
            </div>
        </div>
    `;
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    try {
        showLoading();
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            authToken = result.data.token;
            currentUser = result.data.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showAuthenticatedContent();
            showAlert('Đăng nhập thành công!', 'success');
        } else {
            showAlert(result.message, 'error');
        }
    } catch (error) {
        showAlert('Lỗi kết nối server!', 'error');
    }
}

// Handle register
async function handleRegister(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    try {
        showLoading();
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('Đăng ký thành công! Vui lòng đăng nhập.', 'success');
            showLoginForm();
        } else {
            showAlert(result.message, 'error');
        }
    } catch (error) {
        showAlert('Lỗi kết nối server!', 'error');
    }
}

// Handle logout
function handleLogout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    authToken = null;
    currentUser = null;
    showLoginForm();
    showAlert('Đã đăng xuất!', 'success');
}

// Load user list
async function loadUserList(page = 1, limit = 10) {
    try {
        const response = await fetch(`/api/users?page=${page}&limit=${limit}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            displayUserList(result.data);
        } else {
            showAlert(result.message, 'error');
        }
    } catch (error) {
        showAlert('Lỗi tải danh sách user!', 'error');
    }
}

// Display user list
function displayUserList(data) {
    const { users, pagination } = data;
    
    let html = `
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Tên</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Tuổi</th>
                        <th>Role</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    users.forEach(user => {
        html += `
            <tr>
                <td>${user._id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.phone}</td>
                <td>${user.age}</td>
                <td><span class="badge ${user.role === 'admin' ? 'admin' : 'user'}">${user.role}</span></td>
                <td>
                    <button onclick="editUser('${user._id}')" class="btn btn-warning btn-small">✏️</button>
                    <button onclick="deleteUser('${user._id}')" class="btn btn-danger btn-small">🗑️</button>
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    // Add pagination
    if (pagination.totalPages > 1) {
        html += `
            <div class="pagination">
                ${pagination.hasPrevPage ? `<a href="#" onclick="loadUserList(${pagination.currentPage - 1})">« Trước</a>` : ''}
                <span class="current">Trang ${pagination.currentPage} / ${pagination.totalPages}</span>
                ${pagination.hasNextPage ? `<a href="#" onclick="loadUserList(${pagination.currentPage + 1})">Sau »</a>` : ''}
            </div>
        `;
    }
    
    document.getElementById('userList').innerHTML = html;
}

// Show user list
function showUserList() {
    document.getElementById('content').innerHTML = getUserListContent();
    loadUserList();
}

// Show create user form
function showCreateUser() {
    const content = `
        <div class="card">
            <h2>➕ Thêm User Mới</h2>
            <form id="userForm">
                <input type="hidden" id="userId" name="id">
                <div class="form-row">
                    <div class="form-group">
                        <label for="userName">Họ tên:</label>
                        <input type="text" id="userName" name="name" required>
                    </div>
                    <div class="form-group">
                        <label for="userAge">Tuổi:</label>
                        <input type="number" id="userAge" name="age" min="18" max="80" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="userPhone">Số điện thoại:</label>
                        <input type="tel" id="userPhone" name="phone" required>
                    </div>
                    <div class="form-group">
                        <label for="userEmail">Email:</label>
                        <input type="email" id="userEmail" name="email" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="userPassword">Mật khẩu:</label>
                        <input type="password" id="userPassword" name="password" required>
                    </div>
                    <div class="form-group">
                        <label for="userRole">Role:</label>
                        <select id="userRole" name="role">
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                </div>
                <button type="submit" class="btn btn-success">💾 Lưu</button>
                <button type="button" onclick="showUserList()" class="btn">❌ Hủy</button>
            </form>
        </div>
    `;
    document.getElementById('content').innerHTML = content;
    setupEventListeners();
}

// Show search form
function showSearchUser() {
    const content = `
        <div class="card">
            <h2>🔍 Tìm kiếm User</h2>
            <form id="searchForm">
                <div class="form-group">
                    <label for="searchQuery">Từ khóa tìm kiếm:</label>
                    <input type="text" id="searchQuery" name="query" placeholder="Nhập tên hoặc email..." required>
                </div>
                <button type="submit" class="btn search-btn">🔍 Tìm kiếm</button>
            </form>
            <div id="searchResults"></div>
        </div>
    `;
    document.getElementById('content').innerHTML = content;
    setupEventListeners();
}

// Show user by ID form
function showUserById() {
    const content = `
        <div class="card">
            <h2>🔎 Tìm User theo ID</h2>
            <form id="userByIdForm">
                <div class="form-group">
                    <label for="userIdInput">ID User:</label>
                    <input type="text" id="userIdInput" name="id" placeholder="Nhập ID user..." required>
                </div>
                <button type="submit" class="btn">🔍 Tìm kiếm</button>
            </form>
            <div id="userByIdResults"></div>
        </div>
    `;
    document.getElementById('content').innerHTML = content;
    
    // Setup form listener
    const form = document.getElementById('userByIdForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const id = formData.get('id');
        
        try {
            showLoading('userByIdResults');
            const response = await fetch(`/api/users/${id}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                displayUserById(result.data);
            } else {
                showAlert(result.message, 'error', 'userByIdResults');
            }
        } catch (error) {
            showAlert('Lỗi tải thông tin user!', 'error', 'userByIdResults');
        }
    });
}

// Handle user form submit
async function handleUserSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    const userId = data.id;
    
    try {
        showLoading();
        const url = userId ? `/api/users/${userId}` : '/api/users';
        const method = userId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert(userId ? 'Cập nhật user thành công!' : 'Tạo user thành công!', 'success');
            showUserList();
        } else {
            showAlert(result.message, 'error');
        }
    } catch (error) {
        showAlert('Lỗi xử lý user!', 'error');
    }
}

// Handle search
async function handleSearch(e) {
    if (e) e.preventDefault();
    
    const query = document.getElementById('searchQuery')?.value || document.getElementById('searchInput')?.value;
    if (!query) return;
    
    try {
        showLoading('searchResults');
        const response = await fetch(`/api/users/search?query=${encodeURIComponent(query)}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            displaySearchResults(result.data);
        } else {
            showAlert(result.message, 'error', 'searchResults');
        }
    } catch (error) {
        showAlert('Lỗi tìm kiếm!', 'error', 'searchResults');
    }
}

// Display search results
function displaySearchResults(data) {
    const { users } = data;
    
    let html = `
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Tên</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Tuổi</th>
                        <th>Role</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    users.forEach(user => {
        html += `
            <tr>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.phone}</td>
                <td>${user.age}</td>
                <td><span class="badge ${user.role === 'admin' ? 'admin' : 'user'}">${user.role}</span></td>
                <td>
                    <button onclick="editUser('${user._id}')" class="btn btn-warning btn-small">✏️</button>
                    <button onclick="deleteUser('${user._id}')" class="btn btn-danger btn-small">🗑️</button>
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    document.getElementById('searchResults').innerHTML = html;
}

// Display user by ID
function displayUserById(user) {
    const html = `
        <div class="card">
            <h3>👤 Thông tin User</h3>
            <div class="user-details">
                <p><strong>ID:</strong> ${user._id}</p>
                <p><strong>Tên:</strong> ${user.name}</p>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Phone:</strong> ${user.phone}</p>
                <p><strong>Tuổi:</strong> ${user.age}</p>
                <p><strong>Role:</strong> <span class="badge ${user.role === 'admin' ? 'admin' : 'user'}">${user.role}</span></p>
                <p><strong>Ngày tạo:</strong> ${new Date(user.createdAt).toLocaleString()}</p>
            </div>
            <div class="mt-20">
                <button onclick="editUser('${user._id}')" class="btn btn-warning">✏️ Chỉnh sửa</button>
                <button onclick="deleteUser('${user._id}')" class="btn btn-danger">🗑️ Xóa</button>
            </div>
        </div>
    `;
    
    document.getElementById('userByIdResults').innerHTML = html;
}

// Edit user
async function editUser(userId) {
    try {
        showLoading();
        const response = await fetch(`/api/users/${userId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            const user = result.data;
            showCreateUser();
            
            // Fill form with user data
            document.getElementById('userId').value = user._id;
            document.getElementById('userName').value = user.name;
            document.getElementById('userAge').value = user.age;
            document.getElementById('userPhone').value = user.phone;
            document.getElementById('userEmail').value = user.email;
            document.getElementById('userRole').value = user.role;
            document.getElementById('userPassword').required = false;
            document.getElementById('userPassword').placeholder = 'Để trống nếu không muốn đổi mật khẩu';
        } else {
            showAlert(result.message, 'error');
        }
    } catch (error) {
        showAlert('Lỗi tải thông tin user!', 'error');
    }
}

// Delete user
async function deleteUser(userId) {
    if (!confirm('Bạn có chắc chắn muốn xóa user này?')) return;
    
    try {
        showLoading();
        const response = await fetch(`/api/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('Xóa user thành công!', 'success');
            showUserList();
        } else {
            showAlert(result.message, 'error');
        }
    } catch (error) {
        showAlert('Lỗi xóa user!', 'error');
    }
}

// Show loading
function showLoading(containerId = 'content') {
    const loadingHtml = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Đang xử lý...</p>
        </div>
    `;
    document.getElementById(containerId).innerHTML = loadingHtml;
}

// Show alert
function showAlert(message, type, containerId = 'content') {
    const alertHtml = `
        <div class="alert alert-${type}">
            ${message}
        </div>
    `;
    
    if (containerId === 'content') {
        document.getElementById('content').innerHTML = alertHtml;
        setTimeout(() => {
            showUserList();
        }, 2000);
    } else {
        document.getElementById(containerId).innerHTML = alertHtml;
    }
}

// Close modal
function closeModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
}

// Utility functions
function formatDate(dateString) {
    return new Date(dateString).toLocaleString('vi-VN');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
