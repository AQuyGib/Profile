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

// Thiết lập cấu trúc dữ liệu Payload (body request) theo đúng đặc tả của Google Gemini API
$payload = [
    "contents" => $contents, // Mảng chứa lịch sử trò chuyện và tin nhắn hiện tại của người dùng
    "systemInstruction" => [ // Hướng dẫn hệ thống (System Prompt) điều chỉnh tính cách, vai trò và giới hạn của AI
        "parts" => [
            ["text" => $systemInstruction] // Nội dung chỉ thị hệ thống dạng văn bản (text)
        ]
    ]
];

// Khởi tạo URL endpoint của Gemini API bản v1beta với model mới nhất gemini-3.5-flash và đính kèm API Key
$url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=" . $apiKey;

// Khởi tạo phiên làm việc cURL để thực hiện gửi request HTTP đến máy chủ Google
$ch = curl_init($url);

// Cấu hình cURL: Trả về kết quả dưới dạng chuỗi (string) thay vì xuất trực tiếp ra màn hình
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

// Cấu hình cURL: Thiết lập phương thức gửi request là POST
curl_setopt($ch, CURLOPT_POST, true);

// Cấu hình cURL: Chuyển payload mảng PHP thành chuỗi định dạng JSON và đính kèm vào body request
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));

// Cấu hình cURL: Thiết lập Header cho request là kiểu dữ liệu JSON (application/json)
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json'
]);

// Cấu hình cURL: Tắt kiểm tra chứng chỉ SSL của đối tác (Bắt buộc khi chạy local trên Windows/XAMPP để tránh lỗi SSL handshake)
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

// Cấu hình cURL: Tắt đối chiếu tên miền trong chứng chỉ SSL với tên miền máy chủ gọi tới để tránh bị cản trở kết nối
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

// Thực thi phiên cURL và nhận kết quả thô (JSON string) trả về từ Gemini API
$response = curl_exec($ch);

// Kiểm tra nếu cURL xảy ra lỗi kết nối mạng vật lý (ví dụ: DNS lỗi, sập mạng, không tìm thấy máy chủ)
if (curl_errno($ch)) {
    http_response_code(500); // Thiết lập HTTP status code là 500 (Internal Server Error)
    echo json_encode(["error" => curl_error($ch)]); // Trả về thông tin lỗi chi tiết của cURL dưới dạng JSON
    exit; // Dừng chương trình ngay lập tức
}

// Lấy mã phản hồi HTTP Status Code từ API (200 là thành công, 400/404/500 là lỗi cấu hình/API Key)
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

// Đóng kết nối cURL để giải phóng tài nguyên hệ thống tránh rò rỉ bộ nhớ
curl_close($ch);

// Xử lý khi API Google trả về mã lỗi phản hồi (khác 200)
if ($httpCode !== 200) {
    http_response_code($httpCode); // Đồng bộ mã lỗi HTTP của API về cho Client hiển thị
    $errorData = json_decode($response, true); // Giải mã JSON thông điệp lỗi nhận từ Google
    echo json_encode([
        "error" => $errorData['error']['message'] ?? "Error calling Gemini API", // Lấy câu báo lỗi chi tiết từ Google
        "raw_response" => $errorData // Đính kèm phản hồi thô của Google giúp nhà phát triển dễ dàng gỡ lỗi (debug)
    ]);
    exit; // Dừng chương trình
}

// Giải mã JSON kết quả thành công nhận được từ Gemini API thành mảng PHP
$resData = json_decode($response, true);

// Truy xuất văn bản câu trả lời của AI từ cấu trúc phản hồi nhiều cấp của Gemini API
// Cấu trúc mặc định của Google: candidates -> content -> parts -> text
$replyText = $resData['candidates'][0]['content']['parts'][0]['text'] ?? 'Xin lỗi, tôi gặp khó khăn khi xử lý yêu cầu của bạn.';

// Trả kết quả cuối cùng về cho ứng dụng Client (Frontend Javascript) dưới dạng JSON chuẩn
echo json_encode(["response" => $replyText]);
