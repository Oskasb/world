class InstanceDynamicJoint {
    constructor(bone, instancedModel) {
        this.tempVec1 = new THREE.Vector3();
        this.bone = bone;
        this.instancedModel = instancedModel;
        this.obj3d = new THREE.Object3D();
        this.offsetObj3d = new THREE.Object3D();
    }


        setJointEnum = function(jointEnum) {
            this.jointEnum = jointEnum
        };

        getOffsetObj3D = function() {
            return this.offsetObj3d;
        };

        stickToBoneWorldMatrix = function() {

            if (isNaN(this.obj3d.position.x)) {
                console.log("Bad dynJoint")
                return;
            }

            this.bone.matrixWorld.decompose(this.obj3d.position, this.obj3d.quaternion, this.obj3d.scale);

            if (isNaN(this.obj3d.position.x)) {
                console.log("Bad dynJoint")
                return;
            }

            if (this.offsetObj3d.position.lengthSq()) {
                this.tempVec1.copy(this.offsetObj3d.position);
                this.tempVec1.applyQuaternion(this.obj3d.quaternion);
                this.obj3d.position.add(this.tempVec1);
            }

            this.tempVec1.setFromMatrixScale(this.bone.matrixWorld);
            this.obj3d.scale.divide(this.tempVec1);
            this.obj3d.scale.multiply(this.offsetObj3d.scale);
            this.obj3d.quaternion.multiply(this.offsetObj3d.quaternion);

            if (isNaN(this.obj3d.position.x)) {
                console.log("Bad dynJoint")
                return;
            }

       //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: this.obj3d.position, color:'GREEN', size:0.1})
        };

        updateSpatialFrame = function() {
            if (this.instancedModel.active) {
                this.stickToBoneWorldMatrix()
            }

        };

    };

export { InstanceDynamicJoint };
