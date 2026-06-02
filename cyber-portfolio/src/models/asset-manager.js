// File: src/models/asset-manager.js

class AssetManager {
    constructor() {
        this.assets = {
            models: {},
            textures: {},
            audio: {}
        };
    }

    loadModel(name, path) {
        return new Promise((resolve, reject) => {
            // Logic to load 3D model
            const loader = new THREE.GLTFLoader();
            loader.load(path, (gltf) => {
                this.assets.models[name] = gltf;
                resolve(gltf);
            }, undefined, (error) => {
                reject(`Error loading model ${name}: ${error}`);
            });
        });
    }

    loadTexture(name, path) {
        return new Promise((resolve, reject) => {
            const textureLoader = new THREE.TextureLoader();
            textureLoader.load(path, (texture) => {
                this.assets.textures[name] = texture;
                resolve(texture);
            }, undefined, (error) => {
                reject(`Error loading texture ${name}: ${error}`);
            });
        });
    }

    loadAudio(name, path) {
        return new Promise((resolve, reject) => {
            const audioLoader = new THREE.AudioLoader();
            audioLoader.load(path, (buffer) => {
                this.assets.audio[name] = buffer;
                resolve(buffer);
            }, undefined, (error) => {
                reject(`Error loading audio ${name}: ${error}`);
            });
        });
    }

    getModel(name) {
        return this.assets.models[name];
    }

    getTexture(name) {
        return this.assets.textures[name];
    }

    getAudio(name) {
        return this.assets.audio[name];
    }

    async loadAssets(assetList) {
        const promises = assetList.map(asset => {
            switch (asset.type) {
                case 'model':
                    return this.loadModel(asset.name, asset.path);
                case 'texture':
                    return this.loadTexture(asset.name, asset.path);
                case 'audio':
                    return this.loadAudio(asset.name, asset.path);
                default:
                    return Promise.reject(`Unknown asset type: ${asset.type}`);
            }
        });
        return Promise.all(promises);
    }
}

export default AssetManager;