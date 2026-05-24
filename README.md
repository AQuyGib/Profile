# Cyber-Oasis Portfolio Workspace

Trang Portfolio giới thiệu cá nhân kết hợp Game RPG 2D tương tác trực quan và Trợ lý ảo AI thông minh đại diện cho **Nguyễn Anh Quý**.

Dự án này đã được tối ưu hóa và chuyển đổi hoàn toàn **100% từ React/TypeScript sang HTML, CSS, JS thuần (Vanilla JS) và PHP**. Dự án hiện tại chạy cực kỳ nhanh, không cần máy chủ Node.js hay bất cứ tiến trình build nào. Bạn chỉ cần ném toàn bộ mã nguồn vào máy chủ PHP/Apache là có thể chạy ngay lập tức.

---

## 🌟 Tính Năng Chính
*   **Game RPG 2D Canvas**: Điều khiển nhân vật di chuyển khám phá các khu vực thông tin bằng phím (WASD / phím mũi tên), D-pad ảo hoặc click chuột trên màn hình.
*   **Tải Thông Tin Động (Dynamic Bento Grid)**: Khi nhân vật đi vào khu vực, bảng thông tin hồ sơ tương ứng (Home, Học vấn, Kỹ năng, Dự án, Triết lý, Liên hệ) sẽ tự động nạp mà không cần load lại trang.
*   **AI Chatbot Google Gemini**: Trợ lý ảo tích hợp trực tiếp, hỗ trợ trả lời các thông tin liên quan đến Nguyễn Anh Quý bằng tiếng Việt & tiếng Anh.
*   **Hỗ trợ Song Ngữ**: Nút chuyển đổi nhanh ngôn ngữ tiếng Việt (VI) & tiếng Anh (EN).
*   **Hiệu Ứng Âm Thanh Synth**: Âm thanh phát ra theo phong cách retro được tổng hợp trực tiếp bằng mã nguồn (Web Audio API) khi di chuyển, click, hoặc đổi khu vực.
*   **Thiết Kế Premium**: Giao diện mang đậm phong cách Cyberpunk, thủy tinh mờ (glassmorphism), neon lấp lánh và responsive mượt mà trên cả điện thoại và máy tính.

---

## 🛠️ Cấu Trúc Dự Án
```text
├── api/
│   └── chat.php        # Proxy PHP xử lý kết nối Google Gemini API an toàn
├── css/
│   └── style.css       # Các tùy biến CSS, hiệu ứng neon và font chữ
├── js/
│   └── app.js          # Logic xử lý Canvas Game, Chatbot, Audio và điều phối DOM
├── .env                # File cấu hình khóa GEMINI_API_KEY bảo mật
├── .gitignore          # Cấu hình bỏ qua các file nhạy cảm khi đẩy lên Git
├── data.json           # Cơ sở dữ liệu chứa toàn bộ thông tin hiển thị của Portfolio
└── index.html          # Khung cấu trúc HTML chính sử dụng Tailwind CSS CDN
```

---

## 🚀 Hướng Dẫn Chạy Cục Bộ (Local)

### Yêu Cầu Hệ Thống:
*   Máy tính đã cài đặt phần mềm tạo máy chủ local PHP/Apache như **Laragon**, **XAMPP**, hoặc **WAMP**.

### Các Bước Thực Hiện:
1.  **Sao chép thư mục dự án**: 
    Di chuyển toàn bộ thư mục `Profile` vào thư mục chạy web của Apache (ví dụ `C:\laragon\www\` hoặc `C:\xampp\htdocs\`).
2.  **Cấu hình API Key**:
    *   Mở file `.env` ở thư mục gốc của dự án.
    *   Điền API Key Google Gemini của bạn vào:
        ```env
        GEMINI_API_KEY="MÃ_API_KEY_CỦA_BẠN"
        ```
3.  **Khởi động Máy chủ**:
    *   Bật Laragon hoặc XAMPP, khởi động Apache.
4.  **Truy cập vào trình duyệt**:
    *   Mở trình duyệt và truy cập đường dẫn: `http://localhost/FE2CV/Profile/` (hoặc URL tương ứng của bạn).
    *   Hệ thống sẽ chạy màn hình Loading, nhấn **ACTIVATE CYBER-OASIS WORKSPACE** để bắt đầu trải nghiệm!

---

## 🌐 Hướng Dẫn Triển Khai Lên Hosting (Production)

Vì dự án đã được chuyển đổi sang PHP thuần túy, bạn **không cần cài Node.js trên Hosting**.
1.  Nén toàn bộ các file trong thư mục gốc (`index.html`, `data.json`, `api/`, `css/`, `js/`, `.env`).
2.  Tải lên và giải nén trong thư mục public (thường là `public_html`) trên hosting của bạn.
3.  Hãy chắc chắn file `.env` đã được điền chính xác API Key và đã được cấu hình ẩn trong cấu hình bảo mật của hosting.
