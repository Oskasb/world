import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {Object3D} from "../../../../libs/three/core/Object3D.js";

let tempVec = new Vector3()
class AttachmentJoint {
    constructor(key, parentScale, dynamicBoneId) {
        this.key = key;
        this.dynamicBoneId = dynamicBoneId;
        if (parentScale.length() > 10) {
            console.log("Big bad parentScale")
            parentScale.set(1, 1, 1);
        }
        this.parentScale = parentScale;
        this.obj3d = new Object3D();

        this.gamePiece = null;

        this.dynamicPosition = new Vector3();

        this.attachedSpatial = null;

        this.positionUpdateCallbacks = [];

        let attachEffect = function(effect) {
            effect.attachToJoint(this)
        }.bind(this);

        let updateAttachedSpatial = function() {

            this.inheritJointDynamicPosition()
        }.bind(this);

        let applyBones = function(boneMap) {
            this.applyBoneMap(boneMap)
        }.bind(this);

        this.callbacks = {
            updateAttachedSpatial:updateAttachedSpatial,
            applyBoneMap:applyBones,
            attachEffect:attachEffect
        }

    };

    getAttachEffectCallback() {
        return this.callbacks.attachEffect;
    };

    inheritJointDynamicPosition() {
        this.dynamicBone.stickToBoneWorldMatrix();

        let spatObj = this.dynamicBone.obj3d;
        if (typeof(spatObj) === 'undefined') {
            console.log("bad joint obj,")
            return;
        }
        if (isNaN(spatObj.position.x)) {
            console.log("bad bone")
            return;
        }

        //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: dynamicJoint.obj3d.position, color:'GREEN', size:dynamicJoint.obj3d.scale.length()*0.2})
        if (this.obj3d.scale.length() > 10) {
            console.log("Bad joint found!", spatObj)
            if (this.jointData) {
                this.applyJointOffsets(this.jointData);
            }

            evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: this.obj3d.position, color:'RED', size:1})
        }

        spatObj.scale.multiply(this.obj3d.scale);


        spatObj.quaternion.multiply(this.obj3d.quaternion);
        tempVec.copy(this.obj3d.position);
        tempVec.applyQuaternion( spatObj.quaternion)
        spatObj.position.add(tempVec);

        if (isNaN(this.dynamicBone.obj3d.position.x)) {
            console.log("bad bone")
            return;
        }

        this.attachedSpatial.stickToDynamicJoint(this.dynamicBone);
    //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: this.attachedSpatial.obj3d.position, color:'GREEN', size:0.2})
        MATH.callAll(this.positionUpdateCallbacks, this.dynamicPosition)

    };

    addPositionUpdateCallback(cb) {
        this.positionUpdateCallbacks.push(cb)
    };

    removePositionUpdateCallback(cb) {
        MATH.splice(this.positionUpdateCallbacks, cb);
    };

    getDynamicPosition(storeVec) {
        storeVec.copy(this.dynamicPosition);
    };

    applyJointOffsets(jointData) {
        this.jointData = jointData;
        this.obj3d.quaternion.set(0, 0, 0, 1);
        this.obj3d.rotateX(jointData.rot[0]);
        this.obj3d.rotateY(jointData.rot[1]);
        this.obj3d.rotateZ(jointData.rot[2]);

        this.obj3d.position.x = jointData.offset[0];
        this.obj3d.position.y = jointData.offset[1];
        this.obj3d.position.z = jointData.offset[2];

        this.obj3d.scale.x = jointData.scale[0];
        this.obj3d.scale.y = jointData.scale[1];
        this.obj3d.scale.z = jointData.scale[2];
        if (this.obj3d.scale.x > 10) {
            console.log("Bad jointData Scale")
        }

        if (this.parentScale.length() > 10) {
            console.log("Bad parent Scale")
            this.parentScale.set(1, 1, 1);
        }
        this.obj3d.scale.multiply(this.parentScale);

        this.obj3d.position.multiply(this.obj3d.scale)
    };

    detachAttachedEntity() {
        if (!this.attachedSpatial) {
            console.log("Spatial Already detached")
            return this;
        }
        this.attachedSpatial.dynamicJoint = null;
        this.attachedSpatial = null;
        return this;
    };

    getAttachedEntity() {
        return this.attachedSpatial;
    };

    applyBoneMap(boneMap) {
        this.dynamicBone = boneMap[this.dynamicBoneId]
    };

    registerAttachedSpatial = function(spatial, joint, dynamicBones) {
        this.attachedSpatial = spatial;

     //   spatial.attachToDynamicJoint(this.dynamicBone);
        return this;

    };

}

export { AttachmentJoint }