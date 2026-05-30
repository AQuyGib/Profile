<?php
namespace Controllers;

use Services\GuestbookService;

class GuestbookController {
    private $service;

    public function __construct(GuestbookService $service) {
        $this->service = $service;
    }

    /**
     * Lấy các bình luận công khai
     */
    public function getApproved() {
        try {
            $messages = $this->service->getApprovedMessages();
            echo json_encode(["status" => "success", "data" => $messages]);
        } catch (\Exception $e) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
    }

    /**
     * Gửi bình luận mới từ Frontend
     */
    public function create() {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $name = $input['name'] ?? '';
            $email = $input['email'] ?? '';
            $message = $input['message'] ?? '';

            $this->service->postMessage($name, $email, $message);
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
     * Lấy tất cả cho Admin
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
     * Duyệt/Đánh dấu spam cho Admin
     */
    public function updateStatus() {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $id = $input['id'] ?? 0;
            $status = $input['status'] ?? '';

            $this->service->updateMessageStatus($id, $status);
            echo json_encode(["status" => "success", "message" => "Cập nhật trạng thái thành công!"]);
        } catch (\Exception $e) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
    }

    /**
     * Xóa bình luận cho Admin
     */
    public function delete() {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $id = $input['id'] ?? 0;

            $this->service->deleteMessage($id);
            echo json_encode(["status" => "success", "message" => "Xóa tin nhắn thành công!"]);
        } catch (\Exception $e) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
    }
}
