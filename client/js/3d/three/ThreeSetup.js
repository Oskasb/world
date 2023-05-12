class ThreeSetup {

    constructor() {

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.reflectionScene = null;

        this.addedObjects = 0;

        this.initTime = 0;

        this.prerenderCallbacks = [];
        this.postrenderCallbacks = [];
        this.tpf = 0;
        this.lastTime = 0;
        this.idle = 0;
        this.renderStart = 0;
        this.renderEnd = 0;
        this.lookAt = new THREE.Vector3();
        this.vector = new THREE.Vector3();
        this.tempObj = new THREE.Object3D();

        this.avgTfp = 0.1;

        this.sphere = new THREE.Sphere();
        this.frustum = new THREE.Frustum();
        this.frustumMatrix = new THREE.Matrix4();

    }

    callPrerender = function(frame) {
        //    requestAnimationFrame( ThreeSetup.callPrerender );

        let time = frame.systemTime;
        this.tpf = time - this.lastTime;

        //    if (tpf < 0.03) return;

        this.idle = (performance.now() / 1000) - this.renderEnd;

        PipelineAPI.setCategoryKeyValue('STATUS', 'TIME_ANIM_IDLE', this.idle);

        this.lastTime = time;

        this.avgTfp = this.tpf // *0.3 + this.avgTfp*0.7;

        for (let i = 0; i < this.prerenderCallbacks.length; i++) {
            this.prerenderCallbacks[i](this.avgTfp);
        }

        if (this.camera) {
            this.callRender(this.scene, this.camera);
        }


    };

    callRender = function(scn, cam) {
    //    this.renderStart = performance.now()/1000;
        this.renderer.render(scn, cam);
     //   this.renderEnd = performance.now()/1000;
        this.callPostrender();
    };

    callPostrender = function() {

    //    PipelineAPI.setCategoryKeyValue('STATUS', 'TIME_ANIM_RENDER', this.renderEnd - this.renderStart);
        for (let i = 0; i < this.postrenderCallbacks.length; i++) {
            this.postrenderCallbacks[i](this.avgTfp);
        }

    };


    getTotalRenderTime = function() {
        return this.renderEnd;
    };

    initThreeRenderer = function(pxRatio, antialias, containerElement, store) {

            let scene = new THREE.Scene();
            let reflectionScene = new THREE.Scene();
        //    let camera = new THREE.PerspectiveCamera( 75, containerElement.innerWidth / containerElement.innerHeight, 0.1, 1000 );
        //    camera.matrixWorldAutoUpdate = false;
            scene.matrixWorldAutoUpdate = false;
            //     console.log("Three Camera:", camera);
           let renderer = new THREE.WebGLRenderer( { antialias:antialias, devicePixelRatio: pxRatio, logarithmicDepthBuffer: false, sortObjects: false });
        //    let renderer = new THREE.WebGLRenderer();
        //    renderer.setPixelRatio( pxRatio );
            renderer.setSize( window.innerWidth, window.innerHeight );
        //    renderer.toneMapping = THREE.LinearToneMapping;
            store.scene = scene;
            store.reflectionScene = reflectionScene;
        //    store.camera = camera;
            store.renderer = renderer;

            this.scene = scene;
        //    this.camera = camera;
            this.renderer = renderer;

        // document.body.appendChild( renderer.domElement );
        PipelineAPI.setCategoryKeyValue('SYSTEM', 'SCENE', scene);
        PipelineAPI.setCategoryKeyValue('SYSTEM', 'RENDERER', renderer);
            containerElement.appendChild(renderer.domElement);
       //         console.log("initThreeRenderer", store);

        return store;
    };

    addPrerenderCallback = function(callback) {
        this.prerenderCallbacks.push(callback);
    };

    removePrerenderCallback = function(callback) {
        this.prerenderCallbacks.splice(prerenderCallbacks.lastIndexOf(callback, 1));
    };

    addPostrenderCallback = function(callback) {
        if (this.postrenderCallbacks.indexOf(callback) === -1) {
            this.postrenderCallbacks.push(callback);
        }
    };

    removePostrenderCallback = function(callback) {
        this.postrenderCallbacks.splice(this.postrenderCallbacks.lastIndexOf(callback, 1));
    };



    toScreenPosition = function(vec3, store) {

        this.tempObj.position.copy(vec3);

        if (!this.frustum.containsPoint(this.tempObj.position)) {

            store.x = -1;
            store.y = -1;
            store.z = -100000;

            return store;// Do something with the position...
        }

        //    tempObj.updateMatrixWorld();
        this.tempObj.getWorldPosition(this.vector)
        this.vector.project(this.camera);


        store.x = this.vector.x * 0.83 *0.5;
        store.y = this.vector.y * 0.5 * 0.83;
        store.z = this.vector.z * 0;



     //   GameScreen.fitView(store);

        return store;
    };



    cameraTestXYZRadius = function(vec3, radius) {
        this.sphere.center.copy(vec3);
        this.sphere.radius = radius;
        return this.frustum.intersectsSphere(this.sphere);
    };

    calcDistanceToCamera = function(vec3) {
        this.vector.copy(vec3);
        return this.vector.distanceTo(this.camera.position);
    };


    sampleCameraFrustum = function(store) {

    };

    setCamera = function(camera) {
        this.camera = camera;
    };

    setCameraPosition = function(px, py, pz) {
        this.camera.position.x = px;
        this.camera.position.y = py;
        this.camera.position.z = pz;
    };

    setCameraLookAt = function(x, y, z) {
        this.lookAt.set(x, y, z);
        this.camera.up.set(0, 1, 0);
        this.camera.lookAt(this.lookAt)
    };

    getCameraLookAt = function() {
        return this.lookAt;
    };

    updateCameraMatrix = function() {

        //    camera.updateProjectionMatrix();

        this.camera.updateMatrixWorld(true);
        this.frustum.setFromProjectionMatrix(this.frustumMatrix.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse));
        this.camera.needsUpdate = true;

        for (let i = 0; i < this.camera.children.length; i++) {
            this.camera.children[i].updateMatrixWorld(true);
        }

    };


    addChildToParent = function(child, parent) {
        if (child.parent) {
            child.parent.remove(child);
        }
        parent.add(child);
    };

    addToScene = function(object3d) {
        this.scene.add(object3d);
        return object3d;
    };

    getCamera = function() {
        return this.camera;
    };

    removeModelFromScene = function(model) {
        if (model.parent) {
            model.parent.remove(model);
        }

        this.scene.remove(model);
    };

    setRenderParams = function(width, height, aspect, pxRatio) {
        this.renderer.setSize( width, height);
        this.renderer.setPixelRatio( pxRatio );
        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();
    };

    attachPrerenderCallback = function(callback) {
        if (this.prerenderCallbacks.indexOf(callback) != -1) {
            console.log("Callback already installed");
            return;
        }
        this.prerenderCallbacks.push(callback);
    };
    removePrerenderCallback = function(callback) {
        MATH.quickSplice(this.prerenderCallbacks, callback);
    };


    getSceneChildrenCount = function() {
        return this.scene.children.length;
    };



    getInfoFromRenderer = function(source, key) {
        if (!key) return this.renderer.info[source];
        return this.renderer.info[source][key];
    };

}

export { ThreeSetup }