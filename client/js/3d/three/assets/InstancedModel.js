import {InstanceAnimator} from './InstanceAnimator.js';
import {InstanceDynamicJoint} from './InstanceDynamicJoint.js';

class InstancedModel {
    constructor(originalAsset) {
        this.ptr = null;
            this.tempVec3 = new THREE.Vector3()
            this.tempVec3b = new THREE.Vector3()
            this.originalAsset = originalAsset;
            this.originalModel = originalAsset.model;
            this.unifVec = {x:0, y:0, z:0};
            let onUpdateEvent = function(event) {
                this.handleUpdateEvent(event)
            }.bind(this);

            this.callbacks = {
                onUpdateEvent :onUpdateEvent
            };

            this.active = ENUMS.InstanceState.INITIATING;

            this.boneMap = {};
            this.attachments = [];
        };

        getAssetId = function() {
            return this.originalAsset.id;
        };


        setPointer = function(ptr) {
        //    client.evt.removeListener(this.ptr, this.callbacks.onUpdateEvent)
            this.ptr = ptr;
        //    client.evt.on(this.ptr, this.callbacks.onUpdateEvent)
        };

        getPointer = function() {
            return this.ptr;
        };

        getSpatial = function() {
            return this.spatial;
        };

        handleUpdateEvent = function(event) {
         //   evt.parser.parseEntityEvent(this, event);
        };

        requestAttachment = function(attachInstance) {
            this.attachInstancedModel(attachInstance);
        };

        getDynamicJoint = function(jointEnum) {
            var boneName = this.originalModel.jointMap[ENUMS.getKey('Joints', jointEnum)];
            this.boneMap[boneName].setJointEnum(jointEnum)
            return this.boneMap[boneName];
        };

        requestAttachToJoint = function(attachInstance, dynJoint) {
            attachInstance.getSpatial().attachToDynamicJoint(dynJoint);
        };

        getGeometryInstance = function() {
            return this.spatial.geometryInstance;
        };

    setAttributev4(attribName, vec4) {
        this.getGeometryInstance().setAttributeVec4(attribName, vec4)
    };

        setSprite(sprite) {
            ThreeAPI.tempVec4.x =  sprite[0];
            ThreeAPI.tempVec4.y =     sprite[1];
                ThreeAPI.tempVec4.z =     1;
                ThreeAPI.tempVec4.w =     1;

            this.setAttributev4('sprite', ThreeAPI.tempVec4)
    };

        initModelInstance = function(callback, _this) {

            let cloned = function(spatial) {
                _this.spatial = spatial;
                _this.obj3d = spatial.obj3d;
                _this.applyModelMaterial(_this.obj3d , _this.originalModel.getModelMaterial());


                if (_this.originalModel.hasAnimations) {
                    if (_this.obj3d.animator) {
                        _this.animator = _this.obj3d.animator
                    } else {
                        _this.animator = new InstanceAnimator(_this);
                        _this.obj3d.animator = _this.animator;
                    }
                    _this.animator.initAnimatior();
                }

                callback(_this)
            };

            _this.originalModel.getModelClone(cloned)
        };

        getAnimationMixer() {
            if (this.animator) {
                return this.animator.mixer;
            }
        }

        applyModelMaterial = function(clone, material) {

            var _this = this;

            clone.traverse(function(node) {
                if (node.type === 'Mesh') {
                    node.material = material;
                }
                if (node.type === 'SkinnedMesh') {
                    _this.skinNode = node;
                    node.material = material;
                    material.skinning = true;
                }
            });
            this.mapBones();
        };



        setActive = function(ENUM) {
            this.active = ENUM;
            if (this.active !== ENUMS.InstanceState.DECOMISSION ) {
                this.activateInstancedModel();

                this.decomissioned = false;

            } else {
                if (this.decomissioned) {
                    console.log("Already decomissioned", this);
                    return;
                }
                this.decomissioned = true;
                this.decommissionInstancedModel();
            }
        };


        getObj3d = function() {
            return this.obj3d;
        };

        mapBones = function() {

            var mapSkinBones = function(parent) {
                var parentSkel = parent.skeleton;

                for (var i = 0; i < parentSkel.bones.length; i++) {
                    var boneName = parentSkel.bones[i].name;
                    _this.boneMap[boneName] = new InstanceDynamicJoint(parentSkel.bones[i], _this);
                }

            };

            var _this = this;

            if (this.skinNode) {
                mapSkinBones(_this.skinNode);

                for (var key in this.originalModel.jointMap) {
                    if (key !== 'SKIN') {
                        let boneName = this.originalModel.jointMap[key];
                        let dynJoint = this.boneMap[boneName];
                        dynJoint.setJointEnum(ENUMS.Joints[key])
                    }
                }

            }
        };


        attachInstancedModel = function(instancedModel) {

            var getBoneByName = function(bones, name) {
                for (var i = 0; i < bones.length; i++) {
                    if (bones[i].name === name) {
                        return bones[i];
                    }
                }
                console.log("No bone by name:", name);
            };

            var replaceChildBones = function(parent, child) {
                var parentSkel = parent.skeleton;
                var childSkel = child.skeleton;

                for (var i = 0; i < childSkel.bones.length; i++) {
                    var boneName = childSkel.bones[i].name;
                    var useBone = getBoneByName(parentSkel.bones, boneName);
        //            console.log("USE BONEe:", useBone);
                    childSkel.bones[i] = useBone;
                }
            };

            var _this = this;
            instancedModel.obj3d.traverse(function(node) {
                if (node.type === 'Mesh') {
                    console.log("Not SkinnedMesh", _this.skinNode);
                }
                if (node.type === 'SkinnedMesh') {

                    if (_this.skinNode) {

                        replaceChildBones(_this.skinNode, node);

                    }
                }
            });

            this.obj3d.add(instancedModel.obj3d);
            this.attachments.push(instancedModel)

        };

        detatchInstancedModel = function(instancedModel) {
            this.obj3d.remove(instancedModel.obj3d);
        //    instancedModel.decommissionInstancedModel()
        };

        detatchAllAttachmnets = function() {
            while (this.attachments.length) {
                this.detatchInstancedModel(this.attachments.pop())
            }
        };

        getAnimationMap = function() {
            return this.originalModel.animMap;
        };

    getBoneMap() {
        return this.boneMap;
    }
        getJointMap() {
            return this.originalModel.jointMap;
        }

        updateBoneWorldTransform(bone, storeObj3d) {
            bone.stickToBoneWorldMatrix()
            storeObj3d.copy(bone.obj3d);
        }

        getBoneWorldTransform(boneName, storeObj3d) {
            let dynJoint = this.boneMap[boneName];

            if (!dynJoint) {
                console.log("No dynJoint", boneName)
            } else {
                this.updateBoneWorldTransform(dynJoint, storeObj3d)

            }
        }

        getJointKeyWorldTransform(jointKey, storeObj3d) {

                    let boneName = this.getJointMap()[jointKey];
                    if (!boneName) {
                        console.log("No bone for key ", jointKey, this);
                        return
                    }

                    this.getBoneWorldTransform(boneName, storeObj3d)



        }

        updateSpatialWorldMatrix = function() {

            for (let key in this.originalModel.jointMap) {

                if (key === 'FOOT_L' || key === 'FOOT_R') {

                }

                if (key !== 'SKIN') {

                    let boneName = this.originalModel.jointMap[key];

                    let dynJoint = this.boneMap[boneName];

                    if (!dynJoint) {
                        console.log("No dynJoint", key)
                    } else {
                        //        console.log(key)
                        dynJoint.updateSpatialFrame()
                    }

                }
            }

            this.getSpatial().getFrameMovement( this.tempVec3b);

            if ( this.tempVec3b.lengthSq()) {
                let pos = this.tempVec3;
                this.getSpatial().getSpatialPosition(pos);

                this.unifVec.x = pos.x;
                this.unifVec.y = pos.y;
                this.unifVec.z = pos.z;
            //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: this.unifVec, color:'CYAN', size:0.1})
                ThreeAPI.registerDynamicGlobalUniform('character',this.unifVec)
            }
        };

        activateInstancedModel = function() {
            ThreeAPI.addToScene(this.obj3d);
            if (this.animator) {
                this.animator.activateAnimator();
            }
        };

        decommissionInstancedModel = function() {

        //    this.getSpatial().setScaleXYZ(0, 0, 0);
        //    ThreeAPI.removeScene(this.obj3d)
            if (this.animator) {
                this.animator.deActivateAnimator();
            }
            this.originalModel.recoverModelClone(this.getSpatial());
            this.originalAsset.disableAssetInstance(this);
        };

    }

export { InstancedModel };