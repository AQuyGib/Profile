<?php
namespace Utils;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

class Mailer {
    /**
     * Gửi email sử dụng cấu hình SMTP từ môi trường (.env)
     * 
     * @param string $to Địa chỉ người nhận
     * @param string $subject Tiêu đề email
     * @param string $bodyHTML Nội dung HTML
     * @param string $bodyText Nội dung text (nếu có)
     * @return bool
     * @throws Exception
     */
    public static function send($to, $subject, $bodyHTML, $bodyText = '') {
        $mail = new PHPMailer(true);

        try {
            // Thiết lập máy chủ SMTP
            $mail->isSMTP();
            $mail->Host       = getenv('MAIL_HOST') ?: getenv('SMTP_HOST') ?: 'smtp.gmail.com';
            $mail->SMTPAuth   = true;
            $mail->Username   = getenv('MAIL_USERNAME') ?: getenv('SMTP_USER') ?: '';
            $mail->Password   = getenv('MAIL_PASSWORD') ?: getenv('SMTP_PASS') ?: '';
            
            $secure = strtolower(getenv('MAIL_ENCRYPTION') ?: getenv('SMTP_SECURE') ?: 'ssl');
            if ($secure === 'ssl') {
                $mail->SMTPSecure = 'ssl'; // Tương đương PHPMailer::ENCRYPTION_SMTPS
                $mail->Port       = getenv('MAIL_PORT') ?: getenv('SMTP_PORT') ?: 465;
            } else {
                $mail->SMTPSecure = 'tls'; // Tương đương PHPMailer::ENCRYPTION_STARTTLS
                $mail->Port       = getenv('MAIL_PORT') ?: getenv('SMTP_PORT') ?: 587;
            }

            // Hỗ trợ tiếng Việt UTF-8
            $mail->CharSet = 'UTF-8';

            // Người gửi và người nhận
            $fromEmail = getenv('MAIL_FROM_ADDRESS') ?: getenv('SMTP_FROM_EMAIL') ?: $mail->Username;
            $fromName  = getenv('MAIL_FROM_NAME') ?: getenv('SMTP_FROM_NAME') ?: 'Cyber-Oasis Portfolio';
            $mail->setFrom($fromEmail, $fromName);
            $mail->addAddress($to);

            // Nội dung email
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body    = $bodyHTML;
            $mail->AltBody = $bodyText ?: strip_tags($bodyHTML);

            $mail->send();
            return true;
        } catch (Exception $e) {
            error_log("PHPMailer Error: " . $mail->ErrorInfo);
            throw new \Exception("Không thể gửi email: " . $mail->ErrorInfo);
        }
    }
}
