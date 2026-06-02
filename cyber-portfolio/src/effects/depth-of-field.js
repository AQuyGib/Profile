// File này chứa logic cho hiệu ứng độ sâu trường ảnh (Depth of Field) trong các cảnh 3D, cho phép tạo ra sự tập trung chọn lọc để nâng cao trải nghiệm người dùng.

import * as THREE from 'three';

class DepthOfField {
    constructor(camera, scene) {
        this.camera = camera;
        this.scene = scene;
        this.effect = null;
        this.init();
    }

    init() {
        const params = {
            focus: 1.0,
            aperture: 0.025,
            maxBlur: 1.0
        };

        const bokehPass = new THREE.BokehPass(this.scene, this.camera, {
            focus: params.focus,
            aperture: params.aperture,
            maxBlur: params.maxBlur,
            width: window.innerWidth,
            height: window.innerHeight
        });

        this.effect = bokehPass;
    }

    update() {
        if (this.effect) {
            this.effect.render();
        }
    }

    setFocus(value) {
        if (this.effect) {
            this.effect.focus = value;
        }
    }

    setAperture(value) {
        if (this.effect) {
            this.effect.aperture = value;
        }
    }

    setMaxBlur(value) {
        if (this.effect) {
            this.effect.maxBlur = value;
        }
    }
}

export default DepthOfField;