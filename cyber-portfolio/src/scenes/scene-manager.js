// src/scenes/scene-manager.js

import { DeskSetup } from './desk-setup.js';
import { CinemaStudio } from './cinema-studio.js';
import { TimelineWorkflow } from './timeline-workflow.js';
import { PortalZone } from './portal-zone.js';
import { CinematicCamera } from '../cameras/cinematic-camera.js';
import { DepthOfField } from '../effects/depth-of-field.js';
import { CameraTransitions } from '../cameras/camera-transitions.js';

class SceneManager {
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.currentScene = null;
        this.scenes = {
            deskSetup: new DeskSetup(this.scene, this.camera),
            cinemaStudio: new CinemaStudio(this.scene, this.camera),
            timelineWorkflow: new TimelineWorkflow(this.scene, this.camera),
            portalZone: new PortalZone(this.scene, this.camera),
        };
        this.cameraTransitions = new CameraTransitions(this.camera);
        this.depthOfField = new DepthOfField(this.renderer);
    }

    loadScene(sceneName) {
        if (this.currentScene) {
            this.currentScene.unload();
        }
        this.currentScene = this.scenes[sceneName];
        this.currentScene.load();
        this.applyDepthOfField();
        this.setupCameraTransitions();
    }

    applyDepthOfField() {
        this.depthOfField.enable();
    }

    setupCameraTransitions() {
        this.cameraTransitions.setupTransitions();
    }

    render() {
        if (this.currentScene) {
            this.currentScene.update();
            this.renderer.render(this.scene, this.camera);
        }
    }
}

export { SceneManager };