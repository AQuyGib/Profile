<?php
namespace Repositories;

use PDO;

class GuestbookRepository {
    private $db;

    public function __construct(PDO $db) {
        $this->db = $db;
    }

    /**
     * Lấy danh sách các tin nhắn đã được phê duyệt (để hiển thị public)
     */
    public function getAllApproved() {
        $query = "SELECT id, name, message, created_at FROM guestbook WHERE status = 'approved' ORDER BY created_at DESC";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    /**
     * Tạo tin nhắn mới
     */
    public function create($name, $email, $message) {
        $query = "INSERT INTO guestbook (name, email, message, status) VALUES (:name, :email, :message, 'pending')";
        $stmt = $this->db->prepare($query);
        return $stmt->execute([
            ':name' => $name,
            ':email' => $email,
            ':message' => $message
        ]);
    }

    /**
     * Lấy toàn bộ danh sách (cho admin quản lý)
     */
    public function getAll() {
        $query = "SELECT id, name, email, message, status, created_at FROM guestbook ORDER BY created_at DESC";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    /**
     * Cập nhật trạng thái tin nhắn
     */
    public function updateStatus($id, $status) {
        $query = "UPDATE guestbook SET status = :status WHERE id = :id";
        $stmt = $this->db->prepare($query);
        return $stmt->execute([
            ':id' => $id,
            ':status' => $status
        ]);
    }

    /**
     * Xóa tin nhắn
     */
    public function delete($id) {
        $query = "DELETE FROM guestbook WHERE id = :id";
        $stmt = $this->db->prepare($query);
        return $stmt->execute([':id' => $id]);
    }
}
