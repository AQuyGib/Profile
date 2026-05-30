<?php
namespace Utils;

/**
 * Lớp TOTP (Time-Based One-Time Password) tuân thủ tiêu chuẩn RFC 6238.
 * Dùng để tạo và xác thực mã OTP 6 chữ số thay đổi mỗi 30 giây phục vụ bảo mật đăng nhập 2FA.
 */
class TOTP {
    // Bảng tra cứu giải mã Base32 chuyển đổi ký tự chữ/số thành các giá trị nhị phân 5-bit (từ 0 đến 31)
    private static $base32LookupTable = [
        'A' => 0,  'B' => 1,  'C' => 2,  'D' => 3,  'E' => 4,  'F' => 5,  'G' => 6,  'H' => 7,
        'I' => 8,  'J' => 9,  'K' => 10, 'L' => 11, 'M' => 12, 'N' => 13, 'O' => 14, 'P' => 15,
        'Q' => 16, 'R' => 17, 'S' => 18, 'T' => 19, 'U' => 20, 'V' => 21, 'W' => 22, 'X' => 23,
        'Y' => 24, 'Z' => 25, '2' => 26, '3' => 27, '4' => 28, '5' => 29, '6' => 30, '7' => 31
    ];

    /**
     * Phương thức xác minh mã OTP 6 số do người dùng nhập vào.
     * @param string $secret Khóa bí mật dạng Base32
     * @param string $code Mã OTP 6 chữ số cần kiểm tra
     * @param int $discrepancy Độ lệch thời gian cho phép (1 có nghĩa là ±30 giây lệch so với giờ máy chủ)
     * @return bool True nếu mã khớp, False nếu không khớp
     */
    public static function verifyCode($secret, $code, $discrepancy = 1) {
        // Tính toán lát cắt thời gian hiện tại (mỗi lát cắt kéo dài 30 giây)
        $currentTime = floor(time() / 30);
        $code = str_replace(' ', '', $code); // Xóa bỏ khoảng trắng nếu người dùng gõ kiểu cách quãng
        
        // Quét khoảng sai số thời gian để tránh lỗi lệch giờ cục bộ giữa điện thoại người dùng và máy chủ
        for ($i = -$discrepancy; $i <= $discrepancy; $i++) {
            $timeSlice = $currentTime + $i;
            // Tính toán mã OTP tương ứng với lát cắt thời gian này
            if (self::calculateCode($secret, $timeSlice) === $code) {
                return true; // Mã khớp thành công
            }
        }
        return false; // Toàn bộ các mã trong khoảng sai số đều không khớp
    }

    /**
     * Phương thức tính toán mã OTP tại một mốc thời gian cụ thể (lát cắt thời gian)
     */
    private static function calculateCode($secret, $timeSlice) {
        // Giải mã khóa bí mật Base32 thành chuỗi nhị phân gốc
        $secretKey = self::base32Decode($secret);
        
        // Đóng gói mốc thời gian (lát cắt 30s) thành một chuỗi nhị phân 8 byte dạng Big Endian
        // Sử dụng pack('N*', ...) đóng gói số nguyên không dấu 32-bit
        $timeBin = pack('N*', 0) . pack('N*', $timeSlice);
        
        // Thực hiện băm HMAC-SHA1 chuỗi nhị phân thời gian bằng khóa bí mật nhị phân
        $hash = hash_hmac('sha1', $timeBin, $secretKey, true);
        
        // Thực hiện cắt động (Dynamic Truncation) dựa trên chuẩn RFC 4226:
        // Lấy 4 bit thấp của byte cuối cùng trong chuỗi băm 20 byte làm điểm lệch (offset)
        $offset = ord($hash[19]) & 0xf;
        // Trích xuất 4 byte từ vị trí lệch
        $hashpart = substr($hash, $offset, 4);
        
        // Giải nén 4 byte này thành một số nguyên không dấu 32-bit
        $value = unpack('N', $hashpart);
        $value = $value[1];
        
        // Loại bỏ bit dấu (MSB) bằng cách toán tử AND với giá trị 0x7fffffff (31 bit)
        $value = $value & 0x7fffffff;
        
        // Lấy 6 chữ số cuối (chia lấy dư cho 1,000,000) và bù số 0 vào bên trái nếu độ dài < 6
        return str_pad($value % 1000000, 6, '0', STR_PAD_LEFT);
    }

    /**
     * Hàm giải mã chuỗi Base32 thành dữ liệu nhị phân gốc.
     */
    private static function base32Decode($secret) {
        $secret = strtoupper($secret);
        if (empty($secret)) return '';
        
        // Loại bỏ các ký tự đệm "=" ở cuối chuỗi Base32 nếu có
        $secret = str_replace('=', '', $secret);
        $secretKey = '';
        $buffer = 0;
        $bufferSize = 0;
        
        // Quét từng ký tự của chuỗi bí mật
        for ($i = 0; $i < strlen($secret); $i++) {
            $char = $secret[$i];
            // Bỏ qua nếu ký tự không nằm trong bảng tra cứu
            if (!isset(self::$base32LookupTable[$char])) {
                continue;
            }
            $val = self::$base32LookupTable[$char];
            
            // Đẩy buffer sang trái 5 bit và chèn giá trị 5-bit mới vào
            $buffer = ($buffer << 5) | $val;
            $bufferSize += 5;
            
            // Khi buffer tích lũy đủ từ 8 bit trở lên (1 byte)
            if ($bufferSize >= 8) {
                $bufferSize -= 8;
                // Trích xuất 8 bit cao nhất làm ký tự nhị phân và đưa vào chuỗi kết quả
                $secretKey .= chr(($buffer >> $bufferSize) & 0xff);
            }
        }
        return $secretKey;
    }

    /**
     * Sinh URL mã QR để quét tích hợp ứng dụng Google Authenticator trên điện thoại
     * @param string $username Tên tài khoản hiển thị (ví dụ: email hoặc admin)
     * @param string $secret Khóa bí mật Base32
     * @param string $issuer Tên tổ chức phát hành
     * @return string URL tạo mã QR động
     */
    public static function getQRCodeUrl($username, $secret, $issuer = 'CyberPortfolio') {
        // Cú pháp URI chuẩn của Google Authenticator: otpauth://totp/{Issuer}:{Username}?secret={Secret}&issuer={Issuer}
        $url = 'otpauth://totp/' . rawurlencode($issuer) . ':' . rawurlencode($username) . '?secret=' . $secret . '&issuer=' . rawurlencode($issuer);
        // Sử dụng dịch vụ miễn phí qrserver để render URL thành hình ảnh mã QR tiện quét bằng camera điện thoại
        return 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' . urlencode($url);
    }
}
