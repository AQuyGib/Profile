-- SQL Database Schema for Cyber-Oasis Portfolio
-- Cấu trúc cơ sở dữ liệu cho Guestbook và Quản trị viên (Admin)

CREATE DATABASE IF NOT EXISTS `cyber_portfolio` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `cyber_portfolio`;

-- 1. Bảng lưu trữ lời nhắn (Guestbook)
CREATE TABLE IF NOT EXISTS `guestbook` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `message` TEXT NOT NULL,
    `status` ENUM('pending', 'approved', 'spam') DEFAULT 'pending',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index để tối ưu tìm kiếm và sắp xếp
CREATE INDEX `idx_guestbook_status_created` ON `guestbook` (`status`, `created_at` DESC);

-- 2. Bảng quản trị viên (Admin Users) để đăng nhập dashboard quản trị
CREATE TABLE IF NOT EXISTS `admins` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `two_fa_secret` VARCHAR(32) DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Thêm một tài khoản quản trị mặc định (username: admin, password: password123)
-- Mật khẩu đã được mã hóa bằng Bcrypt (PASSWORD_BCRYPT)
-- Bạn có thể thay đổi sau trong trang quản trị.
INSERT INTO `admins` (`username`, `password_hash`, `two_fa_secret`) 
VALUES ('admin', '$2y$10$UoW2o.5a8TzJ30H4V8tMhO.iN/uVbA/B76p605k.cpeAHzqKj.v/K', 'JBSWY3DPEHPK3PXP')
ON DUPLICATE KEY UPDATE `username`=`username`;
