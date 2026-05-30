<?php
// Thiết lập các tiêu đề CORS (Cross-Origin Resource Sharing) hỗ trợ giao tiếp đa miền giữa client và backend
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json"); // Đảm bảo dữ liệu trả về cho client luôn là định dạng JSON

// Xử lý sớm request kiểm tra tiền kiểm CORS (Preflight request) từ trình duyệt
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Đăng ký cơ chế tự động nạp các lớp (Autoloader) theo cấu trúc thư mục dạng chữ thường tương thích đa hệ điều hành (Linux/Windows)
spl_autoload_register(function ($class) {
    $parts = explode('\\', $class);
    $className = array_pop($parts); // Lấy tên lớp ở cuối đường dẫn namespace
    $dirPath = implode('/', array_map('strtolower', $parts)); // Định dạng các thư mục namespace cha thành chữ thường
    $file = __DIR__ . '/' . ($dirPath ? $dirPath . '/' : '') . $className . '.php'; // Xây dựng đường dẫn file hoàn chỉnh
    if (file_exists($file)) {
        require_once $file; // Thực hiện import file lớp
    }
});

// Import các lớp nghiệp vụ từ cấu trúc Namespace tương ứng
use Config\Database;
use Repositories\GuestbookRepository;
use Services\GuestbookService;
use Controllers\GuestbookController;

// Khởi tạo và thiết lập kết nối cơ sở dữ liệu MySQL (áp dụng mẫu thiết kế Singleton)
$dbInstance = Database::getInstance();
$db = $dbInstance->getConnection();

// Áp dụng Service-Repository Pattern để lắp ráp các tầng nghiệp vụ xử lý Lời nhắn (Guestbook):
// Kết nối Database -> Khởi tạo Repository (Truy vấn DB) -> Khởi tạo Service (Logic nghiệp vụ) -> Khởi tạo Controller (Tiếp nhận HTTP request)
$repository = new GuestbookRepository($db);
$service = new GuestbookService($repository);
$controller = new GuestbookController($service);

// Lấy phương thức HTTP (GET, POST, PUT, DELETE, v.v.) đang gọi tới API
$method = $_SERVER['REQUEST_METHOD'];

// Định tuyến API (Routing) dựa trên phương thức gọi HTTP:
if ($method === 'GET') {
    // Nếu là GET request: Truy vấn và trả về danh sách các tin nhắn đã được Admin duyệt hiển thị công khai
    $controller->getApproved();
} elseif ($method === 'POST') {
    // Nếu là POST request: Tiến hành nhận dữ liệu đầu vào và tạo lời nhắn mới chờ Admin phê duyệt
    $controller->create();
} else {
    // Nếu gọi bằng phương thức khác (PUT, DELETE, v.v.): Trả về mã lỗi 405 (Phương thức không được hỗ trợ)
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
}
