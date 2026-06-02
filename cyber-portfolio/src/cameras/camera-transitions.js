// camera-transitions.js
import { TweenLite } from 'gsap';

class CameraTransitions {
    constructor(camera) {
        this.camera = camera;
    }

    // Transition to a new position and angle
    transitionTo(newPosition, newLookAt, duration = 1) {
        const { x, y, z } = this.camera.position;
        const { x: lookAtX, y: lookAtY, z: lookAtZ } = newLookAt;

        // Animate camera position
        TweenLite.to(this.camera.position, duration, {
            x: newPosition.x,
            y: newPosition.y,
            z: newPosition.z,
            onUpdate: () => {
                this.camera.lookAt(lookAtX, lookAtY, lookAtZ);
            }
        });
    }

    // Smoothly transition between two camera angles
    transitionBetweenAngles(startAngle, endAngle, duration = 1) {
        const angleDiff = endAngle - startAngle;

        TweenLite.to(this.camera.rotation, duration, {
            x: startAngle.x + angleDiff.x,
            y: startAngle.y + angleDiff.y,
            z: startAngle.z + angleDiff.z
        });
    }
}

export default CameraTransitions;