<?php
namespace Services;

use Repositories\GuestbookRepository;

class GuestbookService {
    private $repository;

    public function __construct(GuestbookRepository $repository) {
        $this->repository = $repository;
    }

    /**
     * Lấy các bình luận công khai đã duyệt
     */
    public function getApprovedMessages() {
        return $this->repository->getAllApproved();
    }

    /**
     * Gửi bình luận mới
     */
    public function postMessage($name, $email, $message) {
        // 1. Loại bỏ khoảng trắng thừa
        $name = trim($name);
        $email = trim($email);
        $message = trim($message);

        // 2. Kiểm tra dữ liệu đầu vào (Validation)
        if (empty($name)) {
            throw new \Exception("Tên người gửi không được để trống.");
        }
        if (strlen($name) > 100) {
            throw new \Exception("Tên người gửi không được dài quá 100 ký tự.");
        }

        if (empty($email)) {
            throw new \Exception("Email không được để trống.");
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new \Exception("Định dạng Email không hợp lệ.");
        }

        if (empty($message)) {
            throw new \Exception("Nội dung tin nhắn không được để trống.");
        }
        if (strlen($message) > 1000) {
            throw new \Exception("Nội dung tin nhắn không được dài quá 1000 ký tự.");
        }

        // 3. Làm sạch dữ liệu (Sanitization) tránh XSS
        $name = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
        $message = htmlspecialchars($message, ENT_QUOTES, 'UTF-8');

        // 4. Lưu dữ liệu
        return $this->repository->create($name, $email, $message);
    }

    /**
     * Lấy tất cả tin nhắn (dành cho Admin)
     */
    public function getAllMessages() {
        return $this->repository->getAll();
    }

    /**
     * Cập nhật trạng thái
     */
    public function updateMessageStatus($id, $status) {
        $id = (int)$id;
        if (!in_array($status, ['pending', 'approved', 'spam'])) {
            throw new \Exception("Trạng thái phê duyệt không hợp lệ.");
        }
        return $this->repository->updateStatus($id, $status);
    }

    /**
     * Xóa bình luận
     */
    public function deleteMessage($id) {
        $id = (int)$id;
        return $this->repository->delete($id);
    }
}
