class CinematicCamera {
    constructor(fov, aspect, near, far) {
        this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this.camera.position.set(0, 1, 5);
        this.target = new THREE.Vector3(0, 1, 0);
        this.smoothness = 0.1; // Control the smoothness of camera movements
    }

    update() {
        // Smoothly interpolate camera position and rotation towards the target
        this.camera.position.lerp(this.target, this.smoothness);
        this.camera.lookAt(this.target);
    }

    setTarget(target) {
        this.target.copy(target);
    }

    setPosition(position) {
        this.camera.position.copy(position);
    }

    getCamera() {
        return this.camera;
    }
}

export default CinematicCamera;