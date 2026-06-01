<?php
namespace Config;

use PDO;
use PDOException;

/**
 * Lớp Database quản lý kết nối cơ sở dữ liệu MySQL sử dụng thư viện PDO.
 * Áp dụng mẫu thiết kế Singleton (Singleton Pattern) để đảm bảo chỉ có duy nhất một kết nối Database trong suốt vòng đời của request.
 */
class Database {
    // Thuộc tính lưu trữ thực thể duy nhất của lớp Database
    private static $instance = null;
    
    // Thuộc tính lưu trữ đối tượng kết nối PDO
    private $conn;

    // Các thông số kết nối mặc định (sẽ được ghi đè bởi tệp cấu hình cấu trúc .env nếu có)
    private $host = "localhost";
    private $db_name = "cyber_portfolio";
    private $username = "root";
    private $password = "";

    /**
     * Hàm khởi tạo __construct được khai báo ở chế độ PRIVATE.
     * Mục đích: Ngăn chặn việc khởi tạo thực thể lớp bằng từ khóa 'new' từ bên ngoài lớp.
     */
    private function __construct() {
        // Nạp các biến cấu hình từ tệp tin .env nằm ở thư mục gốc của dự án
        $this->loadEnv(__DIR__ . '/../../.env');

        // Ghi đè các thông số mặc định nếu tìm thấy cấu hình tương ứng trong biến môi trường hệ thống
        $this->host = getenv('DB_HOST') ?: $this->host;
        $this->db_name = getenv('DB_NAME') ?: $this->db_name;
        $this->username = getenv('DB_USER') ?: $this->username;
        $this->password = getenv('DB_PASS') !== false ? getenv('DB_PASS') : $this->password;

        try {
            // Định dạng chuỗi DSN kết nối cơ sở dữ liệu MySQL hỗ trợ bảng mã tiếng Việt utf8mb4
            $dsn = "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4";
            
            // Các thiết lập bảo mật và cấu hình PDO nâng cao:
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, // Ném ra ngoại lệ (Exception) khi phát hiện lỗi SQL để dễ bắt lỗi
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, // Thiết lập kiểu trả về dữ liệu mặc định dưới dạng Mảng kết hợp (Associative Array)
                PDO::ATTR_EMULATE_PREPARES => false, // Tắt chế độ giả lập SQL prepare của PDO, tăng cường tính bảo mật chống SQL Injection
            ];
            
            // Khởi tạo thực thể kết nối PDO
            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
        } catch (PDOException $exception) {
            // Trả về mã lỗi 500 nếu kết nối Database thất bại
            http_response_code(500);
            echo json_encode([
                "error" => "Database connection failure: " . $exception->getMessage()
            ]);
            exit; // Dừng chương trình ngay lập tức
        }
    }

    /**
     * Phương thức tĩnh (Static method) lấy thực thể duy nhất của lớp Database.
     * Nếu thực thể chưa tồn tại, hàm sẽ khởi tạo một lần duy nhất và trả về cho các lượt gọi sau.
     */
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new Database();
        }
        return self::$instance;
    }

    /**
     * Phương thức lấy đối tượng kết nối PDO đang hoạt động
     */
    public function getConnection() {
        return $this->conn;
    }

    /**
     * Hàm tự xây dựng để nạp và phân tích tệp cấu hình môi trường .env dòng từng dòng.
     * Chuyển các cặp khóa-giá trị thành các biến môi trường để truy xuất qua hàm getenv().
     */
    private function loadEnv($path) {
        if (file_exists($path)) {
            // Đọc toàn bộ nội dung file .env thành một mảng dòng, bỏ qua các dòng trống
            $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                $line = trim($line);
                // Bỏ qua các dòng comment bắt đầu bằng ký tự #
                if (empty($line) || strpos($line, '#') === 0) {
                    continue;
                }
                // Tìm kiếm vị trí dấu bằng phân tách giữa Khóa và Giá trị
                if (strpos($line, '=') !== false) {
                    list($name, $value) = explode('=', $line, 2);
                    $name = trim($name);
                    $value = trim($value);
                    
                    // Loại bỏ các dấu nháy đơn hoặc nháy kép bao bọc giá trị của cấu hình (nếu có)
                    $value = trim($value, '"\'');
                    
                    // Ghi nhận cấu hình vào hệ thống biến môi trường của PHP
                    putenv("$name=$value");
                    $_ENV[$name] = $value;
                    $_SERVER[$name] = $value;
                }
            }
        }
    }
}
