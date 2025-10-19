/**
 * Main JavaScript file for the application
 * Handles common functionality across all pages
 */

// DOM Content Loaded
document.addEventListener("DOMContentLoaded", function () {
  initializeApp();
});

/**
 * Initialize the application
 */
function initializeApp() {
  setupEventListeners();
  initializeComponents();
  setupAjaxDefaults();
}

/**
 * Setup global event listeners
 */
function setupEventListeners() {
  // Close alerts
  document.addEventListener("click", function (e) {
    if (e.target.classList.contains("alert-close")) {
      closeAlert(e.target);
    }
  });

  // Auto-hide alerts after 5 seconds
  setTimeout(function () {
    const alerts = document.querySelectorAll(".flash-message");
    alerts.forEach((alert) => {
      if (!alert.classList.contains("alert-error")) {
        closeAlert(alert.querySelector(".alert-close"));
      }
    });
  }, 5000);

  // Handle form submissions with loading states
  document.addEventListener("submit", function (e) {
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');

    if (submitBtn) {
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
      submitBtn.disabled = true;

      // Re-enable after 10 seconds (fallback)
      setTimeout(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }, 10000);
    }
  });

  // Handle keyboard shortcuts
  document.addEventListener("keydown", function (e) {
    // ESC to close modals
    if (e.key === "Escape") {
      const modals = document.querySelectorAll(".modal");
      modals.forEach((modal) => {
        if (modal.style.display === "flex") {
          modal.style.display = "none";
        }
      });
    }

    // Ctrl/Cmd + K for search (if search input exists)
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      const searchInput = document.getElementById("searchInput");
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    }
  });
}

/**
 * Initialize UI components
 */
function initializeComponents() {
  // Initialize tooltips
  initializeTooltips();

  // Initialize dropdowns
  initializeDropdowns();

  // Initialize modals
  initializeModals();

  // Initialize tables
  initializeTables();

  // Initialize form validations
  initializeFormValidations();
}

/**
 * Setup AJAX defaults
 */
function setupAjaxDefaults() {
  // Setup CSRF token for all AJAX requests
  const csrfToken = document
    .querySelector('meta[name="csrf-token"]')
    ?.getAttribute("content");

  if (csrfToken) {
    // Override fetch to include CSRF token
    const originalFetch = window.fetch;
    window.fetch = function (url, options = {}) {
      options.headers = options.headers || {};
      if (
        !options.headers["X-CSRF-Token"] &&
        !options.headers["authorization"]
      ) {
        options.headers["X-CSRF-Token"] = csrfToken;
      }
      return originalFetch.call(this, url, options);
    };

    // Setup for XMLHttpRequest if needed
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (
      method,
      url,
      async,
      user,
      password
    ) {
      this.addEventListener("loadstart", function () {
        if (
          !this.getRequestHeader("X-CSRF-Token") &&
          !this.getRequestHeader("Authorization")
        ) {
          this.setRequestHeader("X-CSRF-Token", csrfToken);
        }
      });
      return originalOpen.call(this, method, url, async, user, password);
    };
  }
}

/**
 * Close alert function
 */
function closeAlert(closeBtn) {
  if (!closeBtn) return;

  const alert =
    closeBtn.closest(".flash-message") || closeBtn.closest(".alert");
  if (alert) {
    alert.style.animation = "slideOutRight 0.5s ease-in forwards";
    setTimeout(() => {
      alert.remove();
    }, 500);
  }
}

/**
 * Initialize tooltips
 */
function initializeTooltips() {
  const tooltipElements = document.querySelectorAll("[data-tooltip]");

  tooltipElements.forEach((element) => {
    element.addEventListener("mouseenter", showTooltip);
    element.addEventListener("mouseleave", hideTooltip);
  });
}

/**
 * Show tooltip
 */
function showTooltip(e) {
  const element = e.target;
  const tooltipText = element.getAttribute("data-tooltip");

  if (!tooltipText) return;

  // Remove existing tooltips
  hideTooltip();

  const tooltip = document.createElement("div");
  tooltip.className = "tooltip";
  tooltip.textContent = tooltipText;

  document.body.appendChild(tooltip);

  // Position tooltip
  const rect = element.getBoundingClientRect();
  tooltip.style.left =
    rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + "px";
  tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + "px";

  // Show with animation
  setTimeout(() => {
    tooltip.classList.add("visible");
  }, 10);
}

/**
 * Hide tooltip
 */
function hideTooltip() {
  const tooltips = document.querySelectorAll(".tooltip");
  tooltips.forEach((tooltip) => {
    tooltip.classList.remove("visible");
    setTimeout(() => {
      if (tooltip.parentNode) {
        tooltip.parentNode.removeChild(tooltip);
      }
    }, 200);
  });
}

/**
 * Initialize dropdowns
 */
function initializeDropdowns() {
  // Close dropdowns when clicking outside
  document.addEventListener("click", function (e) {
    const dropdowns = document.querySelectorAll(".dropdown");
    dropdowns.forEach((dropdown) => {
      if (!dropdown.contains(e.target)) {
        const menu = dropdown.querySelector(".dropdown-menu");
        if (menu) {
          menu.style.display = "none";
        }
      }
    });
  });
}

/**
 * Toggle dropdown menu
 */
function toggleDropdown() {
  const dropdown = event.target.closest(".dropdown");
  const menu = dropdown.querySelector(".dropdown-menu");

  if (menu) {
    menu.style.display = menu.style.display === "block" ? "none" : "block";
  }
}

/**
 * Initialize modals
 */
function initializeModals() {
  // Close modal when clicking outside
  window.onclick = function (event) {
    if (event.target.classList.contains("modal")) {
      event.target.style.display = "none";
    }
  };
}

/**
 * Initialize tables with sorting and pagination
 */
function initializeTables() {
  const tables = document.querySelectorAll(".users-table");

  tables.forEach((table) => {
    // Add sorting functionality
    const headers = table.querySelectorAll("th");
    headers.forEach((header, index) => {
      header.style.cursor = "pointer";
      header.addEventListener("click", () => sortTable(table, index));
    });
  });
}

/**
 * Sort table by column
 */
function sortTable(table, column) {
  const tbody = table.querySelector("tbody");
  const rows = Array.from(tbody.querySelectorAll("tr"));

  rows.sort((a, b) => {
    const aValue = a.cells[column].textContent.trim();
    const bValue = b.cells[column].textContent.trim();

    // Check if values are numbers
    const aNum = parseFloat(aValue);
    const bNum = parseFloat(bValue);

    if (!isNaN(aNum) && !isNaN(bNum)) {
      return aNum - bNum;
    }

    return aValue.localeCompare(bValue);
  });

  // Re-append sorted rows
  rows.forEach((row) => tbody.appendChild(row));
}

/**
 * Initialize form validations
 */
function initializeFormValidations() {
  const forms = document.querySelectorAll("form[data-validate]");

  forms.forEach((form) => {
    form.addEventListener("submit", function (e) {
      if (!validateForm(this)) {
        e.preventDefault();
      }
    });
  });
}

/**
 * Validate form
 */
function validateForm(form) {
  let isValid = true;
  const inputs = form.querySelectorAll("input, textarea, select");

  inputs.forEach((input) => {
    const rules = input.getAttribute("data-validate")?.split(" ") || [];

    rules.forEach((rule) => {
      if (!validateField(input, rule)) {
        isValid = false;
        showFieldError(input, getErrorMessage(rule));
      }
    });
  });

  return isValid;
}

/**
 * Validate individual field
 */
function validateField(input, rule) {
  const value = input.value.trim();

  switch (rule) {
    case "required":
      return value.length > 0;
    case "email":
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    case "min:8":
      return value.length >= 8;
    case "phone":
      return /^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/.test(value);
    default:
      return true;
  }
}

/**
 * Get error message for validation rule
 */
function getErrorMessage(rule) {
  const messages = {
    required: "Trường này là bắt buộc",
    email: "Email không hợp lệ",
    "min:8": "Phải có ít nhất 8 ký tự",
    phone: "Số điện thoại không hợp lệ",
  };

  return messages[rule] || "Dữ liệu không hợp lệ";
}

/**
 * Show field error
 */
function showFieldError(input, message) {
  // Remove existing error
  const existingError = input.parentNode.querySelector(".field-error");
  if (existingError) {
    existingError.remove();
  }

  // Add error class
  input.classList.add("input-error");

  // Create error message
  const errorDiv = document.createElement("div");
  errorDiv.className = "field-error";
  errorDiv.textContent = message;

  input.parentNode.appendChild(errorDiv);

  // Remove error after 3 seconds
  setTimeout(() => {
    input.classList.remove("input-error");
    errorDiv.remove();
  }, 3000);
}

/**
 * Utility functions
 */

// Show loading spinner
function showLoading() {
  const spinner = document.createElement("div");
  spinner.className = "loading-spinner";
  spinner.innerHTML = '<div class="spinner"></div>';
  document.body.appendChild(spinner);
}

// Hide loading spinner
function hideLoading() {
  const spinner = document.querySelector(".loading-spinner");
  if (spinner) {
    spinner.remove();
  }
}

// Show notification
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button onclick="this.parentNode.remove()" class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;

  document.body.appendChild(notification);

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 5000);
}

// Get notification icon
function getNotificationIcon(type) {
  const icons = {
    success: "check-circle",
    error: "exclamation-triangle",
    warning: "exclamation-circle",
    info: "info-circle",
  };

  return icons[type] || "info-circle";
}

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function
function throttle(func, limit) {
  let inThrottle;
  return function () {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Export functions for global use
window.App = {
  showLoading,
  hideLoading,
  showNotification,
  debounce,
  throttle,
};
