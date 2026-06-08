# Cyber-Oasis Portfolio

Portfolio cá nhân tương tác của **Nguyễn Anh Quý**, kết hợp giao diện cyberpunk, bản đồ khám phá 2D/3D, chatbot AI dùng Google Gemini, guestbook và trang quản trị nội dung.

Dự án hiện có hai hướng chạy:

- **Backend chính: Apache/PHP** để dùng chatbot, guestbook và admin console.
- **Backend tùy chọn: Node.js/Express** qua `server.ts` để phục vụ frontend và endpoint chatbot tương thích khi chạy Docker/Node.

## Tính năng chính

- **Portfolio tương tác 2D/3D**: người xem khám phá các khu vực thông tin như giới thiệu, học vấn, kỹ năng, dự án, triết lý làm việc và liên hệ.
- **Dữ liệu động từ `data.json`**: nội dung portfolio được tách khỏi giao diện để dễ chỉnh sửa và nạp lại.
- **Chatbot AI Gemini**: trả lời câu hỏi về hồ sơ, kỹ năng và dự án của Nguyễn Anh Quý thông qua `api/chat.php` hoặc endpoint Node `/api/chat`.
- **Guestbook**: khách truy cập có thể gửi lời nhắn, admin duyệt trước khi hiển thị công khai.
- **Admin console**: quản lý guestbook và chỉnh sửa dữ liệu portfolio tại `admin/index.html`.
- **Hiệu ứng giao diện**: Tailwind CDN, Three.js, GSAP, Lucide icons, Web Audio API, theme và cấu hình hiệu năng lưu bằng `localStorage`.
- **Triển khai linh hoạt**: hỗ trợ chạy với PHP/Apache truyền thống, Node.js hoặc Docker/Nginx Proxy Manager.

## Công nghệ sử dụng

- Frontend: HTML, CSS, JavaScript thuần, Tailwind CSS CDN, Three.js, GSAP, Lucide.
- Backend PHP: PHP, PDO, MySQL, PHPMailer, mô hình Controller-Service-Repository cho guestbook/admin.
- Backend Node: Node.js, Express, TypeScript runtime, Google GenAI SDK.
- Dữ liệu: `data.json`, MySQL schema trong `api/database.sql`.
- DevOps: Dockerfile và `docker-compose.yml`.

## Cấu trúc thư mục

```text
.
├── admin/                 # Giao diện quản trị portfolio và guestbook
├── api/
│   ├── chat.php           # API chatbot Gemini bản PHP
│   ├── guestbook.php      # API guestbook công khai
│   ├── admin.php          # API quản trị
│   ├── database.sql       # Schema MySQL
│   ├── config/            # Kết nối database
│   ├── controllers/       # Controller API
│   ├── repositories/      # Truy vấn dữ liệu
│   ├── services/          # Logic nghiệp vụ
│   └── utils/             # Mailer, TOTP
├── css/                   # Style chính
├── js/                    # Logic frontend, game 2D/3D, chatbot, guestbook
├── 3d/                    # Tài nguyên 3D
├── cyber-portfolio/       # Phiên bản/thử nghiệm portfolio 3D riêng
├── data.json              # Nội dung portfolio
├── index.html             # Trang portfolio chính
├── 2d.html                # Trang thư viện/tài nguyên 2D
├── 3d.html                # Trang tài nguyên 3D
├── server.ts              # Server Node/Express
├── Dockerfile
├── docker-compose.yml
├── composer.json
└── package.json
```

## Cấu hình môi trường

Tạo file `.env` từ `.env.example` và bổ sung các biến cần dùng:

```env
GEMINI_API_KEY="your_gemini_api_key"
APP_URL="http://localhost/FE2CV/Profile"

DB_HOST="localhost"
DB_NAME="cyber_portfolio"
DB_USER="root"
DB_PASS=""

MAIL_HOST="smtp.gmail.com"
MAIL_PORT="465"
MAIL_ENCRYPTION="ssl"
MAIL_USERNAME="your_email@gmail.com"
MAIL_PASSWORD="your_app_password"
MAIL_FROM_ADDRESS="your_email@gmail.com"
MAIL_FROM_NAME="Cyber-Oasis Portfolio"
ADMIN_EMAIL="your_email@gmail.com"
```

Ghi chú:

- `GEMINI_API_KEY` là bắt buộc nếu dùng chatbot.
- Các biến `DB_*` cần thiết cho guestbook và admin console.
- Các biến `MAIL_*`/`ADMIN_EMAIL` dùng cho OTP đăng nhập admin.
- Không commit file `.env` thật vì chứa khóa API và mật khẩu.

## Chạy bằng PHP/Apache

Phù hợp khi dùng Laragon, XAMPP, WAMP hoặc hosting PHP.

1. Đặt thư mục dự án vào thư mục web root, ví dụ `C:\laragon\www\FE2CV\Profile` hoặc `C:\xampp\htdocs\FE2CV\Profile`.
2. Cài dependency PHP:

   ```bash
   composer install
   ```

3. Tạo database MySQL và import schema:

   ```bash
   mysql -u root -p < api/database.sql
   ```

4. Cấu hình `.env`.
5. Mở trình duyệt tại URL tương ứng, ví dụ:

   ```text
   http://localhost/FE2CV/Profile/
   ```

Trang quản trị nằm tại:

```text
http://localhost/FE2CV/Profile/admin/
```

`api/database.sql` chỉ tạo bảng, không seed tài khoản admin mặc định. Hãy tạo admin riêng cho từng môi trường bằng mật khẩu đã hash Bcrypt và `two_fa_secret` riêng, tránh dùng tài khoản mẫu trong production.

## Chạy bằng Node.js

Phù hợp khi muốn dùng server Express trong `server.ts`.

```bash
npm install
npm start
```

Server mặc định lắng nghe cổng `3000`:

```text
http://localhost:3000
```

Node server phục vụ static assets, `assets/`, `data.json`, trang `index.html` và endpoint chatbot `/api/chat` hoặc `/api/chat.php`. Guestbook và admin console vẫn thuộc backend PHP/MySQL.

## Chạy bằng Docker

```bash
docker compose up -d --build
```

`docker-compose.yml` gồm:

- `app`: container Node/Express, expose nội bộ cổng `3000`.
- `nginx-proxy-manager`: reverse proxy, mở cổng `80`, `443` và dashboard quản trị `81`.

Cần cấu hình domain/proxy host trong Nginx Proxy Manager để trỏ về service `app:3000`.

## Quản lý nội dung

- Nội dung hiển thị chính nằm trong `data.json`.
- Admin console có thể đọc và ghi lại `data.json` qua `api/admin.php?action=portfolio` và `api/admin.php?action=portfolio_save`.
- Guestbook lưu trong bảng `guestbook`, mặc định tin nhắn mới ở trạng thái `pending`.
- Chỉ tin nhắn `approved` mới được API công khai trả về.

## Triển khai hosting PHP

1. Upload các file/thư mục cần thiết lên `public_html` hoặc thư mục public của hosting.
2. Chạy `composer install` trước khi upload hoặc upload kèm thư mục `vendor/`.
3. Import `api/database.sql` vào MySQL hosting.
4. Cấu hình `.env` trên hosting với API key, database và mail SMTP.
5. Đảm bảo web server có quyền ghi `data.json` nếu muốn chỉnh nội dung qua admin console.

## Lưu ý bảo mật

- Không public `.env`, backup database hoặc file chứa khóa API.
- Không dùng tài khoản admin mặc định hoặc mật khẩu mẫu trong production.
- Với môi trường production, nên hạn chế truy cập trực tiếp file nhạy cảm bằng cấu hình web server.
- Nếu dùng OTP email cho admin, cần cấu hình SMTP bằng app password hoặc cơ chế xác thực phù hợp của nhà cung cấp mail.

## License

Dự án sử dụng giấy phép trong file `LICENSE`.
