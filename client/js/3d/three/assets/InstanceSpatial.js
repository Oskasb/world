
let testVec3ForNaN = function(vec3) {
    if (isNaN(vec3.x) || isNaN(vec3.y) || isNaN(vec3.z)) {
        console.log("Spatial Vec3 is NaN.. investigate!")
        vec3.x = 0;
        vec3.y = 0;
        vec3.z = 0
    }
}

class InstanceSpatial{

        constructor(obj3d) {
            this.obj3d = obj3d;
            this.baseSize = 1;
            let frameMovement = new THREE.Vector3(0.0, 0.0, 0.0);

            let getFrameVelocity = function(tpf, storeVec3) {
                testVec3ForNaN(frameMovement)
                storeVec3.copy(frameMovement);
                storeVec3.multiplyScalar(tpf);

            }.bind(this);

            let setPrePos = function(pos) {
                testVec3ForNaN(pos)
                frameMovement.copy(pos);
            }

            let setPostPos = function(pos) {
                testVec3ForNaN(pos)
                frameMovement.sub(pos);
            }

            let getMovement = function(store) {
                testVec3ForNaN(frameMovement)
                return store.copy(frameMovement);
            }

            let setStopped = function() {
                testVec3ForNaN(frameMovement)
                frameMovement.set(0, 0, 0)
            }

            this.call = {
                setStopped:setStopped,
                setPrePos:setPrePos,
                setPosPos:setPostPos,
                getMovement:getMovement,
                getFrameVelocity:getFrameVelocity
            }

        };

        getFrameMovement = function(store) {
            this.call.getMovement(store);
        };

        getSpatialPosition = function(store) {
            testVec3ForNaN(this.obj3d.position)
            store.copy(this.obj3d.position);
        };

        setPosXYZ = function(x, y, z) {
            this.obj3d.position.x = x;
            this.obj3d.position.y = y;
            this.obj3d.position.z = z;
            testVec3ForNaN(this.obj3d.position)
            if (this.geometryInstance) {
                this.geometryInstance.applyObjPos();
            }
        };

        setRotXYZ = function(x, y, z) {
            let obj3d = this.obj3d;
            obj3d.quaternion.x = 0;
            obj3d.quaternion.y = 1;
            obj3d.quaternion.z = 0;
            obj3d.quaternion.w = 0;
            testVec3ForNaN(this.obj3d.quaternion)
            obj3d.rotateX(x);
            obj3d.rotateY(y);
            obj3d.rotateZ(z)
            if (this.geometryInstance) {
                this.geometryInstance.applyObjQuat();
            }
        };
        setQuatXYZW = function(x, y, z, w) {
            this.obj3d.quaternion.x = x;
            this.obj3d.quaternion.y = y;
            this.obj3d.quaternion.z = z;
            this.obj3d.quaternion.w = w;
            testVec3ForNaN(this.obj3d.quaternion)
            if (this.geometryInstance) {
                this.geometryInstance.applyObjQuat();
            }
        };

        getQuat() {
            testVec3ForNaN(this.obj3d.quaternion)
            return this.obj3d.quaternion;
        }

        getPos() {
            testVec3ForNaN(this.obj3d.position)
            return this.obj3d.position;
        }

        setBaseSize(size) {
            this.baseSize = size;
            this.setScaleXYZ(1, 1, 1)
        }
        setScaleXYZ = function(x, y, z) {
            this.obj3d.scale.x = x*this.baseSize;
            this.obj3d.scale.y = y*this.baseSize;
            this.obj3d.scale.z = z*this.baseSize;
            if (this.geometryInstance) {
                this.geometryInstance.applyObjScale();
            }
        };

        setPosVec3 = function(posVec3) {
            testVec3ForNaN(posVec3)
            this.call.setPrePos(this.obj3d.position);
            this.obj3d.position.copy(posVec3);
            this.call.setPosPos(posVec3)
            if (this.geometryInstance) {
                this.geometryInstance.applyObjPos();
            }
        };

        rotateXYZ = function(x, y, z) {
            this.obj3d.rotateX(x);
            this.obj3d.rotateY(y);
            this.obj3d.rotateZ(z);
            if (this.geometryInstance) {
                this.geometryInstance.applyObjQuat();
            }
        };

        applySpatialUpdateToBuffers() {
            if (this.geometryInstance) {
                this.geometryInstance.applyObjQuat();
                this.geometryInstance.applyObjScale();
                this.geometryInstance.applyObjPos();
            }
        }

        attachToDynamicJoint = function(dynamicJoint) {
            this.dynamicJoint = dynamicJoint;
        };

        stickToDynamicJoint = function(dynamicJoint) {
            this.stickToObj3D(dynamicJoint.obj3d);
        };

        stickToObj3D(obj3d) {
            if (isNaN(obj3d.position.x)) {
                console.log("stickToObj is bad, fix!")
                return;
            }
            testVec3ForNaN(obj3d.position)
            this.obj3d.position.copy(obj3d.position);
            this.obj3d.scale.copy(obj3d.scale);
            this.obj3d.quaternion.copy(obj3d.quaternion);

            if (this.geometryInstance) {
                this.geometryInstance.applyObjPos();
                this.geometryInstance.applyObjQuat();
                this.geometryInstance.applyObjScale();
            }
        }

        updateSpatialFrame = function() {

        };

        turnTowardsPos(posVec3) {
            this.obj3d.lookAt(posVec3);
        }

        updateSpatialMatrix = function() {

            if (!this.geometryInstance) {
                this.obj3d.updateMatrixWorld();
            }

        };

        setGeometryInstance = function(geomIns) {
            this.geometryInstance = geomIns;
            this.geometryInstance.applyObjPos();
            this.geometryInstance.applyObjQuat();
            this.geometryInstance.applyObjScale();

        };

    }

export {InstanceSpatial}
