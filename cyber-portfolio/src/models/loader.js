// File này chứa các hàm để tải các mô hình 3D và tài sản vào các cảnh, đảm bảo chúng sẵn sàng để hiển thị.

import * as THREE from 'three';

class ModelLoader {
    constructor() {
        this.loader = new THREE.GLTFLoader();
        this.models = {};
    }

    loadModel(url, modelName) {
        return new Promise((resolve, reject) => {
            this.loader.load(url, (gltf) => {
                this.models[modelName] = gltf.scene;
                resolve(gltf.scene);
            }, undefined, (error) => {
                console.error(`Error loading model ${modelName}:`, error);
                reject(error);
            });
        });
    }

    getModel(modelName) {
        return this.models[modelName];
    }

    clearModels() {
        this.models = {};
    }
}

export default new ModelLoader();