// src/scenes/timeline-workflow.js

import * as THREE from 'three';
import { TimelineController } from '../timeline/timeline-controller';
import { DepthOfFieldEffect } from '../effects/depth-of-field';
import { CinematicCamera } from '../cameras/cinematic-camera';
import { CameraTransitions } from '../cameras/camera-transitions';

let scene, camera, renderer, timelineController, depthOfFieldEffect;

function init() {
    // Tạo scene
    scene = new THREE.Scene();

    // Tạo camera với hiệu ứng điện ảnh
    camera = new CinematicCamera();
    camera.position.set(0, 1, 5);

    // Tạo renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Tạo hiệu ứng Depth of Field
    depthOfFieldEffect = new DepthOfFieldEffect(camera);
    scene.add(depthOfFieldEffect);

    // Khởi tạo Timeline Controller
    timelineController = new TimelineController(scene, camera);

    // Thêm ánh sáng
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Bắt đầu render
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize, false);

// Khởi tạo scene khi tài liệu đã sẵn sàng
document.addEventListener('DOMContentLoaded', init);