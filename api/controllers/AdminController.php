<?php
namespace Controllers;

use Config\Database;
use Utils\Mailer;
use Services\GuestbookService;
use Exception;

class AdminController {
    private $db;
    private $guestbookService;

    public function __construct(GuestbookService $guestbookService) {
        $this->db = Database::getInstance()->getConnection();
        $this->guestbookService = $guestbookService;
    }

    /**
     * Đăng nhập kết hợp Username/Password và mã xác thực OTP qua Email
     */
    public function login() {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $username = trim($input['username'] ?? '');
            $password = $input['password'] ?? '';
            $code = trim($input['code'] ?? '');

            if (empty($username) || empty($password)) {
                throw new Exception("Tên đăng nhập và mật khẩu không được để trống.");
            }

            // Truy vấn lấy tài khoản admin
            $query = "SELECT * FROM admins WHERE username = :username LIMIT 1";
            $stmt = $this->db->prepare($query);
            $stmt->execute([':username' => $username]);
            $user = $stmt->fetch();

            if (!$user) {
                throw new Exception("Thông tin đăng nhập không chính xác.");
            }

            // 1. Kiểm tra mật khẩu (Bcrypt)
            if (!password_verify($password, $user['password_hash'])) {
                throw new Exception("Thông tin đăng nhập không chính xác.");
            }

            // Lấy email của quản trị viên từ cấu hình môi trường (.env)
            $adminEmail = getenv('ADMIN_EMAIL') ?: getenv('MAIL_USERNAME') ?: 'your_email@gmail.com';

            // Khởi chạy session nếu chưa có
            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }

            // 2. Nếu người dùng chưa gửi kèm mã OTP, tiến hành sinh và gửi mã OTP qua Email
            if (empty($code)) {
                $otp = sprintf("%06d", rand(100000, 999999));
                
                // Lưu OTP vào Session tạm thời để đối chiếu
                $_SESSION['pending_admin_username'] = $username;
                $_SESSION['email_otp'] = $otp;
                $_SESSION['email_otp_expires'] = time() + 300; // Mã có hiệu lực trong 5 phút

                // Soạn nội dung email
                $subject = "🔒 [Cyber-Oasis] Mã xác thực đăng nhập OTP Console Admin";
                $bodyHTML = '
                    <div style="background-color:#09090b; color:#d4d4d8; padding:30px; font-family:\'Courier New\', Courier, monospace; border:1px solid #27272a; border-radius:10px; max-width: 500px; margin: 0 auto;">
                        <h2 style="color:#10b981; border-bottom:1px solid #27272a; padding-bottom:10px; margin-top: 0;">CYBER-OASIS SECURITY OTP</h2>
                        <p>Hệ thống vừa nhận được yêu cầu đăng nhập từ tài khoản: <strong style="color:#ffffff;">' . htmlspecialchars($username) . '</strong></p>
                        <p>Dưới đây là mã xác thực đăng nhập OTP của bạn (chỉ có hiệu lực trong vòng 5 phút):</p>
                        <div style="background-color:#18181b; padding:15px; font-size:26px; text-align:center; letter-spacing:5px; font-weight:bold; color:#10b981; border:1px solid #3f3f46; border-radius:5px; margin:20px 0;">
                            ' . $otp . '
                        </div>
                        <p style="color:#71717a; font-size:11px; margin-bottom: 0; line-height: 1.4;">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này hoặc thực hiện đổi mật khẩu tài khoản quản trị để tự bảo vệ.</p>
                    </div>
                ';

                // Tiến hành gửi email
                Mailer::send($adminEmail, $subject, $bodyHTML);

                // Trả về tín hiệu yêu cầu người dùng điền OTP gửi từ Email
                echo json_encode([
                    "status" => "otp_sent",
                    "message" => "Mã xác thực OTP đã được gửi tới email của quản trị viên. Vui lòng kiểm tra hộp thư!"
                ]);
                exit;
            }

            // 3. Nếu đã gửi mã OTP, kiểm tra tính hợp lệ của mã OTP
            if (!isset($_SESSION['pending_admin_username']) || $_SESSION['pending_admin_username'] !== $username) {
                throw new Exception("Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
            }

            if (!isset($_SESSION['email_otp']) || $_SESSION['email_otp'] !== $code) {
                throw new Exception("Mã OTP không chính xác.");
            }

            if (time() > ($_SESSION['email_otp_expires'] ?? 0)) {
                throw new Exception("Mã OTP đã hết hạn sử dụng.");
            }

            // 4. Mã hợp lệ -> Xác nhận đăng nhập thành công
            $_SESSION['admin_logged_in'] = true;
            $_SESSION['admin_username'] = $user['username'];

            // Xóa các biến session OTP tạm thời
            unset($_SESSION['pending_admin_username']);
            unset($_SESSION['email_otp']);
            unset($_SESSION['email_otp_expires']);

            echo json_encode([
                "status" => "success",
                "message" => "Đăng nhập hệ thống quản trị thành công!"
            ]);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
    }

    /**
     * Đăng xuất
     */
    public function logout() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        $_SESSION = [];
        session_destroy();
        echo json_encode(["status" => "success", "message" => "Đã đăng xuất thành công."]);
    }

    /**
     * Kiểm tra trạng thái đăng nhập hiện tại
     */
    public function checkStatus() {
        $this->requireAuth();
        echo json_encode([
            "status" => "success",
            "username" => $_SESSION['admin_username']
        ]);
    }

    /**
     * Xem danh sách toàn bộ bình luận (Admin)
     */
    public function getGuestbook() {
        $this->requireAuth();
        try {
            $messages = $this->guestbookService->getAllMessages();
            echo json_encode(["status" => "success", "data" => $messages]);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
    }

    /**
     * Cập nhật trạng thái duyệt tin nhắn (Admin)
     */
    public function updateGuestbookStatus() {
        $this->requireAuth();
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $id = $input['id'] ?? 0;
            $status = $input['status'] ?? '';

            $this->guestbookService->updateMessageStatus($id, $status);
            echo json_encode(["status" => "success", "message" => "Cập nhật trạng thái thành công."]);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
    }

    /**
     * Xóa tin nhắn (Admin)
     */
    public function deleteGuestbook() {
        $this->requireAuth();
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $id = $input['id'] ?? 0;

            $this->guestbookService->deleteMessage($id);
            echo json_encode(["status" => "success", "message" => "Xóa tin nhắn thành công."]);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
    }

    /**
     * Lấy nội dung file data.json để chỉnh sửa (Admin)
     */
    public function getPortfolio() {
        $this->requireAuth();
        $filePath = __DIR__ . '/../../data.json';
        if (file_exists($filePath)) {
            $data = file_get_contents($filePath);
            echo json_encode(["status" => "success", "data" => json_decode($data, true)]);
        } else {
            http_response_code(404);
            echo json_encode(["status" => "error", "message" => "Không tìm thấy file data.json"]);
        }
    }

    /**
     * Lưu đè nội dung file data.json (Admin)
     */
    public function savePortfolio() {
        $this->requireAuth();
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $newData = $input['data'] ?? null;

            if ($newData === null) {
                throw new Exception("Dữ liệu Portfolio không hợp lệ.");
            }

            $filePath = __DIR__ . '/../../data.json';
            
            // Format JSON đẹp mắt trước khi ghi
            $formattedJson = json_encode($newData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            
            if (file_put_contents($filePath, $formattedJson) === false) {
                throw new Exception("Lỗi ghi dữ liệu vào file data.json.");
            }

            echo json_encode(["status" => "success", "message" => "Cập nhật dữ liệu Portfolio thành công!"]);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
    }

    /**
     * Bắt buộc có quyền đăng nhập mới đi tiếp
     */
    private function requireAuth() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
            http_response_code(401);
            echo json_encode(["status" => "error", "message" => "Unauthorized: Yêu cầu đăng nhập quyền admin."]);
            exit;
        }
    }
}
