// File này cung cấp các hàm tiện ích hỗ trợ cho nhiều tác vụ trong dự án, chẳng hạn như tính toán hoặc thao tác dữ liệu.

export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

export function lerp(start, end, t) {
    return start + (end - start) * t;
}

export function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

export function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}

export function radiansToDegrees(radians) {
    return radians * (180 / Math.PI);
}

export function isPowerOfTwo(value) {
    return (value & (value - 1)) === 0 && value > 0;
}

export function createUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}