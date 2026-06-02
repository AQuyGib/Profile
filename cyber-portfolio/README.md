# Cyber Portfolio Project

## Giới thiệu
Dự án Cyber Portfolio là một ứng dụng 3D tương tác, cho phép người dùng khám phá các bối cảnh khác nhau như Desk Setup, Cinema Studio, Timeline Workflow và Portal Zone. Ứng dụng sử dụng các hiệu ứng hình ảnh tiên tiến và các yếu tố điện ảnh để tạo ra trải nghiệm hấp dẫn và trực quan.

## Cấu trúc Dự án
Dưới đây là cấu trúc thư mục của dự án:

```
cyber-portfolio
├── src
│   ├── scenes
│   │   ├── desk-setup.js
│   │   ├── cinema-studio.js
│   │   ├── timeline-workflow.js
│   │   ├── portal-zone.js
│   │   └── scene-manager.js
│   ├── cameras
│   │   ├── cinematic-camera.js
│   │   └── camera-transitions.js
│   ├── effects
│   │   ├── depth-of-field.js
│   │   ├── post-processing.js
│   │   └── motion-blur.js
│   ├── timeline
│   │   ├── timeline-controller.js
│   │   ├── timeline-ui.js
│   │   └── timeline-events.js
│   ├── models
│   │   ├── loader.js
│   │   └── asset-manager.js
│   └── utils
│       ├── helpers.js
│       └── performance.js
├── public
│   ├── models
│   │   ├── desk-setup
│   │   ├── cinema
│   │   ├── timeline
│   │   └── portal
│   ├── textures
│   ├── audio
│   └── shaders
├── package.json
├── webpack.config.js
└── README.md
```

## Hướng dẫn Cài đặt
1. **Clone Repository**
   ```bash
   git clone https://github.com/yourusername/cyber-portfolio.git
   cd cyber-portfolio
   ```

2. **Cài đặt Dependencies**
   ```bash
   npm install
   ```

3. **Chạy Dự án**
   ```bash
   npm start
   ```

## Tính năng
- **Desk Setup**: Mô phỏng môi trường làm việc với các mô hình 3D và ánh sáng tương tác.
- **Cinema Studio**: Tích hợp các yếu tố điện ảnh để nâng cao trải nghiệm hình ảnh.
- **Timeline Workflow**: Cung cấp các yếu tố tương tác giúp người dùng dễ dàng theo dõi quy trình làm việc.
- **Portal Zone**: Cổng kết nối đến các môi trường khác trong ứng dụng.

## Công nghệ Sử dụng
- Three.js: Thư viện JavaScript cho đồ họa 3D.
- Webpack: Công cụ đóng gói module cho ứng dụng JavaScript.
- NPM: Quản lý gói cho JavaScript.

## Liên hệ
Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với tôi qua email: your.email@example.com.