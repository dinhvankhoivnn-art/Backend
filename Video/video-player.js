/**
 * Video Player OOP Class
 * Trình phát video hiện đại với thiết kế hướng đối tượng
 */

class Videos {
    constructor(config) {
        // Cấu hình mặc định
        this.config = {
            autoplay: false,
            controls: false,
            width: 800,
            height: 450,
            ...config
        };

        this.container = config.container;
        this.isPlaying = false;
        this.animationId = null;
        this.skipTime = 20; // seconds for tab skip

        this.init();
    }

    init() {
        this.createVideoElement();
        this.createControls();
        this.createTimeDisplay();
        this.bindEvents();
        this.setupStyles();
    }

    createVideoElement() {
        this.video = document.createElement('video');
        this.video.src = this.config.src;
        this.video.width = this.config.width;
        this.video.height = this.config.height;
        this.video.style.cssText = `
            width: 100%;
            height: auto;
            background-color: #000000;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        `;

        // Thêm video vào container
        this.container.appendChild(this.video);
    }

    createControls() {
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'video-controls';
        controlsContainer.style.cssText = `
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 15px;
            margin-top: 20px;
            padding: 15px;
            background: linear-gradient(135deg, #1a1a1a, #2d2d2d);
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        `;

        // Tạo các nút điều khiển
        this.controls = {
            prev10min: this.createButton('⏪ -10min', () => this.skip(-600)),
            prev30sec: this.createButton('⏮️ -30s', () => this.skip(-30)),
            play: this.createButton('▶️ Play', () => this.play()),
            pause: this.createButton('⏸️ Pause', () => this.pause()),
            next30sec: this.createButton('⏭️ +30s', () => this.skip(30)),
            next10min: this.createButton('⏩ +10min', () => this.skip(600))
        };

        // Thêm các nút vào container
        Object.values(this.controls).forEach(button => {
            controlsContainer.appendChild(button);
        });

        this.container.appendChild(controlsContainer);
    }

    createButton(text, onClick) {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.cssText = `
            padding: 12px 20px;
            border: none;
            border-radius: 8px;
            background: linear-gradient(135deg, #4a90e2, #357abd);
            color: white;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 2px 8px rgba(74, 144, 226, 0.3);
        `;

        // Hiệu ứng hover
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-2px)';
            button.style.boxShadow = '0 4px 12px rgba(74, 144, 226, 0.4)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = '0 2px 8px rgba(74, 144, 226, 0.3)';
        });

        button.addEventListener('click', onClick);
        return button;
    }

    createTimeDisplay() {
        const timeContainer = document.createElement('div');
        timeContainer.className = 'time-display';
        timeContainer.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 15px;
            padding: 10px 20px;
            background: linear-gradient(135deg, #1a1a1a, #2d2d2d);
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 16px;
            color: #ffffff;
        `;

        this.timeDisplay = {
            current: document.createElement('span'),
            total: document.createElement('span'),
            progress: document.createElement('span'),
            progressBar: document.createElement('div')
        };

        // Container cho progress bar
        const progressContainer = document.createElement('div');
        progressContainer.style.cssText = `
            flex: 1;
            margin: 0 20px;
            height: 8px;
            background: #333;
            border-radius: 4px;
            overflow: hidden;
            cursor: pointer;
        `;

        this.timeDisplay.progressBar.style.cssText = `
            height: 100%;
            background: linear-gradient(90deg, #4a90e2, #357abd);
            width: 0%;
            transition: width 0.1s ease;
            border-radius: 4px;
        `;

        progressContainer.appendChild(this.timeDisplay.progressBar);
        progressContainer.addEventListener('click', (e) => this.seekToPosition(e));

        // Thông tin thời gian
        const timeInfo = document.createElement('div');
        timeInfo.style.cssText = 'display: flex; align-items: center; gap: 20px;';

        timeInfo.appendChild(this.timeDisplay.current);
        timeInfo.appendChild(progressContainer);
        timeInfo.appendChild(this.timeDisplay.total);

        timeContainer.appendChild(timeInfo);
        this.container.appendChild(timeContainer);

        this.progressBar = this.timeDisplay.progressBar;
    }

    setupStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .video-player-container {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                max-width: ${this.config.width}px;
                margin: 0 auto;
                background: linear-gradient(135deg, #0f0f0f, #1a1a1a);
                padding: 30px;
                border-radius: 20px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            }

            .video-controls button:active {
                transform: translateY(0) scale(0.98);
            }

            .time-display {
                animation: slideIn 0.5s ease-out;
            }

            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .video-controls {
                animation: fadeInUp 0.6s ease-out 0.2s both;
            }

            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    }

    bindEvents() {
        this.video.addEventListener('loadedmetadata', () => {
            this.updateTimeDisplay();
            this.updateTotalTime();
        });

        this.video.addEventListener('timeupdate', () => {
            this.updateTimeDisplay();
            this.updateProgressBar();
        });

        this.video.addEventListener('play', () => {
            this.isPlaying = true;
            this.animatePlayButton();
        });

        this.video.addEventListener('pause', () => {
            this.isPlaying = false;
            this.animatePauseButton();
        });

        // Keyboard events cho tab navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                if (e.shiftKey) {
                    this.skip(-this.skipTime); // Shift + Tab: lùi 20s
                } else {
                    this.skip(this.skipTime); // Tab: tới 20s
                }
            }
        });
    }

    animatePlayButton() {
        this.controls.play.style.animation = 'pulse 1s ease-in-out';
    }

    animatePauseButton() {
        this.controls.pause.style.animation = 'pulse 1s ease-in-out';
    }

    updateTimeDisplay() {
        const current = this.formatTime(this.video.currentTime);
        this.timeDisplay.current.textContent = current;
    }

    updateTotalTime() {
        const total = this.formatTime(this.video.duration);
        this.timeDisplay.total.textContent = total;
    }

    updateProgressBar() {
        const progress = (this.video.currentTime / this.video.duration) * 100;
        this.progressBar.style.width = `${progress}%`;
    }

    seekToPosition(e) {
        const rect = e.target.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        const percentage = clickX / width;
        const newTime = percentage * this.video.duration;
        this.video.currentTime = newTime;
    }

    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    // Các phương thức public
    play() {
        this.video.play();
    }

    pause() {
        this.video.pause();
    }

    skip(seconds) {
        const newTime = Math.max(0, Math.min(this.video.duration, this.video.currentTime + seconds));
        this.video.currentTime = newTime;

        // Hiển thị animation khi skip
        this.showSkipAnimation(seconds > 0 ? 'forward' : 'backward');
    }

    showSkipAnimation(direction) {
        const animation = document.createElement('div');
        animation.textContent = direction === 'forward' ? '⏩' : '⏪';
        animation.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 60px;
            color: rgba(255, 255, 255, 0.8);
            pointer-events: none;
            animation: skipAnimation 0.8s ease-out;
            z-index: 1000;
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes skipAnimation {
                0% {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.5);
                }
                50% {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1.2);
                }
                100% {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.8);
                }
            }
        `;
        document.head.appendChild(style);

        this.container.appendChild(animation);

        setTimeout(() => {
            this.container.removeChild(animation);
            document.head.removeChild(style);
        }, 800);
    }

    getCurrentTime() {
        return this.video.currentTime;
    }

    getDuration() {
        return this.video.duration;
    }

    setVolume(volume) {
        this.video.volume = Math.max(0, Math.min(1, volume));
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        // Xóa tất cả elements đã tạo
        this.container.innerHTML = '';

        // Xóa styles
        const styles = document.head.querySelectorAll('style');
        styles.forEach(style => {
            if (style.textContent && style.textContent.includes('video-player-container')) {
                document.head.removeChild(style);
            }
        });
    }
}

// Export class để sử dụng
window.Videos = Videos;