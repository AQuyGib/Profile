// src/scenes/desk-setup.js

import * as THREE from 'three';
import { DepthOfField } from '../effects/depth-of-field';
import { CinematicCamera } from '../cameras/cinematic-camera';
import { SceneManager } from './scene-manager';
import { TimelineController } from '../timeline/timeline-controller';
import { AssetManager } from '../models/asset-manager';

class DeskSetup {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new CinematicCamera();
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.assetManager = new AssetManager();
        this.timelineController = new TimelineController();
        this.depthOfField = new DepthOfField();
        
        this.init();
    }

    init() {
        this.setupRenderer();
        this.setupLighting();
        this.loadModels();
        this.setupInteractions();
        this.setupPostProcessing();
        this.animate();
    }

    setupRenderer() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 7.5);
        this.scene.add(directionalLight);
    }

    loadModels() {
        this.assetManager.loadModel('desk', 'models/desk-setup/desk.glb', (model) => {
            this.scene.add(model);
        });
        // Load other models as needed
    }

    setupInteractions() {
        // Add event listeners for user interactions
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    setupPostProcessing() {
        this.depthOfField.apply(this.renderer, this.scene, this.camera);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.renderer.render(this.scene, this.camera);
    }
}

export default DeskSetup;