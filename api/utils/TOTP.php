<?php
namespace Utils;

class TOTP {
    private static $base32LookupTable = [
        'A' => 0,  'B' => 1,  'C' => 2,  'D' => 3,  'E' => 4,  'F' => 5,  'G' => 6,  'H' => 7,
        'I' => 8,  'J' => 9,  'K' => 10, 'L' => 11, 'M' => 12, 'N' => 13, 'O' => 14, 'P' => 15,
        'Q' => 16, 'R' => 17, 'S' => 18, 'T' => 19, 'U' => 20, 'V' => 21, 'W' => 22, 'X' => 23,
        'Y' => 24, 'Z' => 25, '2' => 26, '3' => 27, '4' => 28, '5' => 29, '6' => 30, '7' => 31
    ];

    /**
     * Xác minh mã OTP 6 số
     */
    public static function verifyCode($secret, $code, $discrepancy = 1) {
        $currentTime = floor(time() / 30);
        $code = str_replace(' ', '', $code); // Xóa khoảng trắng nếu có
        
        for ($i = -$discrepancy; $i <= $discrepancy; $i++) {
            $timeSlice = $currentTime + $i;
            if (self::calculateCode($secret, $timeSlice) === $code) {
                return true;
            }
        }
        return false;
    }

    /**
     * Tính toán mã OTP tại một mốc thời gian cụ thể
     */
    private static function calculateCode($secret, $timeSlice) {
        $secretKey = self::base32Decode($secret);
        
        // Pack time slice into 8-byte binary string (Big Endian)
        $timeBin = pack('N*', 0) . pack('N*', $timeSlice);
        
        // Hash hmac sha1
        $hash = hash_hmac('sha1', $timeBin, $secretKey, true);
        
        // Dynamic truncation (Cắt động 4 byte từ mã băm sha1)
        $offset = ord($hash[19]) & 0xf;
        $hashpart = substr($hash, $offset, 4);
        
        // Unpack value
        $value = unpack('N', $hashpart);
        $value = $value[1];
        $value = $value & 0x7fffffff;
        
        return str_pad($value % 1000000, 6, '0', STR_PAD_LEFT);
    }

    /**
     * Giải mã Base32 thành nhị phân
     */
    private static function base32Decode($secret) {
        $secret = strtoupper($secret);
        if (empty($secret)) return '';
        
        $secret = str_replace('=', '', $secret);
        $secretKey = '';
        $buffer = 0;
        $bufferSize = 0;
        
        for ($i = 0; $i < strlen($secret); $i++) {
            $char = $secret[$i];
            if (!isset(self::$base32LookupTable[$char])) {
                continue;
            }
            $val = self::$base32LookupTable[$char];
            $buffer = ($buffer << 5) | $val;
            $bufferSize += 5;
            
            if ($bufferSize >= 8) {
                $bufferSize -= 8;
                $secretKey .= chr(($buffer >> $bufferSize) & 0xff);
            }
        }
        return $secretKey;
    }

    /**
     * Sinh URL mã QR để quét trên điện thoại qua Google Authenticator
     */
    public static function getQRCodeUrl($username, $secret, $issuer = 'CyberPortfolio') {
        $url = 'otpauth://totp/' . rawurlencode($issuer) . ':' . rawurlencode($username) . '?secret=' . $secret . '&issuer=' . rawurlencode($issuer);
        return 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' . urlencode($url);
    }
}
