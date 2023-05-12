class DynamicMain {
    constructor() {

    this.assets = {};
    this.assetIndex = {};
    this.instances = [];
    this.loadlist = []

        let requestInstance = function(event) {
            this.requestAssetInstance(event)
        }.bind(this);

        evt.on(ENUMS.Event.REQUEST_ASSET_INSTANCE, requestInstance);

        this.instanceEvt = [
            ENUMS.Args.POINTER,             0,
            ENUMS.Args.INSTANCE_POINTER,    0
        ];

        this.instancePointer = ENUMS.Numbers.INSTANCE_PTR_0;

    };

    requestAsset = function(modelAssetId, assetReadyCB) {

        let onAssetReady = function(asset) {
        //    console.log("AssetReady:", asset.id);
            this.assetIndex[asset.id] = this.assets.length;
            this.assets[modelAssetId] = asset;

            let idx = this.assetIndex[asset.id];

            let anims = asset.model.animKeys;
            let joints = asset.model.jointKeys;
            let message = {};


            message.index = idx;
            message.animKeys = anims;
            message.jointKeys = joints;

            let modelSettings = asset.model.settings;
            if (modelSettings.skin) {
                asset.model.skin = modelSettings.skin;
                message.skin = modelSettings.skin

            }

        }.bind(this);



        if (this.assets[modelAssetId]) {
            assetReadyCB(this.assets[modelAssetId])


        } else {

            let assetLoaded = function(asset) {
                if (!this.assets[asset.id]) {
                    onAssetReady(asset)
                }
                while(this.loadlist[modelAssetId].length) {
                    this.loadlist[modelAssetId].pop()(this.assets[asset.id]);
                }
            }.bind(this)

            if (this.loadlist[modelAssetId]) {
                this.loadlist[modelAssetId].push(assetReadyCB)
            } else {
                this.loadlist[modelAssetId] = [assetReadyCB]
                ThreeAPI.buildAsset(modelAssetId, assetLoaded);
            }

        }

    };

    getInstanceByPointer = function(ptr) {
        for (var i = 0; i < this.instances.length; i++) {
            if (this.instances[i].getPointer() === ptr) {
                return this.instances[i];
            }
        }
    };

    removeFromIsntanceIndex = function(instancedModel) {
        MATH.quickSplice(this.instances, instancedModel);
    };

    requestAssetInstance = function(assetId, callback) {

        let instanceReady = function(modelInstance) {
            this.instancePointer++;
            this.instances.push(modelInstance);
            modelInstance.activateInstancedModel();
            modelInstance.setPointer(this.instancePointer);
        //    this.instanceEvt[1] = this.assetIndex[modelInstance.getAssetId()];
        //    this.instanceEvt[3] = modelInstance.getPointer();
        //    evt.dispatch(ENUMS.Event.REGISTER_INSTANCE, this.instanceEvt);
            callback(modelInstance);
        }.bind(this);

        let asset = this.assets[assetId];
        asset.instantiateAsset(instanceReady);

    };

    updateDynamicInstances = function() {
        for (var i = 0; i < this.instances.length; i++) {
            this.instances[i].getSpatial().updateSpatialFrame();
        }
    };

    updateDynamicMatrices = function() {
        for (var i = 0; i < this.instances.length; i++) {
            this.instances[i].updateSpatialWorldMatrix();
        }
    };

    tickDynamicMain = function() {
        this.updateDynamicMatrices();
        this.updateDynamicInstances();
        InstanceAPI.updateInstances();

    };

    initiateInstancesFromBufferMsg = function(bufferMsg) {
        InstanceAPI.setupInstancingBuffers(bufferMsg);
    };

};

export { DynamicMain }