// File: /cyber-portfolio/cyber-portfolio/src/scenes/cinema-studio.js

import * as THREE from 'three';
import { CinematicCamera } from '../cameras/cinematic-camera.js';
import { DepthOfFieldEffect } from '../effects/depth-of-field.js';
import { SceneManager } from './scene-manager.js';

class CinemaStudio {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new CinematicCamera();
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.depthOfFieldEffect = new DepthOfFieldEffect(this.camera);
        this.init();
    }

    init() {
        this.setupRenderer();
        this.setupLights();
        this.loadModels();
        this.setupEventListeners();
        this.animate();
    }

    setupRenderer() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 7.5);
        this.scene.add(directionalLight);
    }

    loadModels() {
        // Logic to load 3D models specific to the Cinema Studio
        // This could involve using a model loader to fetch and add models to the scene
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize(), false);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.depthOfFieldEffect.render(this.scene, this.camera);
        this.renderer.render(this.scene, this.camera);
    }
}

// Export the CinemaStudio class for use in other modules
export default CinemaStudio;