<?php
namespace Utils;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

/**
 * Lớp Mailer phụ trách đóng gói và gửi thư điện tử (email) tự động.
 * Tận dụng thư viện PHPMailer để kết nối an toàn đến máy chủ SMTP (như Gmail SMTP).
 */
class Mailer {
    /**
     * Phương thức tĩnh thực thi gửi email dựa trên cấu hình SMTP nạp từ biến môi trường (.env)
     * 
     * @param string $to Địa chỉ email người nhận thư
     * @param string $subject Tiêu đề của email (chủ đề thư)
     * @param string $bodyHTML Nội dung chính định dạng HTML (cho phép định dạng văn bản màu sắc, hình ảnh, liên kết)
     * @param string $bodyText Nội dung thuần văn bản dạng thô (dùng sơ cua cho các ứng dụng đọc thư không hỗ trợ hiển thị HTML)
     * @return bool True nếu gửi thành công
     * @throws Exception Ngoại lệ nếu quá trình gửi xảy ra lỗi cấu hình hoặc mạng
     */
    public static function send($to, $subject, $bodyHTML, $bodyText = '') {
        // Khởi tạo thực thể PHPMailer và bật tính năng ném ngoại lệ (Exception) khi gặp lỗi
        $mail = new PHPMailer(true);

        try {
            // Chỉ định thư viện PHPMailer sử dụng kết nối qua giao thức SMTP gửi thư
            $mail->isSMTP();
            
            // Nạp máy chủ host SMTP từ biến môi trường, mặc định sử dụng smtp.gmail.com của Google
            $mail->Host       = getenv('MAIL_HOST') ?: getenv('SMTP_HOST') ?: 'smtp.gmail.com';
            
            // Kích hoạt tính năng xác thực tài khoản qua máy chủ SMTP (bắt buộc phải có Username/Password)
            $mail->SMTPAuth   = true;
            
            // Tài khoản đăng nhập máy chủ SMTP (ví dụ: tài khoản Gmail của bạn)
            $mail->Username   = getenv('MAIL_USERNAME') ?: getenv('SMTP_USER') ?: '';
            
            // Mật khẩu ứng dụng (App Password) máy chủ SMTP
            $mail->Password   = getenv('MAIL_PASSWORD') ?: getenv('SMTP_PASS') ?: '';
            
            // Phân tích và cấu hình cơ chế mã hóa bảo mật đường truyền (SSL hoặc TLS)
            $secure = strtolower(getenv('MAIL_ENCRYPTION') ?: getenv('SMTP_SECURE') ?: 'ssl');
            if ($secure === 'ssl') {
                $mail->SMTPSecure = 'ssl'; // Sử dụng SSL (tương đương chuẩn PHPMailer::ENCRYPTION_SMTPS)
                // Cổng gửi thư bảo mật qua SSL mặc định thường là 465
                $mail->Port       = getenv('MAIL_PORT') ?: getenv('SMTP_PORT') ?: 465;
            } else {
                $mail->SMTPSecure = 'tls'; // Sử dụng TLS (tương đương chuẩn PHPMailer::ENCRYPTION_STARTTLS)
                // Cổng gửi thư bảo mật qua TLS mặc định thường là 587
                $mail->Port       = getenv('MAIL_PORT') ?: getenv('SMTP_PORT') ?: 587;
            }

            // Hỗ trợ mã hóa tiếng Việt có dấu chuẩn UTF-8 tránh lỗi bể font chữ khi gửi tiếng Việt
            $mail->CharSet = 'UTF-8';

            // Thiết lập thông tin người gửi thư (From)
            $fromEmail = getenv('MAIL_FROM_ADDRESS') ?: getenv('SMTP_FROM_EMAIL') ?: $mail->Username;
            $fromName  = getenv('MAIL_FROM_NAME') ?: getenv('SMTP_FROM_NAME') ?: 'Cyber-Oasis Portfolio';
            $mail->setFrom($fromEmail, $fromName);
            
            // Thêm địa chỉ người nhận vào danh sách gửi (To)
            $mail->addAddress($to);

            // Cấu hình nội dung thư
            $mail->isHTML(true); // Thiết lập gửi thư dưới dạng mã HTML
            $mail->Subject = $subject; // Gán tiêu đề thư
            $mail->Body    = $bodyHTML; // Gán nội dung chính dạng HTML
            
            // Gán nội dung text thay thế nếu máy nhận không giải mã được HTML
            $mail->AltBody = $bodyText ?: strip_tags($bodyHTML); 

            // Tiến hành gửi email đi
            $mail->send();
            return true;
        } catch (Exception $e) {
            // Ghi nhận lỗi gửi email vào file log hệ thống phục vụ công tác giám sát lỗi
            error_log("PHPMailer Error: " . $mail->ErrorInfo);
            // Ném lỗi ra lớp gọi phía trên để xử lý ngoại lệ phù hợp với giao diện
            throw new \Exception("Không thể gửi email: " . $mail->ErrorInfo);
        }
    }
}
