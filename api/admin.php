<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json");

// Khởi chạy session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Import Composer Autoloader để nạp PHPMailer
if (file_exists(__DIR__ . '/../vendor/autoload.php')) {
    require_once __DIR__ . '/../vendor/autoload.php';
}

// Xử lý CORS Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Autoloader tương thích
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
use Controllers\AdminController;

$dbInstance = Database::getInstance();
$db = $dbInstance->getConnection();

$repository = new GuestbookRepository($db);
$service = new GuestbookService($repository);
$controller = new AdminController($service);

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'login':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $controller->login();
        } else {
            http_response_code(405);
            echo json_encode(["status" => "error", "message" => "Method Not Allowed"]);
        }
        break;
    case 'logout':
        $controller->logout();
        break;
    case 'status':
        $controller->checkStatus();
        break;
    case 'guestbook':
        $controller->getGuestbook();
        break;
    case 'guestbook_status':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $controller->updateGuestbookStatus();
        } else {
            http_response_code(405);
            echo json_encode(["status" => "error", "message" => "Method Not Allowed"]);
        }
        break;
    case 'guestbook_delete':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $controller->deleteGuestbook();
        } else {
            http_response_code(405);
            echo json_encode(["status" => "error", "message" => "Method Not Allowed"]);
        }
        break;
    case 'portfolio':
        $controller->getPortfolio();
        break;
    case 'portfolio_save':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $controller->savePortfolio();
        } else {
            http_response_code(405);
            echo json_encode(["status" => "error", "message" => "Method Not Allowed"]);
        }
        break;
    default:
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Invalid Action: " . $action]);
        break;
}
