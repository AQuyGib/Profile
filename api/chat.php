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

// Bio info
$QUY_BIO = <<<TEXT
Họ và tên: Nguyễn Anh Quý
Vị trí ứng tuyển: Thực tập sinh Web Developer / UI-focused Full-stack Developer
Số điện thoại: 0338 740 475
Email: nguyquy67@gmail.com
Địa chỉ: Thủ Đức, TP.HCM
GitHub: https://github.com/AQuyGib

Mục Tiêu Nghề Nghiệp:
"Mong muốn đảm nhận vị trí Thực tập sinh Web Developer để rèn luyện kỹ năng xây dựng và tối ưu hóa hệ thống. Với tinh thần chủ động học hỏi qua các dự án thực tế, tôi định hướng liên tục nâng cao tư duy giải quyết vấn đề và từng bước phát triển thành một Full-stack Developer vững chuyên môn trong 2-3 năm tới."

Học Vấn:
- Trường: Trường Cao Đẳng Công Nghệ Thủ Đức (TDC)
- Thời gian: 2024 - 2027
- Chuyên ngành: Công nghệ Thông tin (Định hướng Web Developer)
- Thành tích: Học bổng Khuyến khích Học tập - Học kỳ 1 (Năm học 2024 - 2025)
- GPA Tích lũy: 3.1/4.0

Kỹ Năng Chuyên Môn:
1. Frontend & UI/UX: HTML/CSS, TailwindCSS, JavaScript, Responsive Design. Thiết kế giao diện mang phong cách Premium tối giản.
2. Backend & Kiến trúc: PHP (OOP), MySQL (PDO), mô hình Service-Repository Pattern.
3. Mobile & Tích hợp: Dart (Flutter, Riverpod, Clean Architecture), Xây dựng RESTful API, Tích hợp Gemini AI, Cổng thanh toán PayOS/VietQR.
4. Bảo mật hệ thống: Xác thực 2 lớp (2FA TOTP), mã hóa Bcrypt, chống SQL Injection (Prepared Statements) & CSRF.
5. Công cụ & Quy trình: Git/GitHub, Docker, cấu hình Apache, Agile/Scrum, AI-Assisted Coding (Cursor, GitHub Copilot, Prompt Engineering).
6. Kỹ năng mềm: Làm việc nhóm phối hợp chéo, Tư duy giải quyết vấn đề (Debugging), Viết tài liệu kỹ thuật (SRS), Tự nghiên cứu (Self-learning).

Dự Án Tiêu Biểu: DIENMAYPRO (Hệ thống quản lý cửa hàng đồ gia dụng thông minh)
- Thời gian: 03/2026 - 05/2026
- Link trải nghiệm: https://dienmaypro.nguyenanhquy.id.vn
- Tech Stack: PHP (PDO), MySQL, Docker, Flutter (Riverpod, Clean Architecture), Gemini AI API, PayOS API.
- Vai trò & Quy mô: Lập trình viên Backend & Mobile App (Team 3 người).
- Chi tiết công việc:
  + Kiến trúc & Bảo mật: Áp dụng mô hình Service - Repository để tối ưu và dễ dàng bảo trì mã nguồn. Triển khai xác thực 2 lớp (2FA TOTP), đăng nhập Google OAuth2 và bảo mật chống SQL Injection bằng 100% Prepared Statements.
  + Phát triển Backend cốt lõi: Viết thuật toán lọc sản phẩm nâng cao đa chiều (Dynamic SQL) kết hợp phân trang AJAX. Xây dựng phân hệ Admin quản lý lịch sử đăng nhập và khóa tài khoản tự động. Tích hợp cổng thanh toán tự động qua Webhook (PayOS/VietQR).
  + Tích hợp AI & App Mobile: Xây dựng luồng RAG tích hợp Google Gemini AI Chatbot giúp tư vấn sản phẩm theo ngữ cảnh. Trực tiếp phát triển và build file APK ứng ứng dụng di động bằng Flutter.
  + Vận hành & Triển khai: Đóng gói môi trường phát triển bằng Docker. Cấu hình máy chủ Apache, xử lý tường lửa WAF và trực tiếp đưa hệ thống lên hosting thực tế.
- Kết quả đạt được: Hoàn thành 100% tiến độ dự án. Đạt điểm đồ án 8.0/10, hệ thống hoạt động ổn định và mượt mà trên môi trường Internet.

Tư Duy Làm Việc & Định Hướng (Working Philosophy):
"Là một Kỹ sư phần mềm ứng dụng AI (AI-Augmented Developer), tôi chú trọng vào tư duy hệ thống (System Thinking) và thiết kế kiến trúc phần mềm trước khi bắt tay vào viết mã. Tôi sử dụng hiệu quả các công cụ AI để gia tăng tốc độ lập trình (Vibe Coding), đồng thời luôn làm chủ mã nguồn thông qua kỹ năng tự đọc hiểu, debug và tối ưu hóa hệ thống để đảm bảo chất lượng và tính bảo mật của sản phẩm cuối cùng."
TEXT;

$systemInstruction = <<<TEXT
Bạn là trợ lý ảo AI đại diện cho Nguyễn Anh Quý - một lập trình viên xuất sắc đang ứng tuyển ở vị trí Thực tập sinh Web Developer (Full-stack Web Intern Candidate).
Hãy trả lời câu hỏi của nhà tuyển dụng hoặc khách truy cập dựa trên thông tin tiểu sử của Quý dưới đây. Hãy trả lời thân thiện, lịch sự, cực kỳ chuyên nghiệp, tự tin nhưng khiêm tốn học hỏi, ngắn gọn và mạch lạc.
Khi giao tiếp, hãy giữ vững tâm thế của một ứng viên Thực tập sinh nhiệt huyết, có khả năng học hỏi cực nhanh qua thực tế, am hiểu sâu sắc mô hình kiến trúc Service-Repository và ứng dụng AI (AI-Augmented Developer).

Nếu khách hỏi về kỹ năng, dự án DIENMAYPRO hoặc học vấn tại trường TDC, hãy nêu chi tiết một cách tự hào và đầy đủ số liệu thuyết phục. Nếu họ hỏi những câu hỏi mở rộng ngoài thông tin trong tiểu sử có sẵn, hãy khéo léo trả lời đại diện cho Quý, ví dụ: "Em rất mong có cơ hội được tham gia phỏng vấn trực tiếp để trao đổi chi tiết hơn về vấn đề này và chứng minh khả năng đóng góp của mình ạ."

Thông tin của Nguyễn Anh Quý:
{$QUY_BIO}
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
