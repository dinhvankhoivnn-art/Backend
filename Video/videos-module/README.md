# Videos Player

[![npm version](https://badge.fury.io/js/videos-player.svg)](https://badge.fury.io/js/videos-player)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

A powerful, customizable video player built with TypeScript and OOP design. Features smooth animations, keyboard shortcuts, and a beautiful dark theme.

## ✨ Features

- 🎥 **OOP Design**: Clean, maintainable object-oriented architecture
- 🎨 **Beautiful UI**: Dark theme with gradient backgrounds and smooth animations
- ⌨️ **Keyboard Shortcuts**: Tab to skip forward 20s, Shift+Tab to rewind 20s
- ⏯️ **Full Controls**: Play, pause, skip backward/forward (30s, 10min)
- 📊 **Progress Display**: Real-time progress bar with click-to-seek
- ⏱️ **Time Display**: Current time, total duration, and progress indicator
- 🎭 **Smooth Animations**: CSS animations for all interactions
- 📱 **Responsive**: Works on desktop and mobile devices
- 🔧 **Customizable**: Easy to extend and customize

## 🚀 Installation

```bash
npm install videos-player
```

## 📖 Usage

### Basic Usage

```typescript
import Videos from 'videos-player';

// Create a container element
const container = document.getElementById('video-container');

// Initialize the video player
const videoPlayer = new Videos({
  container: container,
  src: 'path/to/your/video.mp4',
  width: 800,
  height: 450,
  autoplay: false
});

// Control the video
videoPlayer.play();
videoPlayer.pause();
```

### HTML Setup

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Videos Player Demo</title>
</head>
<body>
    <div id="video-container"></div>

    <script type="module">
        import Videos from './node_modules/videos-player/dist/index.js';

        const container = document.getElementById('video-container');
        const videoPlayer = new Videos({
            container: container,
            src: 'sample-video.mp4',
            width: 800,
            height: 450
        });
    </script>
</body>
</html>
```

### Advanced Usage

```typescript
import Videos from 'videos-player';

const videoPlayer = new Videos({
  container: document.getElementById('video-container'),
  src: 'video.mp4',
  width: 900,
  height: 500,
  autoplay: true
});

// Custom methods
console.log('Current time:', videoPlayer.getCurrentTime());
console.log('Duration:', videoPlayer.getDuration());

// Set volume (0-1)
videoPlayer.setVolume(0.7);

// Skip forward 2 minutes
videoPlayer.skip(120);

// Clean up when done
videoPlayer.destroy();
```

## 🎮 Controls

### Mouse Controls
- **Play/Pause**: Click play/pause buttons
- **Skip**: Use -10min, -30s, +30s, +10min buttons
- **Seek**: Click on progress bar to jump to specific time

### Keyboard Shortcuts
- **Tab**: Skip forward 20 seconds
- **Shift + Tab**: Skip backward 20 seconds

## 🎨 Styling

The player comes with a beautiful dark theme by default, but you can customize it by overriding the CSS classes:

```css
.video-player-container {
    /* Your custom styles */
}

.video-controls button {
    /* Customize buttons */
}

.time-display {
    /* Customize time display */
}
```

## 🔧 API Reference

### Constructor Options

```typescript
interface VideoConfig {
  container: HTMLElement;    // Required: Container element
  src: string;              // Required: Video source URL
  autoplay?: boolean;       // Optional: Autoplay video (default: false)
  controls?: boolean;       // Optional: Show default controls (default: false)
  width?: number;           // Optional: Video width (default: 800)
  height?: number;          // Optional: Video height (default: 450)
}
```

### Methods

| Method | Description | Parameters |
|--------|-------------|------------|
| `play()` | Start video playback | None |
| `pause()` | Pause video playback | None |
| `skip(seconds)` | Skip forward/backward | `seconds: number` (positive = forward, negative = backward) |
| `getCurrentTime()` | Get current playback time | None |
| `getDuration()` | Get total video duration | None |
| `setVolume(volume)` | Set audio volume | `volume: number` (0-1) |
| `destroy()` | Clean up and remove player | None |

## 🏗️ Architecture

The player follows OOP principles with a clean, modular design:

```
Videos
├── Video Element Management
├── Controls Creation & Event Binding
├── Time Display & Progress Tracking
├── Animation System
├── Keyboard Shortcuts
└── Styling & Theme Management
```

## 🧪 Development

```bash
# Clone the repository
git clone https://github.com/yourusername/videos-player.git
cd videos-player

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm run test

# Lint code
npm run lint
```

## 📝 License

MIT © [Your Name](https://github.com/yourusername)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📋 Changelog

### v1.0.0
- Initial release
- OOP architecture
- Full video controls
- Keyboard shortcuts
- Smooth animations
- TypeScript support

## 🐛 Issues

If you find a bug or want to request a feature, please create an [issue](https://github.com/yourusername/videos-player/issues) on GitHub.

## 💡 Support

For questions and support, please [open an issue](https://github.com/yourusername/videos-player/issues) on GitHub.

---

Made with ❤️ using TypeScript and modern web technologies.