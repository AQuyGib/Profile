// File: /cyber-portfolio/cyber-portfolio/src/effects/motion-blur.js

class MotionBlur {
    constructor(renderer) {
        this.renderer = renderer;
        this.effect = null;
        this.init();
    }

    init() {
        // Tạo hiệu ứng motion blur
        this.effect = new THREE.MotionBlurEffect(this.renderer);
        this.effect.setMotionBlur(0.5); // Thiết lập độ mạnh của hiệu ứng
    }

    apply(scene, camera) {
        // Áp dụng hiệu ứng motion blur cho cảnh
        this.effect.render(scene, camera);
    }

    dispose() {
        // Giải phóng tài nguyên khi không còn sử dụng
        this.effect.dispose();
    }
}

export default MotionBlur;