<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json");

// Xử lý tiền kiểm tra CORS (Preflight requests)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// 1. Đăng ký Autoloader thông minh tương thích Linux/Windows
spl_autoload_register(function ($class) {
    $parts = explode('\\', $class);
    $className = array_pop($parts);
    $dirPath = implode('/', array_map('strtolower', $parts));
    $file = __DIR__ . '/' . ($dirPath ? $dirPath . '/' : '') . $className . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
});

use Config\Database;
use Repositories\GuestbookRepository;
use Services\GuestbookService;
use Controllers\GuestbookController;

// 2. Khởi tạo các đối tượng theo Service-Repository Pattern
$dbInstance = Database::getInstance();
$db = $dbInstance->getConnection();

$repository = new GuestbookRepository($db);
$service = new GuestbookService($repository);
$controller = new GuestbookController($service);

// 3. Phân tuyến Route dựa trên Request Method
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $controller->getApproved();
} elseif ($method === 'POST') {
    $controller->create();
} else {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
}
