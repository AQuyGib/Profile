// portal-zone.js
import * as THREE from 'three';
import { DepthOfField } from '../effects/depth-of-field';
import { CinematicCamera } from '../cameras/cinematic-camera';
import { SceneManager } from './scene-manager';
import { TimelineController } from '../timeline/timeline-controller';

class PortalZone {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new CinematicCamera();
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.depthOfField = new DepthOfField();
        this.timelineController = new TimelineController();
        
        this.init();
    }

    init() {
        this.setupRenderer();
        this.setupLighting();
        this.loadModels();
        this.setupDepthOfField();
        this.setupEventListeners();
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
        // Load portal models and add to scene
        // Example: this.modelLoader.load('path/to/portal/model', (model) => {
        //     this.scene.add(model);
        // });
    }

    setupDepthOfField() {
        this.depthOfField.init(this.camera);
        this.scene.add(this.depthOfField);
    }

    setupEventListeners() {
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.renderer.render(this.scene, this.camera);
        this.depthOfField.update();
    }
}

export default PortalZone;