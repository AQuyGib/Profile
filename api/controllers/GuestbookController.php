<?php
namespace Controllers;

use Services\GuestbookService;

/**
 * Lớp GuestbookController chịu trách nhiệm nhận yêu cầu HTTP từ client,
 * phối hợp với GuestbookService để thực hiện nghiệp vụ và trả về kết quả JSON tương ứng.
 */
class GuestbookController {
    // Thuộc tính lưu trữ Service xử lý nghiệp vụ của Guestbook
    private $service;

    /**
     * Hàm khởi tạo nhận đối tượng GuestbookService thông qua mô hình Dependency Injection (tiêm phụ thuộc).
     */
    public function __construct(GuestbookService $service) {
        $this->service = $service;
    }

    /**
     * API Lấy các bình luận đã phê duyệt để hiển thị công khai trên giao diện người dùng
     */
    public function getApproved() {
        try {
            // Lấy danh sách tin nhắn đã phê duyệt từ Service
            $messages = $this->service->getApprovedMessages();
            // Trả về kết quả JSON thành công kèm dữ liệu
            echo json_encode(["status" => "success", "data" => $messages]);
        } catch (\Exception $e) {
            // Thiết lập HTTP Status Code là 400 (Bad Request) nếu phát sinh lỗi
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
    }

    /**
     * API Gửi một lời nhắn mới (Guestbook comment) từ giao diện Client
     */
    public function create() {
        try {
            // Đọc luồng dữ liệu JSON thô gửi lên trong body của HTTP POST request
            $input = json_decode(file_get_contents('php://input'), true);
            
            // Lấy dữ liệu và gán giá trị mặc định nếu rỗng
            $name = $input['name'] ?? '';
            $email = $input['email'] ?? '';
            $message = $input['message'] ?? '';

            // Gọi phương thức nghiệp vụ kiểm tra và lưu lời nhắn
            $this->service->postMessage($name, $email, $message);
            
            // Trả về thông báo thành công cho client
            echo json_encode([
                "status" => "success", 
                "message" => "Tin nhắn đã gửi thành công và đang chờ duyệt bởi Quý!"
            ]);
        } catch (\Exception $e) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
    }

    /**
     * API Lấy toàn bộ danh sách lời nhắn phục vụ cho trang quản trị Admin (bao gồm cả chờ duyệt, đã duyệt, spam)
     */
    public function getAdminAll() {
        try {
            $messages = $this->service->getAllMessages();
            echo json_encode(["status" => "success", "data" => $messages]);
        } catch (\Exception $e) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
    }

    /**
     * API Cập nhật trạng thái của một lời nhắn (ví dụ: Duyệt / Đánh dấu spam)
     */
    public function updateStatus() {
        try {
            // Phân tích dữ liệu JSON thô nhận được từ Admin Dashboard
            $input = json_decode(file_get_contents('php://input'), true);
            $id = $input['id'] ?? 0;
            $status = $input['status'] ?? '';

            // Gọi service thực thi cập nhật cơ sở dữ liệu
            $this->service->updateMessageStatus($id, $status);
            echo json_encode(["status" => "success", "message" => "Cập nhật trạng thái thành công!"]);
        } catch (\Exception $e) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
    }

    /**
     * API Xóa vĩnh viễn một lời nhắn khỏi cơ sở dữ liệu (dành cho Admin)
     */
    public function delete() {
        try {
            // Lấy ID lời nhắn cần xóa từ JSON payload gửi lên
            $input = json_decode(file_get_contents('php://input'), true);
            $id = $input['id'] ?? 0;

            // Thực thi nghiệp vụ xóa lời nhắn qua Service
            $this->service->deleteMessage($id);
            echo json_encode(["status" => "success", "message" => "Xóa tin nhắn thành công!"]);
        } catch (\Exception $e) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
    }
}
