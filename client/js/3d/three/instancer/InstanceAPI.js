import {InstanceBuffer} from './InstanceBuffer.js';
import {GeometryInstance} from './GeometryInstance.js';

class InstanceAPI {
    constructor() {
    //    console.log('INIT InstanceAPI');
        this.bufferCount = 0;
        this.modelCount = 0;
        this.tempVec = new THREE.Vector3();
        this.instanceBuffers = {};

        this.instances = {};
        this.releasedInstances = {}
        this.addedInstances = {};
        this.registeredInstances = {};
        this.frameChanges = [];
        this.materials = [];
        this.uiSystems = {};
        this.attributes = {
            "startTime"      : { "dimensions":1, "dynamic":true },
            "duration"       : { "dimensions":1, "dynamic":false},
            "offset"         : { "dimensions":3, "dynamic":false},
            "texelRowSelect" : { "dimensions":4, "dynamic":false},
            "lifecycle"      : { "dimensions":4, "dynamic":false},
            "tileindex"      : { "dimensions":2                 },
            "sprite"         : { "dimensions":4, "dynamic":false},
            "diffusors"      : { "dimensions":4, "dynamic":false},
            "vertexColor"    : { "dimensions":4, "dynamic":false},
            "scale3d"        : { "dimensions":3, "dynamic":false},
            "orientation"    : { "dimensions":4, "dynamic":false}
        };
    }

    addToModelCount() {
        this.modelCount++;
    }

    getModelCount() {
        return this.modelCount;
    }



    registerGeometry = function(id, model, settings, material) {
        this.bufferCount++
        let extractFirstMeshGeometry = function(child, buffers) {

            child.traverse(function(node) {
                if (node.type === 'Mesh') {
                    let geometry = node.geometry;
                    buffers.verts   = geometry.attributes.position.array;
                    buffers.normals = geometry.attributes.normal.array;
                    buffers.uvs     = geometry.attributes.uv.array;

                    if (geometry.index) {
                        buffers.indices = geometry.index.array;
                    } else {
                        console.log("No indices for geometry... ", id, model);
                    }

                }
            });

        };

        if (this.materials.indexOf(material) === -1) {
            this.materials.push(material);
        }

        let count = settings.instances;
        let attribs = settings.attributes;

        let buffers = {};
        extractFirstMeshGeometry(model.scene.children[0], buffers);
        let insBufs = new InstanceBuffer(buffers.verts, buffers.uvs, buffers.indices, buffers.normals);
        insBufs.mesh.name = id+' '+this.bufferCount+' '+material.id;
     //   insBufs.extractFirstMeshGeometry(model.scene.children[0], buffers);


        for (let i = 0; i < attribs.length; i++) {
            let attrib = this.attributes[attribs[i]];
            insBufs.registerBufferAttribute(attrib,  attribs[i], count)
        }

        insBufs.activateAttributes(1);
        insBufs.setMaterial(material);
        this.instanceBuffers[id] = insBufs;
        this.instanceBuffers[id].setInstancedCount(0);
        if (settings.cameraspace) {
            this.instanceBuffers[id].isCameraSpace = true;
            insBufs.addToScene();
        }
    //
        return insBufs;
    };


    bindGeometryInstance = function(geoIns) {
        let id = geoIns.id;

        if (this.frameChanges.indexOf(id) === -1) {
            this.frameChanges.push(id);
        }

        if (this.registeredInstances[id].indexOf(geoIns) === -1) {
            geoIns.index = this.registeredInstances[id].length;
            this.registeredInstances[id].push(geoIns);
        }

        geoIns.initBuffers();
        this.addedInstances[id].push(geoIns);
    //    geoIns.index = this.instances[id].length + this.
    //    this.instanceBuffers[id].setInstancedCount(this.instances[id].length);

    }

    instantiateGeometry = function(id, callback) {
        if (!this.instances[id]) {
            this.instances[id] = []
            this.releasedInstances[id] = [];
            this.addedInstances[id] = [];
            this.registeredInstances[id] = [];
        }

        let instance = new GeometryInstance(id, -1, this.instanceBuffers[id]);
        callback(instance);
    };

    releaseGeometryInstance(geomInstance) {
        if (!geomInstance) {
            console.log("Try remove a nothing")
            return;
        }

        let id = geomInstance.id;

        if (this.frameChanges.indexOf(id) === -1) {
            this.frameChanges.push(id);
        }

        this.releasedInstances[id].push(geomInstance);
    }

    getUiSysInstanceBuffers = function(uiSysKey) {
        return this.uiSystems[uiSysKey];
    };

    setupInstancingBuffers = function(msg) {

        let uiSysId     = msg[0];
        let assetId     = msg[1];
        let bufferNames = msg[2];
        let buffers     = msg[3];
        let order       = msg[4];

    //    console.log("setupInstancingBuffers: ", assetId);

        if (!this.uiSystems[uiSysId]) {
            this.uiSystems[uiSysId] = [];
        }

        let assetLoaded = function(threeModel) {
        //    console.log("assetLoaded: ", threeModel.id);
            let instanceBuffers = threeModel.instanceBuffers;
            for (let i = 0; i < bufferNames.length; i++) {
                let attrib = this.attributes[bufferNames[i]];
                //           instanceBuffers.registerBufferAttribute(attrib,  bufferNames[i], 1)
                  instanceBuffers.attachAttribute(buffers[i], bufferNames[i], attrib.dimensions, attrib.dynamic)
            }

        //  instanceBuffers.activateAttributes(1)

            instanceBuffers.setRenderOrder(order)
            instanceBuffers.setInstancedCount(0);
            this.uiSystems[uiSysId].push(instanceBuffers);

        }.bind(this);

       ThreeAPI.loadThreeAsset('MODELS_', assetId, assetLoaded);

    };


    monitorInstances = function(key, value) {
        let cache = PipelineAPI.getCachedConfigs();
        if (!cache['DEBUG']) {
            cache.DEBUG = {};
        }
        if (!cache['DEBUG']['BUFFERS']) {
            cache.DEBUG.BUFFERS = {
                systems:0,
                active:0,
                total:0,
                sysAssets: [],
                sysKeys:[]
            };
            this.track = cache.DEBUG.BUFFERS;
        }
        this.track[key] = value;

    }


    processReleasedInstances(id) {

        let releasedInstances = this.releasedInstances[id];
        let instances = this.instances[id];

        while (releasedInstances.length) {

            let releasedIns = releasedInstances.pop();
            let idx = releasedIns.index;

            MATH.splice(instances, releasedIns);
        /*
            if (idx < instances.length-1) {
                let uppedInstance = instances.pop();
                let sourceIndex = uppedInstance.index;
                uppedInstance.index = idx;
                instances[idx] = uppedInstance;
                uppedInstance.copyAttributesByIndex(sourceIndex);
            }

         */
        }
    }

    processAddedInstances(id) {
        let addedInstances = this.addedInstances[id];
        let instances = this.instances[id];

        while (addedInstances.length) {

            let addedIns = addedInstances.pop();
        //    let idx = instances.length;
        //    addedIns.index = idx;
            instances.push(addedIns);
        }

    }

    getBuffersById(id) {
        if (this.instances[id].length !== 0) {
            return this.instances[id][0].instancingBuffers;
        }

        if (this.addedInstances[id].length !== 0) {
            return this.addedInstances[id][0].instancingBuffers;
        }

        if (this.releasedInstances[id].length !== 0) {
            return this.releasedInstances[id][0].instancingBuffers;
        }

    }

    recalculateIndices(id) {
        for (let i = 0; i < this.instances[id].length; i++) {
            this.instances[id][i].index = i;
        }

    }

    updateInstances = function() {

        let iCount = 0;
// Why.... no worky!!
        while (this.frameChanges.length) {
            let id = this.frameChanges.pop();

            let insBuffers = this.getBuffersById(id)

            this.processReleasedInstances(id);
            this.processAddedInstances(id);
        //    this.recalculateIndices(id);
            if (this.instances[id].length === 0) {
            //    insBuffers.setInstancedCount(0);
            } else {
                insBuffers.setInstancedCount(this.registeredInstances[id].length);
            }

        }


        let updateUiSystemBuffers = function(instanceBuffers) {
            let count = instanceBuffers.updateBufferStates()
        //    console.log(count);
        // This is not properly used, can probably cull a lot

            //    instanceBuffers.setInstancedCount(count);
            iCount+=count;
        };

        let sysKeys = 0;
        let sysBuffs = 0;
        for (let key in this.uiSystems) {
            sysKeys++
            for (let i = 0; i < this.uiSystems[key].length; i++) {
                sysBuffs++
                updateUiSystemBuffers(this.uiSystems[key][i])
            }
        }

        ThreeAPI.setGlobalUniform( 'fogDensity', ThreeAPI.readEnvironmentUniform('fog', 'density'));
        ThreeAPI.setGlobalUniform( 'fogColor' ,ThreeAPI.readEnvironmentUniform('fog', 'color'));
        ThreeAPI.setGlobalUniform( 'sunLightColor' ,ThreeAPI.readEnvironmentUniform('sun', 'color'));
        ThreeAPI.setGlobalUniform( 'ambientLightColor' ,ThreeAPI.readEnvironmentUniform('ambient', 'color'));

        let quat = ThreeAPI.readEnvironmentUniform('sun', 'quaternion');
        this.tempVec.set(0, 0, -1);
        this.tempVec.applyQuaternion(quat);
        ThreeAPI.setGlobalUniform( 'sunLightDirection' ,this.tempVec);
        ThreeAPI.setGlobalUniform('clearViewPos1', ThreeAPI.getCameraCursor().getPos());

        let mats = 0;

        for (let i = 0; i < this.materials.length; i++) {
            let mat = this.materials[i];
            if (mat) {
                mats++
                if (mat.uniforms) {
                    if (mat.uniforms.systemTime) {
                        mat.uniforms.systemTime.value = client.getFrame().systemTime;
                    } else {
                        console.log("no uniform yet...")
                    }
                }
            } else {
                console.log("no material yet...")
            }

        }
        this.monitorInstances('mats', mats);
        this.monitorInstances('sysKeys', sysKeys);
        this.monitorInstances('sysBuffs', sysBuffs);
        this.monitorInstances('iCount', iCount);
    };

}

export { InstanceAPI };
