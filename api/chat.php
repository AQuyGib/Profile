<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit;
}

// Simple function to load .env file
function loadEnv($path) {
    if (file_exists($path)) {
        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line) || strpos($line, '#') === 0) {
                continue;
            }
            if (strpos($line, '=') !== false) {
                list($name, $value) = explode('=', $line, 2);
                $name = trim($name);
                $value = trim($value);
                // Strip quotes if they exist
                $value = trim($value, '"\'');
                putenv("$name=$value");
                $_ENV[$name] = $value;
                $_SERVER[$name] = $value;
            }
        }
    }
}

// Load env from the root directory
loadEnv(__DIR__ . '/../.env');

// Get GEMINI_API_KEY from environment
$apiKey = getenv('GEMINI_API_KEY') ?: ($_ENV['GEMINI_API_KEY'] ?? '');

if (empty($apiKey)) {
    http_response_code(500);
    echo json_encode([
        "error" => "GEMINI_API_KEY environment variable is required. Please configure it in your environment or .env file.",
        "isKeyMissing" => true
    ]);
    exit;
}

// Get POST input
$input = json_decode(file_get_contents('php://input'), true);
$message = $input['message'] ?? '';
$history = $input['history'] ?? [];

if (empty($message)) {
    http_response_code(400);
    echo json_encode(["error" => "Message is required"]);
    exit;
}

// Hàm RAG: Lọc dữ liệu phù hợp từ data.json dựa trên từ khóa trong câu hỏi của người dùng
function getRelevantContext($userQuery) {
    $filePath = __DIR__ . '/../data.json';
    if (!file_exists($filePath)) {
        return '';
    }
    
    $jsonData = json_decode(file_get_contents($filePath), true);
    if (!$jsonData || !isset($jsonData['zones'])) {
        return '';
    }
    
    $normalizedQuery = mb_strtolower($userQuery, 'UTF-8');
    
    // Từ điển từ khóa ánh xạ tới các Zone ID
    $mapping = [
        'home' => ['quý', 'quy', 'bản thân', 'gioi thieu', 'hồ sơ', 'ho so', 'giới thiệu', 'tuổi', 'sinh năm', 'facebook', 'tên', 'ten', 'quê', 'que', 'địa chỉ', 'dia chi'],
        'academy' => ['học vấn', 'hoc van', 'học tập', 'hoc tap', 'trường', 'truong', 'cao đẳng', 'cao dang', 'tdc', 'thủ đức', 'thu duc', 'gpa', 'điểm', 'diem', 'học bổng', 'hoc bong', 'ngành', 'nganh', 'chuyên ngành', 'khoa'],
        'lab' => ['kỹ năng', 'ky nang', 'skills', 'frontend', 'backend', 'php', 'mysql', 'laravel', 'service-repository', 'pattern', 'design', 'tailwind', 'javascript', 'js', 'flutter', 'dart', 'api', 'bảo mật', 'bao mat', '2fa', 'totp', 'bcrypt', 'prepared statement', 'sql injection', 'csrf'],
        'museum' => ['dự án', 'du an', 'project', 'dienmaypro', 'điện máy pro', 'website', 'app', 'mobile', 'thanh toán', 'payos', 'vietqr', 'webhook', 'giải thưởng', 'giai thuong', 'thành tích', 'thanh tich', 'portfolio', 'cũ', 'cu'],
        'library' => ['triết lý', 'triet ly', 'tư duy', 'tu duy', 'châm ngôn', 'cham ngon', 'làm việc', 'lam viec', 'suy nghĩ', 'suy nghi', 'philosophy', 'cá nhân', 'ca nhan'],
        'portal' => ['liên hệ', 'lien he', 'contact', 'sđt', 'sdt', 'điện thoại', 'dien thoai', 'email', 'thư', 'thu', 'github', 'zalo', 'lời nhắn', 'loi nhan', 'guestbook', 'gửi', 'gui']
    ];
    
    $matchedZoneIds = [];
    foreach ($mapping as $zoneId => $keywords) {
        foreach ($keywords as $keyword) {
            if (mb_strpos($normalizedQuery, $keyword, 0, 'UTF-8') !== false) {
                $matchedZoneIds[] = $zoneId;
                break;
            }
        }
    }
    
    // Nếu không khớp từ khóa nào, chọn Home, Lab và Museum làm ngữ cảnh cốt lõi
    if (empty($matchedZoneIds)) {
        $matchedZoneIds = ['home', 'lab', 'museum'];
    }
    
    $contextParts = [];
    foreach ($jsonData['zones'] as $zone) {
        if (in_array($zone['id'], $matchedZoneIds)) {
            $contextParts[] = "== ZONE: " . strtoupper($zone['id']) . " (" . $zone['vietnameseName'] . ") ==";
            $contextParts[] = "Mô tả ngắn: " . $zone['description_vi'];
            if (isset($zone['details_vi'])) {
                $contextParts[] = "Thông tin chi tiết: " . json_encode($zone['details_vi'], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
            }
        }
    }
    
    return implode("\n\n", $contextParts);
}

// Thông tin liên hệ cơ bản cố định
$coreBio = "Họ và tên: Nguyễn Anh Quý\n"
         . "Vị trí ứng tuyển: Thực tập sinh Web Developer\n"
         . "Số điện thoại: 0338 740 475\n"
         . "Email: nguyquy67@gmail.com\n"
         . "GitHub: https://github.com/AQuyGib\n"
         . "Học vấn: Trường Cao Đẳng Công Nghệ Thủ Đức (2024-2027), GPA: 3.1/4.0\n";

$dynamicContext = getRelevantContext($message);

$systemInstruction = <<<TEXT
Bạn là trợ lý ảo AI đại diện cho Nguyễn Anh Quý - một lập trình viên xuất sắc đang ứng tuyển ở vị trí Thực tập sinh Web Developer (Full-stack Web Intern Candidate).
Hãy trả lời câu hỏi của nhà tuyển dụng hoặc khách truy cập dựa trên thông tin tiểu sử cơ bản và các khối thông tin ngữ cảnh động được truy xuất từ file data.json dưới đây.
Hãy trả lời một cách thân thiện, lịch sự, cực kỳ chuyên nghiệp, tự tin nhưng khiêm tốn học hỏi, ngắn gọn và mạch lạc.
Khi giao tiếp, hãy giữ vững tâm thế của một ứng viên Thực tập sinh nhiệt huyết, có khả năng học hỏi cực nhanh qua thực tế, am hiểu sâu sắc mô hình kiến trúc Service-Repository và ứng dụng AI (AI-Augmented Developer).

Nếu khách hỏi về kỹ năng, dự án DIENMAYPRO hoặc học vấn tại trường TDC, hãy nêu chi tiết một cách tự hào và đầy đủ số liệu thuyết phục. Nếu họ hỏi những câu hỏi mở rộng ngoài thông tin trong tiểu sử có sẵn, hãy khéo léo trả lời đại diện cho Quý, ví dụ: "Em rất mong có cơ hội được tham gia phỏng vấn trực tiếp để trao đổi chi tiết hơn về vấn đề này và chứng minh khả năng đóng góp của mình ạ."

Thông tin cơ bản cố định của Nguyễn Anh Quý:
{$coreBio}

Ngữ cảnh chi tiết liên quan truy xuất từ dữ liệu hệ thống (RAG):
{$dynamicContext}
TEXT;


// Format history for Gemini API
$contents = [];
foreach ($history as $msg) {
    $contents[] = [
        "role" => ($msg['role'] === 'user') ? 'user' : 'model',
        "parts" => [
            ["text" => $msg['text'] ?? '']
        ]
    ];
}

// Add the current user message
$contents[] = [
    "role" => "user",
    "parts" => [
        ["text" => $message]
    ]
];

// Payload matching Gemini API spec
$payload = [
    "contents" => $contents,
    "systemInstruction" => [
        "parts" => [
            ["text" => $systemInstruction]
        ]
    ]
];

// Call Gemini API (using stable gemini-1.5-flash as the fallback)
$url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" . $apiKey;

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
if (curl_errno($ch)) {
    http_response_code(500);
    echo json_encode(["error" => curl_error($ch)]);
    exit;
}

$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    http_response_code($httpCode);
    $errorData = json_decode($response, true);
    echo json_encode([
        "error" => $errorData['error']['message'] ?? "Error calling Gemini API",
        "raw_response" => $errorData
    ]);
    exit;
}

$resData = json_decode($response, true);
$replyText = $resData['candidates'][0]['content']['parts'][0]['text'] ?? 'Xin lỗi, tôi gặp khó khăn khi xử lý yêu cầu của bạn.';

echo json_encode(["response" => $replyText]);
