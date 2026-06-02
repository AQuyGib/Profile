// File này chứa các hàm theo dõi và tối ưu hóa hiệu suất, đảm bảo việc render và tương tác diễn ra mượt mà.

export const PerformanceMonitor = {
    startTime: performance.now(),
    frameCount: 0,
    fps: 0,

    update: function() {
        this.frameCount++;
        const currentTime = performance.now();
        const elapsedTime = currentTime - this.startTime;

        if (elapsedTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.startTime = currentTime;
        }
    },

    getFPS: function() {
        return this.fps;
    },

    logPerformance: function() {
        console.log(`Current FPS: ${this.getFPS()}`);
    }
};

// Hàm khởi tạo theo dõi hiệu suất
export function initPerformanceMonitoring() {
    requestAnimationFrame(function monitor() {
        PerformanceMonitor.update();
        PerformanceMonitor.logPerformance();
        requestAnimationFrame(monitor);
    });
}