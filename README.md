# 🌌 Cyber-Oasis Portfolio: Gamified Interactive 2D/3D WebGL Portfolio

> **Hồ sơ năng lực cá nhân tương tác đột phá của Nguyễn Anh Quý**
> Một dự án Full-Stack kết hợp công nghệ **WebGL 3D (Three.js)**, **2D Canvas Game engine**, **Trí tuệ nhân tạo (Gemini AI Chatbot + RAG + Voice)**, kiến trúc **PHP (MVC / Service-Repository)** bảo mật cao, và quy trình triển khai hiện đại **Docker Multi-Container + CI/CD**.

---

## 🚀 Điểm Nhấn Dự Án (Nổi Bật Với Nhà Tuyển Dụng)

Dự án này được xây dựng không chỉ để làm một trang CV giới thiệu thông tin, mà là một **sân chơi công nghệ thực thụ** nhằm phô diễn toàn bộ năng lực tối ưu hiệu năng Frontend, xử lý backend chuyên sâu, tích hợp AI thông minh, và tư duy DevOps thực chiến.

### 1. WebGL 3D Engine (Three.js & GSAP)
*   **Môi trường Sci-Fi 3D**: Thiết lập không gian vũ trụ với đảo trung tâm, hệ thống thiên thạch xoay trôi dạt tự sinh (Procedural Space Asteroids), bụi vũ trụ bay lơ lửng và tinh thể phát sáng Neon (Glowing Cyber Crystals) rực rỡ.
*   **Hiệu ứng Hậu kỳ Cao cấp**: Tích hợp `EffectComposer` với bộ lọc phát sáng `UnrealBloomPass` mang phong cách Cyberpunk huyền ảo nhưng được tinh chỉnh cân bằng tránh cháy sáng.
*   **Tối ưu hóa Hiệu năng Vượt trội (WebGL Performance)**:
    *   **Thắt chặt tỷ lệ điểm ảnh (Pixel Ratio Capping)**: Giới hạn độ phân giải ở mức `1.35` cho màn hình Retina/High-DPI giúp giảm >50% số pixel cần vẽ mà không làm giảm trải nghiệm nhìn.
    *   **Lazy Loading hàng đợi (Asset Loading Queue)**: Chỉ nạp trước các mô hình nền tảng cấu trúc, trì hoãn tải các mô hình trang trí phụ mỗi 80ms sau khi mở màn hình, giúp tăng tốc độ tải trang ban đầu.
    *   **Eco Mode & FPS Throttling**: Khóa khung hình ở 60 FPS (hoặc 30 FPS ở Eco Mode), tự động bypass toàn bộ post-processing (UnrealBloom) để render trực tiếp bằng WebGLRenderer gốc, giúp máy cấu hình yếu hoặc điện thoại chạy mượt mà.
    *   **Tối ưu bóng đổ**: Giảm kích thước Shadow Map từ `2048` xuống `1024` và gom hẹp tầm quét ánh sáng (`OrthographicCamera` shadow frustum) vừa khít vùng di chuyển của nhân vật.
*   **Giao diện Camera Cinematic**: Tách biệt chuyển động lerp góc nhìn tĩnh và hiệu ứng sóng nhấp nhô không trọng lực (`hoverWave`), giải phóng hoàn toàn góc camera tự do của người chơi (`OrbitControls`) không bị giật hay khóa cứng khi chuyển khu vực (Zone).
*   **Mobile Navigation**: Joystick ảo glassmorphism mượt mà hỗ trợ lực kéo di chuyển đa hướng trên thiết bị cảm ứng, kết hợp tính năng Click-to-Move thông minh.

### 2. Gameplay 2D Canvas & Vector Sprites
*   **Đổi nhân vật thời gian thực**: Cho phép lựa chọn giữa 3 thực thể: **Phi Hành Gia**, **Phi Thuyền**, và **Đĩa Bay (UFO)** kèm theo hiệu ứng chuyển động nhấp nhô/xoay tròn đặc trưng vẽ bằng 2D Canvas phụ trên modal.
*   **Đồ họa vẽ thủ tục (Procedural Vector Drawing)**: Không sử dụng ảnh tĩnh, toàn bộ nhân vật và bệ Hologram tại các Zone đều được vẽ trực tiếp bằng mã nguồn Canvas API (như ngọn lửa phản lực thay đổi kích thước ngẫu nhiên, UFO chớp đèn neon màu sắc chuyển đổi liên tục, lỗ đen vũ trụ xoáy ốc).
*   **Vệt di chuyển sinh động (Player Trail)**: Vẽ vệt sáng trôi dạt thay đổi màu sắc linh hoạt tương ứng theo từng loại nhân vật được chọn (Lửa xanh lục cho Astronaut, Plasma tím cho Spaceship, và Cyan cho UFO).

### 3. Trí Tuệ Nhân Tạo (Gemini AI RAG & Voice Chat)
*   **Mô hình Gemini 3.5 Flash**: Cập nhật mô hình ngôn ngữ mới nhất để tối ưu tốc độ phản hồi và độ chính xác của chatbot.
*   **Cơ chế RAG (Retrieval-Augmented Generation) thông minh**: Chatbot tự động đọc dữ liệu `data.json` ở phía Server, lọc thông tin phân khu (Zones) phù hợp với từ khóa của người dùng trước khi gửi làm ngữ cảnh (context), giúp AI trả lời cực kỳ chuẩn xác các câu hỏi về thông tin cá nhân, dự án, kỹ năng của ứng viên mà không bị ảo giác (hallucination).
*   **Tích hợp Giọng nói (Speech-to-Text & Text-to-Speech)**:
    *   Sử dụng Web Speech API để người dùng có thể nói chuyện trực tiếp với AI qua micro.
    *   AI tự động đọc câu trả lời bằng giọng nói tự nhiên, hỗ trợ chọn lựa nhiều giọng đọc hệ thống (Nam/Nữ, Anh/Việt) qua thẻ chọn động và lưu cấu hình vào `localStorage`.
    *   Tự động phát hiện và đồng bộ hóa ngôn ngữ nghiêm ngặt (chỉ phát giọng đọc tiếng Việt khi ở giao diện tiếng Việt và có giọng phù hợp, tránh tình trạng lỗi âm do phát giọng tiếng Anh cho chữ tiếng Việt).
*   **Persistence & UX**: Lưu lịch sử trò chuyện trong `localStorage` giúp khôi phục hội thoại khi người dùng reload trang (F5).

### 4. Backend PHP vững chắc (MVC & Service-Repository Pattern)
*   **Cấu trúc thư mục chuẩn Laravel**: Backend PHP (`api/`) được module hóa rõ ràng gồm `Controllers`, `Services`, `Repositories` và `Utils`.
*   **An toàn & Bảo mật**:
    *   Xác thực 2 lớp Admin Dashboard bằng **Mã OTP gửi qua Email thật** qua thư viện PHPMailer SMTP.
    *   Lưu trữ mật khẩu mã hóa bằng thuật toán `Bcrypt`.
    *   Ngăn chặn hoàn toàn các lỗ hổng bảo mật phổ biến như **SQL Injection (SQLi)** nhờ sử dụng PDO Prepared Statements và **Cross-Site Request Forgery (CSRF)** bằng Tokens.
*   **Hệ thống Guestbook (Sổ lưu niệm)**: AJAX dynamic loading, cho phép khách gửi lời nhắn, admin duyệt/xóa tin nhắn trước khi hiển thị công khai. Form nhập liệu glassmorphic cao cấp, không bị co cụm dữ liệu, tự động chặn phím tắt di chuyển game khi người dùng đang gõ chữ.

### 5. DevOps & Môi Trường Vận Hành Hiện Đại
*   **Dockerization**: Cung cấp `Dockerfile` (Node.js v24 Alpine) và cấu hình `docker-compose.yml` kiến trúc đa container (Multi-Container Architecture).
*   **Nginx Proxy Manager**: Tích hợp reverse proxy quản lý cổng `80/443`, tự động gia hạn SSL HTTPS miễn phí Let's Encrypt.
*   **Tự động hóa CI/CD**: Cấu hình GitHub Actions (`.github/workflows/deploy.yml`) tự động hóa quy trình build và deploy trực tiếp lên VPS cá nhân qua SSH/SCP khi push mã nguồn.

---

## 🛠️ Công Nghệ Sử Dụng

*   **Frontend**: HTML5, CSS3 (Vanilla + Tailwind CSS CDN), JavaScript (ES6+), **Three.js** (WebGL), **GSAP** (GreenSock Animation Platform), Lucide Icons.
*   **Backend PHP**: PHP 8.x, PDO MySQL, PHPMailer, Composer.
*   **Backend Node**: Node.js, TypeScript runtime, Express, `@google/genai` SDK.
*   **Database**: MySQL.
*   **DevOps / Tools**: Docker, Docker Compose, Nginx Proxy Manager, Git, GitHub Actions.

---

## 📂 Cấu Trúc Thư Mục Dự Án

```text
.
├── admin/                 # Giao diện quản trị Admin Dashboard (Form chỉnh sửa dữ liệu, quản lý Guestbook)
├── api/                   # Backend PHP theo mô hình MVC / Service-Repository
│   ├── config/            # Kết nối cơ sở dữ liệu MySQL (PDO Connection)
│   ├── controllers/       # Điều phối các API endpoints (AdminController, GuestbookController)
│   ├── repositories/      # Trực tiếp tương tác truy vấn CSDL
│   ├── services/          # Xử lý logic nghiệp vụ chính (Duyệt tin nhắn, kiểm tra OTP)
│   ├── utils/             # Các công cụ hỗ trợ (Mailer gửi OTP SMTP, helper)
│   ├── chat.php           # API chatbot Gemini RAG (PHP)
│   ├── guestbook.php      # API guestbook công khai
│   └── database.sql       # Schema cấu trúc database MySQL
├── css/                   # Stylesheet chính, tùy biến animations Sci-Fi & Cyberpunk
├── js/                    # Trực quan hóa logic Frontend
│   ├── achievements-manager.js # Quản lý hệ thống thành tựu RPG (Gamification)
│   ├── app.js             # Orchestrator khởi tạo, dịch đa ngôn ngữ, chọn nhân vật
│   ├── control-panel-handler.js # Quản lý tương tác cài đặt đồ họa 3D (Eco Mode, Bloom, Shadow)
│   ├── engine-3d.js       # Toàn bộ mã nguồn WebGL Engine Three.js (~3600 dòng code được tối ưu hóa)
│   ├── game2d-manager.js  # Bộ dựng game 2D Canvas, vật thể vũ trụ tự vẽ, player physics
│   ├── guestbook-manager.js # Xử lý tương tác AJAX gửi/nhận lời nhắn Sổ lưu niệm
│   └── state-manager.js   # Quản lý trạng thái toàn cục & Theme màu 3D (Cyberpunk / Warm Studio)
├── 3d/                    # Thư mục lưu trữ các file mô hình 3D (.glb) nén siêu nhẹ
├── data.json              # File dữ liệu động lưu trữ toàn bộ nội dung Portfolio
├── index.html             # Điểm truy cập chính (Main Page) tích hợp giao diện HUD
├── server.ts              # Server Node/Express (TypeScript) chạy song hành
├── Dockerfile             # Container hóa Node server
├── docker-compose.yml     # Khởi tạo cụm ứng dụng (App Node + Nginx Proxy Manager)
├── package.json           # Cấu hình dependency Node.js
└── composer.json          # Cấu hình dependency PHP (PHPMailer)
```

---

## ⚙️ Hướng Dẫn Cài Đặt Dưới Local

Dự án hỗ trợ hai phương thức chạy chính: chạy trực tiếp bằng PHP/Apache truyền thống hoặc thông qua Docker.

### 📋 Cấu Hình Môi Trường (.env)

Sao chép file `.env.example` thành `.env` tại thư mục gốc và điền các thông tin:

```env
# Google Gemini API Key (Bắt buộc để chạy Chatbot)
GEMINI_API_KEY="your_gemini_api_key"

# URL truy cập ứng dụng (Dùng cho gửi mail OTP)
APP_URL="http://localhost/FE2CV/Profile"

# Cấu hình Kết Nối Database MySQL
DB_HOST="localhost"
DB_NAME="cyber_portfolio"
DB_USER="root"
DB_PASS=""

# Cấu hình SMTP để gửi Mail OTP (Dưới đây là ví dụ dùng Gmail)
MAIL_HOST="smtp.gmail.com"
MAIL_PORT="465"
MAIL_ENCRYPTION="ssl"
MAIL_USERNAME="your_email@gmail.com"
MAIL_PASSWORD="your_gmail_app_password" # Mật khẩu ứng dụng Gmail
MAIL_FROM_ADDRESS="your_email@gmail.com"
MAIL_FROM_NAME="Cyber-Oasis Portfolio"

# Địa chỉ Email nhận OTP của Admin
ADMIN_EMAIL="your_email@gmail.com"
```

---

### Cách 1: Chạy Bằng Máy Chủ Web PHP (Laragon / XAMPP / WAMP)

1.  Di chuyển toàn bộ thư mục dự án `Profile` vào thư mục gốc của máy chủ web (ví dụ `C:\xampp\htdocs\FE2CV\Profile` hoặc `C:\laragon\www\FE2CV\Profile`).
2.  Mở terminal tại thư mục dự án và cài đặt các thư viện PHP:
    ```bash
    composer install
    ```
3.  Tạo một cơ sở dữ liệu MySQL mới có tên `cyber_portfolio` và nhập cấu trúc bảng từ file sql:
    ```bash
    mysql -u root -p cyber_portfolio < api/database.sql
    ```
4.  Cấu hình chính xác tệp `.env`.
5.  Truy cập vào trình duyệt theo đường dẫn:
    ```text
    http://localhost/FE2CV/Profile/
    ```
    Trang quản trị (Admin Dashboard) nằm tại:
    ```text
    http://localhost/FE2CV/Profile/admin/
    ```

---

### Cách 2: Chạy Bằng Docker (Nhanh & Đồng Bộ)

Phương thức này sẽ khởi chạy máy chủ Node.js/Express tích hợp sẵn trên cổng `3000` kết nối qua mạng cầu ảo cùng Nginx Proxy Manager.

1.  Đảm bảo máy của bạn đã cài đặt **Docker** và **Docker Compose**.
2.  Khởi chạy các containers ở chế độ chạy nền:
    ```bash
    docker compose up -d --build
    ```
3.  Các dịch vụ được tạo ra:
    *   **App (Node/Express Server)**: Lắng nghe cục bộ tại cổng `3000`.
    *   **Nginx Proxy Manager**: Mở cổng `80` (HTTP), `443` (HTTPS) và cổng dashboard quản trị `81`.
4.  Truy cập trang cấu hình Nginx Proxy Manager tại `http://localhost:81` (Tài khoản mặc định: `admin@example.com` / `changeme`) và trỏ tên miền (Proxy Host) của bạn về địa chỉ container `app:3000`.

---

## 🎮 Hệ Thống Thành Tựu (Gamification)

Để tăng tính tương tác và thú vị cho nhà tuyển dụng khi duyệt hồ sơ, dự án được tích hợp hệ thống thành tựu RPG nhỏ phát ra âm thanh chúc mừng sinh động dựng từ Web Audio API:

1.  **Nhà Khám Phá (Explorer)**: Đạt được khi người chơi di chuyển qua đầy đủ 5 vùng phân khu chính trong game 2D.
2.  **Du Hành Không Gian (Cosmonaut)**: Đạt được khi kích hoạt chuyển đổi chiều không gian và bước vào chế độ WebGL 3D lần đầu tiên.
3.  **Hỏi Đáp Cùng AI (AI Communicator)**: Đạt được khi gửi tin nhắn trò chuyện cùng Chatbot AI Gemini.
4.  **Trứng Phục Sinh (Easter Egg)**: Được mở khóa khi người chơi tìm thấy đĩa mềm cổ màu vàng phát sáng bí ẩn tại tọa độ ẩn `(x: 750, y: 50)` trên bản đồ 2D. Khi nhặt được sẽ kích hoạt lời cảm ơn đặc biệt từ tác giả gửi tới nhà tuyển dụng.

---

## 🔒 Cơ Chế Bảo Mật Của Trang Admin

Trang quản trị `/admin` được xây dựng bảo mật nghiêm ngặt để bảo vệ tệp dữ liệu cốt lõi `data.json` và cơ sở dữ liệu:
*   **Xác thực 2 bước (2FA OTP Email)**: Khi admin nhập đúng Username & Password, hệ thống sẽ tự sinh mã OTP 6 số ngẫu nhiên có hiệu lực trong 5 phút và gửi thẳng về email cấu hình của Admin (`ADMIN_EMAIL`). Admin bắt buộc phải nhập đúng OTP mới được cấp quyền phiên làm việc (Session).
*   **Form Editor Trực Quan Đa Ngôn Ngữ**: Thay vì phải sửa tệp JSON thô dễ sai cú pháp, Admin được cung cấp form chỉnh sửa 2 cột ngôn ngữ song song (Tiếng Việt & Tiếng Anh), có tính năng thêm/xóa phần tử động và tự động kiểm tra lỗi trước khi đồng bộ. Hệ thống cũng cung cấp chế độ "Chỉnh sửa JSON thô" cho nhà phát triển có kinh nghiệm.

---

## 📄 Bản Quyền & Giấy Phép

Dự án được phân phối dưới giấy phép mã nguồn mở. Xem chi tiết tại tệp [LICENSE](file:///d:/Sever/htdocs/FE2CV/Profile/LICENSE).

---
*Cảm ơn Quý nhà tuyển dụng đã dành thời gian trải nghiệm dự án Cyber-Oasis Portfolio!*
*Mọi ý kiến đóng góp hoặc cơ hội hợp tác xin vui lòng liên hệ qua phần **Portal (Liên hệ & Guestbook)** trực tiếp trong ứng dụng.*
