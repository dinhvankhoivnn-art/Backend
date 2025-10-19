// Animation Utilities
class AnimationManager {
  constructor() {
    this.observers = [];
    this.init();
  }

  init() {
    this.setupIntersectionObserver();
    this.setupResizeObserver();
  }

  setupIntersectionObserver() {
    const options = {
      threshold: 0.1,
      rootMargin: "50px",
    };

    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.animateOnScroll(entry.target);
        }
      });
    }, options);

    // Observe elements with animation classes
    document.querySelectorAll('[class*="animate-"]').forEach((el) => {
      this.intersectionObserver.observe(el);
    });
  }

  setupResizeObserver() {
    this.resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        this.handleResize(entry.target, entry.contentRect);
      });
    });

    // Observe main containers
    const containers = document.querySelectorAll(
      ".chat-container, .auth-container"
    );
    containers.forEach((container) => {
      this.resizeObserver.observe(container);
    });
  }

  animateOnScroll(element) {
    const classes = element.className.split(" ");
    const animationClass = classes.find((cls) => cls.startsWith("animate-"));

    if (animationClass) {
      element.style.opacity = "0";
      element.style.animation = "none";

      setTimeout(() => {
        element.style.opacity = "1";
        element.style.animation = "";
      }, 100);
    }
  }

  handleResize(element, rect) {
    // Adjust layout for different screen sizes
    if (rect.width < 768) {
      element.classList.add("mobile-layout");
    } else {
      element.classList.remove("mobile-layout");
    }
  }

  // Utility methods for animations
  static fadeIn(element, duration = 300) {
    element.style.opacity = "0";
    element.style.display = "block";

    element.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: duration,
      easing: "ease-out",
      fill: "forwards",
    });
  }

  static fadeOut(element, duration = 300) {
    const animation = element.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: duration,
      easing: "ease-out",
      fill: "forwards",
    });

    animation.addEventListener("finish", () => {
      element.style.display = "none";
    });
  }

  static slideIn(element, direction = "up", duration = 300) {
    const directions = {
      up: { from: "translateY(20px)", to: "translateY(0)" },
      down: { from: "translateY(-20px)", to: "translateY(0)" },
      left: { from: "translateX(20px)", to: "translateX(0)" },
      right: { from: "translateX(-20px)", to: "translateX(0)" },
    };

    element.style.transform = directions[direction].from;
    element.style.opacity = "0";

    element.animate(
      [
        { transform: directions[direction].from, opacity: 0 },
        { transform: directions[direction].to, opacity: 1 },
      ],
      {
        duration: duration,
        easing: "ease-out",
        fill: "forwards",
      }
    );
  }

  static scaleIn(element, duration = 300) {
    element.style.transform = "scale(0.8)";
    element.style.opacity = "0";

    element.animate(
      [
        { transform: "scale(0.8)", opacity: 0 },
        { transform: "scale(1)", opacity: 1 },
      ],
      {
        duration: duration,
        easing: "ease-out",
        fill: "forwards",
      }
    );
  }

  static bounce(element, duration = 600) {
    element.animate(
      [
        { transform: "translateY(0)" },
        { transform: "translateY(-10px)" },
        { transform: "translateY(0)" },
        { transform: "translateY(-5px)" },
        { transform: "translateY(0)" },
      ],
      {
        duration: duration,
        easing: "ease-in-out",
      }
    );
  }

  static shake(element, duration = 500) {
    element.animate(
      [
        { transform: "translateX(0)" },
        { transform: "translateX(-5px)" },
        { transform: "translateX(5px)" },
        { transform: "translateX(-5px)" },
        { transform: "translateX(5px)" },
        { transform: "translateX(0)" },
      ],
      {
        duration: duration,
        easing: "ease-in-out",
      }
    );
  }

  static rippleEffect(element, event, color = "rgba(255,255,255,0.3)") {
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const ripple = document.createElement("div");
    ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: ${color};
            border-radius: 50%;
            transform: scale(0);
            pointer-events: none;
            z-index: 10;
        `;

    element.style.position = "relative";
    element.style.overflow = "hidden";
    element.appendChild(ripple);

    ripple
      .animate(
        [
          { transform: "scale(0)", opacity: 1 },
          { transform: "scale(4)", opacity: 0 },
        ],
        {
          duration: 600,
          easing: "ease-out",
        }
      )
      .addEventListener("finish", () => {
        ripple.remove();
      });
  }

  static typingEffect(element, text, speed = 50) {
    return new Promise((resolve) => {
      let i = 0;
      element.textContent = "";

      const timer = setInterval(() => {
        if (i < text.length) {
          element.textContent += text.charAt(i);
          i++;
        } else {
          clearInterval(timer);
          resolve();
        }
      }, speed);
    });
  }

  static createParticles(container, count = 20) {
    for (let i = 0; i < count; i++) {
      const particle = document.createElement("div");
      particle.className = "particle";
      particle.style.cssText = `
                left: ${Math.random() * 100}%;
                animation-delay: ${Math.random() * 6}s;
                animation-duration: ${3 + Math.random() * 3}s;
            `;
      container.appendChild(particle);

      // Remove particle after animation
      setTimeout(() => particle.remove(), 6000);
    }
  }

  static skeletonLoading(element, duration = 1500) {
    element.classList.add("skeleton");
    return new Promise((resolve) => {
      setTimeout(() => {
        element.classList.remove("skeleton");
        resolve();
      }, duration);
    });
  }

  // Page transition effects
  static pageTransition(fromElement, toElement, direction = "forward") {
    const outAnimation =
      direction === "forward" ? "slideOutLeft" : "slideOutRight";
    const inAnimation =
      direction === "forward" ? "slideInRight" : "slideInLeft";

    // Exit animation
    fromElement.style.animation = `${outAnimation} 0.3s ease-in-out forwards`;

    setTimeout(() => {
      fromElement.style.display = "none";
      toElement.style.display = "block";
      toElement.style.animation = `${inAnimation} 0.3s ease-in-out forwards`;
    }, 150);
  }

  // Notification animations
  static showNotification(message, type = "info", duration = 3000) {
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => notification.classList.add("show"), 10);

    // Auto remove
    const timeout = setTimeout(() => {
      this.hideNotification(notification);
    }, duration);

    // Click to close
    notification
      .querySelector(".notification-close")
      .addEventListener("click", () => {
        clearTimeout(timeout);
        this.hideNotification(notification);
      });
  }

  static hideNotification(notification) {
    notification.classList.remove("show");
    setTimeout(() => notification.remove(), 300);
  }

  static getNotificationIcon(type) {
    const icons = {
      success: "check-circle",
      error: "exclamation-circle",
      warning: "exclamation-triangle",
      info: "info-circle",
    };
    return icons[type] || "info-circle";
  }

  // Loading states
  static showLoading(element, text = "Đang tải...") {
    element.innerHTML = `
            <div class="loading-overlay">
                <div class="spinner"></div>
                <p>${text}</p>
            </div>
        `;
    element.classList.add("loading");
  }

  static hideLoading(element) {
    element.classList.remove("loading");
  }

  // Stagger animations for lists
  static staggerAnimation(elements, animation = "fadeIn", delay = 100) {
    elements.forEach((element, index) => {
      setTimeout(() => {
        element.classList.add(`animate-${animation}`);
      }, index * delay);
    });
  }

  // Parallax effect
  static parallaxEffect(element, speed = 0.5) {
    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      element.style.transform = `translateY(${scrolled * speed}px)`;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }

  // Magnetic effect for buttons
  static magneticEffect(button, strength = 0.3) {
    const handleMouseMove = (e) => {
      const rect = button.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = (e.clientX - centerX) * strength;
      const deltaY = (e.clientY - centerY) * strength;

      button.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    };

    const handleMouseLeave = () => {
      button.style.transform = "translate(0, 0)";
    };

    button.addEventListener("mousemove", handleMouseMove);
    button.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      button.removeEventListener("mousemove", handleMouseMove);
      button.removeEventListener("mouseleave", handleMouseLeave);
    };
  }
}

// Initialize animation manager when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.animationManager = new AnimationManager();
});

// Add CSS for additional animations
const style = document.createElement("style");
style.textContent = `
@keyframes slideOutLeft {
    to { transform: translateX(-100%); opacity: 0; }
}

@keyframes slideOutRight {
    to { transform: translateX(100%); opacity: 0; }
}

@keyframes slideInLeft {
    from { transform: translateX(-100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

@keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

.notification {
    position: fixed;
    top: 20px;
    right: -300px;
    background: var(--primary-color);
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: var(--shadow);
    z-index: 1001;
    transition: right 0.3s ease;
    max-width: 300px;
}

.notification.show {
    right: 20px;
}

.notification-success { background: var(--success-color); }
.notification-error { background: var(--danger-color); }
.notification-warning { background: var(--warning-color); }

.notification-close {
    background: none;
    border: none;
    color: white;
    font-size: 20px;
    cursor: pointer;
    margin-left: 10px;
}

.loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255,255,255,0.9);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 10;
}

.loading .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(0,123,255,0.3);
    border-top: 4px solid var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

.empty-state {
    text-align: center;
    padding: 40px 20px;
    color: var(--secondary-color);
    font-style: italic;
}

.btn-sm {
    padding: 8px 12px;
    font-size: 12px;
}
`;
document.head.appendChild(style);
