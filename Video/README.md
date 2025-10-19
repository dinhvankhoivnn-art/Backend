# 🎬 Video Player OOP

Trình phát video hiện đại với thiết kế hoàn toàn hướng đối tượng (OOP) được xây dựng bằng JavaScript thuần túy.

## ✨ Tính năng nổi bật

- ✅ **Thiết kế OOP hoàn chỉnh** - Class-based architecture với encapsulation và methods
- ✅ **Controls đẹp mắt** - Buttons với hiệu ứng hover và animation mượt mà
- ✅ **Tua nhanh linh hoạt** - Hỗ trợ ±30 giây và ±10 phút
- ✅ **Progress bar interactive** - Click để seek đến vị trí bất kỳ
- ✅ **Hiển thị thời gian** - Thời gian hiện tại và tổng thời gian
- ✅ **Phím tắt tiện lợi** - Tab (tua tới), Shift+Tab (tua lùi)
- ✅ **Điều khiển âm lượng** - Phương thức setVolume()
- ✅ **Animation đẹp mắt** - Hiệu ứng khi play/pause và skip
- ✅ **Responsive design** - Tương thích mọi thiết bị
- ✅ **Dễ sử dụng** - API đơn giản và trực quan

## 🚀 Cách sử dụng

### 1. Khởi tạo Video Player

```javascript
const videoPlayer = new Videos({
    container: document.getElementById('videos'),
    src: 'path/to/your/video.mp4',
    width: 900,
    height: 500,
    autoplay: false,
    controls: false
});
```

### 2. Điều khiển cơ bản

```javascript
// Phát video
videoPlayer.play();

// Dừng video
videoPlayer.pause();

// Tua tới/lùi (giây)
videoPlayer.skip(30);   // Tua tới 30 giây
videoPlayer.skip(-30);  // Tua lùi 30 giây

// Điều chỉnh âm lượng (0.0 - 1.0)
videoPlayer.setVolume(0.5);  // 50% âm lượng

// Lấy thông tin video
const currentTime = videoPlayer.getCurrentTime();
const duration = videoPlayer.getDuration();
```

### 3. Phím tắt

- **Tab** - Tua tới 20 giây
- **Shift + Tab** - Tua lùi 20 giây

## 📁 Cấu trúc Project

```
/
├── index.html          # Trang demo chính
├── video-player.js     # Class Videos OOP
├── styles.css          # Styling và responsive design
└── README.md           # Tài liệu hướng dẫn
```

## 🎨 Customization

### Thay đổi giao diện

Trong file `styles.css`, bạn có thể tùy chỉnh:

- **Màu sắc**: Sửa gradient colors trong `.video-controls button`
- **Kích thước**: Điều chỉnh `width` và `height` trong constructor
- **Animation**: Tùy chỉnh keyframes trong CSS

### Thêm tính năng mới

Class `Videos` được thiết kế để dễ mở rộng:

```javascript
// Thêm phương thức mới
Videos.prototype.toggleMute = function() {
    this.video.muted = !this.video.muted;
};

// Sử dụng
videoPlayer.toggleMute();
```

## 🔧 Cấu hình

### VideoConfig Interface

```javascript
interface VideoConfig {
    container: HTMLElement;    // Container element (bắt buộc)
    src: string;              // Đường dẫn video (bắt buộc)
    autoplay?: boolean;       // Tự động phát (mặc định: false)
    controls?: boolean;       // Hiển thị controls mặc định (mặc định: false)
    width?: number;          // Chiều rộng (mặc định: 800)
    height?: number;         // Chiều cao (mặc định: 450)
}
```

## 🌟 Demo

1. Mở file `index.html` trong trình duyệt
2. Hoặc chạy local server:
   ```bash
   # Python 3
   python -m http.server 8000

   # Node.js
   npx serve .
   ```

## 📱 Browser Support

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+

## 🔒 Security

- Không có external dependencies
- Pure JavaScript - an toàn và nhanh chóng
- Không thu thập dữ liệu người dùng

## 📄 License

MIT License - Tự do sử dụng cho mục đích cá nhân và thương mại.

## 🤝 Contributing

Mọi đóng góp đều được chào đón! Vui lòng tạo issue hoặc pull request.

---

**Tạo bởi:** Code Supernova với thiết kế OOP hoàn chỉnh 🎯