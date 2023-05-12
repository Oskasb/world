import {ThreeAsset} from './assets/ThreeAsset.js';
import {ThreeSetup} from './ThreeSetup.js';
import {ThreeEnvironment} from './ThreeEnvironment.js';
import {ThreeShaderBuilder} from './ThreeShaderBuilder.js';
import {ThreeModelLoader} from './ThreeModelLoader.js';
import {ThreeTextureMaker} from './ThreeTextureMaker.js';
import {ThreeMaterialMaker} from './ThreeMaterialMaker.js';
import {ThreeSpatialFunctions} from './ThreeSpatialFunctions.js';


class ThreeAPI {

    constructor() {

        this.threeEnvironment = new ThreeEnvironment();
        this.threeSetup = new ThreeSetup();
        this.threeTextureMaker = new ThreeTextureMaker();
        this.threeMaterialMaker = new ThreeMaterialMaker();
        this.threeModelLoader = new ThreeModelLoader();
        this.shaderBuilder = new ThreeShaderBuilder();
        this.glContext;
        this.renderer;
        this.camera;
        this.scene;
        this.reflectionScene;
        this.spatialFunctions;
        this.effectCallbacks;
        this.renderFilter;
        this.assetLoader;
        this.globalUniforms = {};
        this.animationMixers = [];
        this.frameRegs = 0;

        this.dynamicGlobalUnifs = {};
        this.tempVec3 = new THREE.Vector3();
        this.tempVec3b = new THREE.Vector3();
        this.tempVec3c = new THREE.Vector3();
        this.tempVec4 = new THREE.Vector4();
        this.tempObj = new THREE.Object3D();
    }
    initThreeLoaders = function(assetLoader) {
        this.spatialFunctions = new ThreeSpatialFunctions();
        this.assetLoader = assetLoader;
    };

    initEnvironment = function(store) {

        let _this = this;
        var envReady = function() {
            _this.threeEnvironment.enableEnvironment(_this.threeEnvironment);
            _this.getSetup().addPostrenderCallback(_this.threeEnvironment.tickEnvironment);
        };

        var onLoaded = function() {
            _this.threeEnvironment.initEnvironment(store, envReady);
        };

        this.threeEnvironment.loadEnvironmentData(onLoaded);

    };

    initThreeScene = function(containerElement, pxRatio, antialias) {
        let store = {};
        store = this.threeSetup.initThreeRenderer(pxRatio, antialias, containerElement, store);
        this.scene = store.scene;
        this.renderer = store.renderer;
        this.reflectionScene = store.reflectionScene;

        const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.3, 11000 );
        this.setCamera(camera);
        PipelineAPI.setCategoryKeyValue('SYSTEM', 'CAMERA', camera);
        store.camera = camera;
        camera.matrixWorldAutoUpdate = false;

        this.initEnvironment(store);
        this.glContext = store.renderer.getContext();

        this.threeSetup.addPrerenderCallback(this.threeModelLoader.updateActiveMixers);

        this.threeSetup.addToScene(this.threeSetup.getCamera());

        this.shaderBuilder.loadShaderData(this.glContext);
    };

    updateSceneMatrixWorld = function() {
        this.scene.updateMatrixWorld();
    };

    addPrerenderCallback = function(callback) {
        this.threeSetup.addPrerenderCallback(callback);
    };

    addPostrenderCallback = function(callback) {
        this.threeSetup.addPostrenderCallback(callback);
    };

    loadThreeModels = function(TAPI) {
        this.threeModelLoader.loadData();
    };

    loadThreeData = function(TAPI) {
    //    this.threeModelLoader.loadData();
    //    this.threeModelLoader.loadTerrainData(TAPI);
    //    this.threeTextureMaker.loadTextures();
    //    this.threeMaterialMaker.loadMaterialist();
    };


    buildAsset = function(assetId, callback) {
    //    console.log('Three API build asset:', assetId);
        new ThreeAsset(assetId, callback);
    };

    loadThreeAsset = function(assetType, assetId, callback) {
        this.assetLoader.loadAsset(assetType, assetId, callback);
    };

    getTimeElapsed = function() {
        return this.threeSetup.getTotalRenderTime();
    };

    getSetup = function() {
        return this.threeSetup;
    };

    getContext = function() {
        return glContext;
    };

    setEffectCallbacks = function(callbacks) {
        effectCallbacks = callbacks;
    };

    getEffectCallbacks = function() {
        return effectCallbacks;
    };

    getSpatialFunctions = function() {
        return spatialFunctions;
    };

    readEnvironmentUniform = function(worldProperty, key) {
        return this.threeEnvironment.readDynamicValue(worldProperty, key);
    };

    getEnvironment = function() {
        return this.threeEnvironment;
    };

    getModelLoader = function() {
        return this.threeModelLoader;
    };

    getCamera = function() {
        return this.camera;
    };

    getScene = function() {
        return this.scene;
    };

    getReflectionScene = function() {
        return this.reflectionScene;
    };

    getRenderer = function() {
        return this.renderer;
    };

    plantVegetationAt = function(pos, normalStore) {
        return this.threeModelLoader.terrainVegetationAt(pos, normalStore);
    };

    setYbyTerrainHeightAt = function(pos, normalStore) {
        return this.threeModelLoader.getHeightFromTerrainAt(pos, normalStore);
    };

    updateWindowParameters = function(width, height, aspect, pxRatio) {
    //    console.log(width, height, aspect, pxRatio)
        this.threeSetup.setRenderParams(width, height, aspect, pxRatio);

    };

    registerPrerenderCallback = function(callback) {
        this.threeSetup.attachPrerenderCallback(callback);
    };

    unregisterPrerenderCallback = function(callback) {
        this.threeSetup.removePrerenderCallback(callback);
    };

    sampleFrustum = function(store) {
        this.threeSetup.sampleCameraFrustum(store);
    };

    addAmbientLight = function() {

    };

    setCamera = function(camera) {
        this.camera = camera;
        this.threeSetup.setCamera(camera);
    };

    setCameraPos = function(x, y, z) {
        this.threeSetup.setCameraPosition(x, y, z);
    };

    cameraLookAt = function(x, y, z) {
        this.threeSetup.setCameraLookAt(x, y, z);
    };

    copyCameraLookAt = function(store) {
        store.copy(this.threeSetup.lookAt);
    };

    updateCamera = function() {
        this.threeSetup.updateCameraMatrix();
    };

    toScreenPosition = function(vec3, store) {
        this.threeSetup.toScreenPosition(vec3, store);
    };

    checkVolumeObjectVisible = function(vec3, radius) {
        return this.threeSetup.cameraTestXYZRadius(vec3, radius);
    };

    distanceToCamera = function(vec3) {
        return this.threeSetup.calcDistanceToCamera(vec3);
    };

    newCanvasTexture = function(canvas) {
        return this.threeTextureMaker.createCanvasTexture(canvas);
    };

    buildCanvasHudMaterial = function(canvasTexture) {
        return this.threeMaterialMaker.createCanvasHudMaterial(canvasTexture);
    };

    buildCanvasMaterial = function(canvasTexture) {
        return this.threeMaterialMaker.createCanvasMaterial(canvasTexture);
    };

    buildCanvasObject = function(model, canvas, store) {
        var tx = this.newCanvasTexture(canvas);
        var mat = this.threeMaterialMaker.createCanvasHudMaterial(tx);
        this.threeModelLoader.applyMaterialToMesh(mat, model);
        store.texture = tx;
        store.materia = mat;
        return store;
    };

    attachObjectToCamera = function(object) {
        //   ThreeSetup.addToScene(ThreeSetup.getCamera());
        this.threeSetup.addChildToParent(object, this.threeSetup.getCamera());
    };

    applySpatialToModel = function(spatial, model) {
        if (!model) return;
        this.transformModel(model, spatial.posX(), spatial.posY(), spatial.posZ(), spatial.pitch(), spatial.yaw(), spatial.roll())
    };

    transformModel = function(model, px, py, pz, rx, ry, rz) {
        model.position.set(px, py, pz);
        model.rotation.set(rx, ry, rz, 'ZYX');
    };

    addToScene = function(threeObject) {
        this.threeSetup.addToScene(threeObject);
    };

    createRootObject = function() {
        return this.threeModelLoader.createObject3D();
    };

    removeChildrenFrom = function(object) {
        while (object.children.length) {
            this.removeModel(object.children.pop());
        }
    };

    loadMeshModel = function(modelId, rootObject, partsReady) {
        return this.threeModelLoader.loadThreeMeshModel(modelId, rootObject, this.threeSetup, partsReady);
    };

    attachInstancedModel = function(modelId, rootObject) {
        return this.threeModelLoader.attachInstancedModelTo3DObject(modelId, rootObject, this.threeSetup);
    };

    loadModel = function(sx, sy, sz, partsReady) {
        return this.threeModelLoader.loadThreeModel(sx, sy, sz, partsReady);
    };

    loadDebugBox = function(sx, sy, sz, colorName) {
        return this.threeModelLoader.loadThreeDebugBox(sx, sy, sz, colorName);
    };

    loadQuad = function(sx, sy) {
        var model = this.threeModelLoader.loadThreeQuad(sx, sy);
        return this.threeSetup.addToScene(model);
    };

    loadGround = function(applies, array1d, rootObject, partsReady) {
        return this.threeModelLoader.loadGroundMesh(applies, array1d, rootObject, this.threeSetup, partsReady);
    };

    buildTerrainFromBuffers = function(buffers, x, y, z) {

        var bufferGeo = new THREE.BufferGeometry();
        var train = new THREE.Object3D();

        var matReady=function(mat, value) {
            console.log("Mat Ready", mat, value)
            var mesh = new THREE.Mesh( bufferGeo, value.mat);
            train.add(mesh);

            //    var bufferGeo = train.children[0].geometry;
//
            //    bufferGeo.attributes.position.array = buffers[0];
            //  //    bufferGeo.attributes.normal.array = buffers[1];
            //    bufferGeo.attributes.color.array = buffers[2];
            //    bufferGeo.attributes.uv.array = buffers[3];

            bufferGeo.setAttribute( 'position', new THREE.Float32BufferAttribute( buffers[0], 3 ) );
            bufferGeo.setAttribute( 'normal', new THREE.Float32BufferAttribute( buffers[1], 3 ) );
            bufferGeo.setAttribute( 'color', new THREE.Float32BufferAttribute(  buffers[2], 3 ) );
            bufferGeo.setAttribute( 'uv', new THREE.Float32BufferAttribute(  buffers[3], 2 ) );


            bufferGeo.needsUpdate = true;

            //    */
            train.rotateX(-Math.PI/2);
            this.threeSetup.addToScene(train);
        };

        console.log("Load Terrain Mat");
        assetLoader.loadAsset('MATERIALS_', 'material_terrain', matReady);

        return train;
    };

    removeTerrainByPosition = function(pos) {
        return this.threeModelLoader.removeGroundMesh(pos);
    };

    addChildToObject3D = function(child, parent) {
        this.threeSetup.addChildToParent(child, parent);
    };

    animateModelTexture = function(model, z, y, cumulative) {
        ThreeFeedbackFunctions.applyModelTextureTranslation(model, z, y, cumulative)
    };

    setObjectVisibility = function(object3d, bool) {
        object3d.visible = bool;
    };

    showModel = function(obj3d) {
        this.threeSetup.addToScene(obj3d);
    };

    bindDynamicStandardGeometry = function(modelId, dynamicBuffer) {

        console.log("bindDynamicStandardGeometry", modelId, dynamicBuffer);

    };


    hideModel = function(obj3d) {
        this.threeSetup.removeModelFromScene(obj3d);
    };

    removeModel = function(model) {

//            ThreeSetup.removeModelFromScene(model);
        this.threeModelLoader.returnModelToPool(model);
    };

    disposeModel = function(model) {

        this.threeSetup.removeModelFromScene(model);
        this.threeModelLoader.disposeHierarchy(model);
    };

    countAddedSceneModels = function() {
        return this.threeSetup.getSceneChildrenCount();
    };

    sampleRenderInfo = function(source, key) {
        return this.threeSetup.getInfoFromRenderer(source, key);
    };

    countPooledModels = function() {
        return this.threeModelLoader.getPooledModelCount();
    };

    activateMixer = function(mixer) {
        if (this.animationMixers.indexOf(mixer) === -1) {
            this.animationMixers.push(mixer);
        }
    };

    deActivateMixer = function(mixer) {
        MATH.quickSplice(this.animationMixers, mixer);
    };


    updateAnimationMixers = function(tpf) {
        for (let mx = 0; mx < this.animationMixers.length; mx ++) {
            this.animationMixers[mx].update(tpf);
        }
    };

    getGlobalUniforms = function() {
        return this.globalUniforms;
    };

    getGlobalUniform = function(key) {
        if (!this.globalUniforms[key]) {
            this.globalUniforms[key] = {value:{}}
        }
        return this.globalUniforms[key];
    };


    setGlobalUniform = function(uniformKey, values) {

        if (!this.globalUniforms[uniformKey]) {
            this.globalUniforms[uniformKey] = {value:{}};
        }

        if (typeof (values) === 'number') {
            this.globalUniforms[uniformKey].value = values;
        } else {
            for (let val in values) {
                this.globalUniforms[uniformKey].value[val] = values[val];
            }


        }
    };



    registerDynamicGlobalUniform = function(uniformKey, values) {

        if (this.frameRegs < 5) {
            let key = uniformKey+this.frameRegs;

            if (!this.dynamicGlobalUnifs[key]) {
                this.dynamicGlobalUnifs[key] = {value:{}}
            }

            for (let val in values) {
                this.dynamicGlobalUnifs[key].value[val] = values[val];
            }

            this.frameRegs++
        }

    };

    applyDynamicGlobalUniforms = function() {

        for (let val in ThreeAPI.dynamicGlobalUnifs) {
            ThreeAPI.setGlobalUniform(val, ThreeAPI.dynamicGlobalUnifs[val].value)
        }

        this.frameRegs = 0;
    };


    toRgb = function(r, g, b) {
        return 'rgb('+Math.floor(r*255)+','+Math.floor(g*255)+','+Math.floor(b*255)+')';
    };


    requestFrameRender = function(frame) {
        this.threeSetup.callPrerender(frame);
    };

}

export { ThreeAPI }
