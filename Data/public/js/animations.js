/**
 * Animation utilities and effects
 * Handles various UI animations and transitions
 */

// Initialize animations when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  initializeAnimations();
});

/**
 * Initialize all animations
 */
function initializeAnimations() {
  setupIntersectionObserver();
  setupHoverEffects();
  setupScrollEffects();
  setupLoadingStates();
}

/**
 * Setup Intersection Observer for scroll-triggered animations
 */
function setupIntersectionObserver() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("animate-in");
      }
    });
  }, observerOptions);

  // Observe elements with animation classes
  const animatedElements = document.querySelectorAll(".animate-on-scroll");
  animatedElements.forEach((element) => {
    observer.observe(element);
  });
}

/**
 * Setup hover effects
 */
function setupHoverEffects() {
  // Card hover effects
  const cards = document.querySelectorAll(
    ".stat-card, .user-row, .action-buttons button"
  );
  cards.forEach((card) => {
    card.addEventListener("mouseenter", function () {
      this.style.transform = "translateY(-5px)";
      this.style.boxShadow = "0 10px 25px rgba(0, 0, 0, 0.15)";
    });

    card.addEventListener("mouseleave", function () {
      this.style.transform = "translateY(0)";
      this.style.boxShadow = "";
    });
  });

  // Button hover effects
  const buttons = document.querySelectorAll(".btn");
  buttons.forEach((button) => {
    button.addEventListener("mouseenter", function () {
      this.style.transform = "translateY(-2px)";
    });

    button.addEventListener("mouseleave", function () {
      this.style.transform = "translateY(0)";
    });
  });
}

/**
 * Setup scroll effects
 */
function setupScrollEffects() {
  let lastScrollTop = 0;
  const navbar = document.querySelector(".navbar");

  window.addEventListener("scroll", function () {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // Navbar hide/show on scroll
    if (navbar) {
      if (scrollTop > lastScrollTop && scrollTop > 100) {
        navbar.style.transform = "translateY(-100%)";
      } else {
        navbar.style.transform = "translateY(0)";
      }
    }

    // Parallax effects for background elements
    const parallaxElements = document.querySelectorAll(".parallax");
    parallaxElements.forEach((element) => {
      const speed = element.dataset.speed || 0.5;
      element.style.transform = `translateY(${scrollTop * speed}px)`;
    });

    lastScrollTop = scrollTop;
  });
}

/**
 * Setup loading states
 */
function setupLoadingStates() {
  // Add loading class to body initially
  document.body.classList.add("loading");

  // Remove loading class when page is fully loaded
  window.addEventListener("load", function () {
    setTimeout(() => {
      document.body.classList.remove("loading");
      document.body.classList.add("loaded");
    }, 300);
  });
}

/**
 * Animate counter numbers
 */
function animateCounter(element, target, duration = 2000) {
  const start = parseInt(element.textContent) || 0;
  const increment = target / (duration / 16);
  let current = start;

  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      element.textContent = target;
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(current);
    }
  }, 16);
}

/**
 * Animate progress bars
 */
function animateProgressBar(selector, percentage) {
  const progressBar = document.querySelector(selector);
  if (!progressBar) return;

  progressBar.style.width = "0%";
  setTimeout(() => {
    progressBar.style.transition = "width 1s ease-in-out";
    progressBar.style.width = percentage + "%";
  }, 100);
}

/**
 * Create ripple effect for buttons
 */
function createRippleEffect(button) {
  button.addEventListener("click", function (e) {
    const ripple = document.createElement("span");
    ripple.className = "ripple-effect";

    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = size + "px";
    ripple.style.left = x + "px";
    ripple.style.top = y + "px";

    const existingRipple = this.querySelector(".ripple-effect");
    if (existingRipple) {
      existingRipple.remove();
    }

    this.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);
  });
}

/**
 * Setup ripple effects for buttons
 */
function setupRippleEffects() {
  const buttons = document.querySelectorAll(".btn");
  buttons.forEach((button) => {
    createRippleEffect(button);
  });
}

/**
 * Create confetti effect
 */
function createConfetti() {
  const confettiContainer = document.createElement("div");
  confettiContainer.className = "confetti-container";
  document.body.appendChild(confettiContainer);

  for (let i = 0; i < 100; i++) {
    const confetti = document.createElement("div");
    confetti.className = "confetti";
    confetti.style.left = Math.random() * 100 + "vw";
    confetti.style.animationDelay = Math.random() * 3 + "s";
    confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;

    confettiContainer.appendChild(confetti);
  }

  setTimeout(() => {
    confettiContainer.remove();
  }, 5000);
}

/**
 * Shake animation for error states
 */
function shakeElement(element) {
  element.classList.add("animate-shake");
  setTimeout(() => {
    element.classList.remove("animate-shake");
  }, 500);
}

/**
 * Pulse animation for loading states
 */
function pulseElement(element) {
  element.classList.add("animate-pulse");
  setTimeout(() => {
    element.classList.remove("animate-pulse");
  }, 1000);
}

/**
 * Typewriter effect
 */
function typewriterEffect(element, text, speed = 50) {
  let i = 0;
  element.textContent = "";

  function typeWriter() {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      setTimeout(typeWriter, speed);
    }
  }

  typeWriter();
}

/**
 * Fade in elements sequentially
 */
function fadeInSequence(selector, delay = 200) {
  const elements = document.querySelectorAll(selector);

  elements.forEach((element, index) => {
    setTimeout(() => {
      element.classList.add("animate-fade-in");
    }, index * delay);
  });
}

/**
 * Create floating animation for background elements
 */
function createFloatingElements(container, count = 5) {
  for (let i = 0; i < count; i++) {
    const element = document.createElement("div");
    element.className = "floating-element";
    element.style.left = Math.random() * 100 + "%";
    element.style.animationDelay = Math.random() * 3 + "s";
    element.style.animationDuration = Math.random() * 3 + 3 + "s";

    container.appendChild(element);
  }
}

/**
 * Smooth scroll to element
 */
function smoothScrollTo(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}

/**
 * Animate modal appearance
 */
function animateModal(modal) {
  modal.style.display = "flex";
  modal.style.opacity = "0";

  setTimeout(() => {
    modal.style.transition = "opacity 0.3s ease";
    modal.style.opacity = "1";
  }, 10);

  // Animate modal content
  const modalContent = modal.querySelector(".modal-content");
  if (modalContent) {
    modalContent.style.transform = "scale(0.7)";
    setTimeout(() => {
      modalContent.style.transition = "transform 0.3s ease";
      modalContent.style.transform = "scale(1)";
    }, 10);
  }
}

/**
 * Animate notification
 */
function animateNotification(notification, type = "success") {
  notification.classList.add(`notification-${type}`, "notification-slide-in");

  setTimeout(() => {
    notification.classList.add("notification-slide-out");
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 500);
  }, 3000);
}

/**
 * Create skeleton loading effect
 */
function createSkeletonLoader(container, rows = 3) {
  container.innerHTML = "";

  for (let i = 0; i < rows; i++) {
    const skeleton = document.createElement("div");
    skeleton.className = "skeleton-loader";

    skeleton.innerHTML = `
            <div class="skeleton-avatar"></div>
            <div class="skeleton-content">
                <div class="skeleton-line"></div>
                <div class="skeleton-line short"></div>
                <div class="skeleton-line"></div>
            </div>
        `;

    container.appendChild(skeleton);
  }
}

/**
 * Remove skeleton loading effect
 */
function removeSkeletonLoader(container) {
  const skeletons = container.querySelectorAll(".skeleton-loader");
  skeletons.forEach((skeleton) => skeleton.remove());
}

/**
 * Initialize page transitions
 */
function setupPageTransitions() {
  const links = document.querySelectorAll('a[href^="/"]');

  links.forEach((link) => {
    link.addEventListener("click", function (e) {
      // Don't interfere with external links or special links
      if (
        this.hostname !== window.location.hostname ||
        this.hasAttribute("download") ||
        this.getAttribute("target") === "_blank"
      ) {
        return;
      }

      e.preventDefault();

      // Add exit animation
      document.body.classList.add("page-exiting");

      setTimeout(() => {
        window.location.href = this.href;
      }, 300);
    });
  });

  // Add enter animation when page loads
  document.body.classList.add("page-entering");
  setTimeout(() => {
    document.body.classList.remove("page-entering");
    document.body.classList.add("page-entered");
  }, 300);
}

/**
 * Performance monitoring animation
 */
function setupPerformanceMonitoring() {
  if ("performance" in window) {
    window.addEventListener("load", function () {
      setTimeout(() => {
        const perfData = performance.getEntriesByType("navigation")[0];

        console.log(
          `Page load time: ${perfData.loadEventEnd - perfData.fetchStart}ms`
        );

        // Animate loading performance indicator if exists
        const perfIndicator = document.getElementById("performance-indicator");
        if (perfIndicator) {
          const loadTime = perfData.loadEventEnd - perfData.fetchStart;
          const percentage = Math.min((loadTime / 3000) * 100, 100); // Max 3s = 100%

          animateProgressBar(
            "#performance-indicator .progress-bar",
            percentage
          );
        }
      }, 0);
    });
  }
}

// Initialize additional features
document.addEventListener("DOMContentLoaded", function () {
  setupRippleEffects();
  setupPageTransitions();
  setupPerformanceMonitoring();
});

// Export animation functions globally
window.Animations = {
  animateCounter,
  animateProgressBar,
  createConfetti,
  shakeElement,
  pulseElement,
  typewriterEffect,
  fadeInSequence,
  smoothScrollTo,
  animateModal,
  animateNotification,
  createSkeletonLoader,
  removeSkeletonLoader,
};
