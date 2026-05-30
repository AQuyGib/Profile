<?php
// Thiết lập các header CORS (Cross-Origin Resource Sharing) cho phép gọi API từ giao diện Client (ví dụ: localhost cổng khác)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json"); // Chỉ định dữ liệu trả về luôn có định dạng JSON

// Khởi chạy Session của PHP để theo dõi trạng thái đăng nhập của Admin (nếu chưa được khởi chạy)
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Nạp Composer Autoloader từ thư mục vendor để hỗ trợ nạp các thư viện bên thứ ba như PHPMailer
if (file_exists(__DIR__ . '/../vendor/autoload.php')) {
    require_once __DIR__ . '/../vendor/autoload.php';
}

// Xử lý request preflight OPTIONS trong cơ chế CORS, thoát sớm khi trình duyệt gửi request kiểm tra tính hợp lệ
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Cơ chế Autoloader tùy biến nhằm tự động tải các lớp (classes) theo Namespace
// Ví dụ: Use Config\Database sẽ tự động nạp file ./config/Database.php
spl_autoload_register(function ($class) {
    $parts = explode('\\', $class);
    $className = array_pop($parts); // Lấy tên Class cuối cùng (ví dụ: Database)
    $dirPath = implode('/', array_map('strtolower', $parts)); // Đổi các tên namespace cha thành chữ thường làm đường dẫn thư mục
    $file = __DIR__ . '/' . ($dirPath ? $dirPath . '/' : '') . $className . '.php'; // Kết hợp thành đường dẫn file hoàn chỉnh
    if (file_exists($file)) {
        require_once $file; // Thực hiện import file lớp nếu tệp tồn tại
    }
});

// Khai báo sử dụng các lớp thông qua Namespace tương ứng
use Config\Database;
use Repositories\GuestbookRepository;
use Services\GuestbookService;
use Controllers\AdminController;

// Khởi tạo kết nối cơ sở dữ liệu MySQL thông qua Singleton Pattern
$dbInstance = Database::getInstance();
$db = $dbInstance->getConnection();

// Khởi tạo các lớp theo mô hình Dependency Injection (Tiêm phụ thuộc):
// Database -> Repository (Xử lý truy vấn) -> Service (Xử lý nghiệp vụ) -> Controller (Điều hướng API)
$repository = new GuestbookRepository($db);
$service = new GuestbookService($repository);
$controller = new AdminController($service);

// Lấy tên hành động cần thực thi được gửi từ URL (?action=...)
$action = $_GET['action'] ?? '';

// Định tuyến (Routing) xử lý tương ứng với từng hành động API
switch ($action) {
    // Đăng nhập quản trị viên (yêu cầu gửi POST kèm username, password, mã OTP)
    case 'login':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $controller->login();
        } else {
            http_response_code(405); // Trả về lỗi Phương thức không được phép
            echo json_encode(["status" => "error", "message" => "Method Not Allowed"]);
        }
        break;

    // Đăng xuất quản trị viên (hủy bỏ session làm việc)
    case 'logout':
        $controller->logout();
        break;

    // Kiểm tra trạng thái phiên đăng nhập của admin (đã đăng nhập hay chưa)
    case 'status':
        $controller->checkStatus();
        break;

    // Lấy toàn bộ danh sách lời nhắn (Guestbook) gửi từ khách truy cập
    case 'guestbook':
        $controller->getGuestbook();
        break;

    // Phê duyệt hoặc hủy phê duyệt một lời nhắn Guestbook (để hiển thị công khai)
    case 'guestbook_status':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $controller->updateGuestbookStatus();
        } else {
            http_response_code(405);
            echo json_encode(["status" => "error", "message" => "Method Not Allowed"]);
        }
        break;

    // Xóa vĩnh viễn một lời nhắn khỏi Guestbook
    case 'guestbook_delete':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $controller->deleteGuestbook();
        } else {
            http_response_code(405);
            echo json_encode(["status" => "error", "message" => "Method Not Allowed"]);
        }
        break;

    // Đọc cấu hình thông tin cá nhân/Portfolio từ file data.json
    case 'portfolio':
        $controller->getPortfolio();
        break;

    // Lưu trữ thông tin chỉnh sửa cấu hình Portfolio vào file data.json
    case 'portfolio_save':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $controller->savePortfolio();
        } else {
            http_response_code(405);
            echo json_encode(["status" => "error", "message" => "Method Not Allowed"]);
        }
        break;

    // Xử lý mặc định khi hành động truyền lên không hợp lệ
    default:
        http_response_code(400); // Lỗi yêu cầu không hợp lệ
        echo json_encode(["status" => "error", "message" => "Invalid Action: " . $action]);
        break;
}
