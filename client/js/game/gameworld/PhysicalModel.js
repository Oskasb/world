import {Object3D} from "../../../libs/three/core/Object3D.js";
import {Vector3} from "../../../libs/three/math/Vector3.js";
import {testAABOXIntersectPosition} from "../../application/utils/ModelUtils.js";
import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";
import {configDataList} from "../../application/utils/ConfigUtils.js";
import {Box3} from "../../../libs/three/math/Box3.js";
import {colorMapFx} from "../visuals/Colors.js";
import {bodyTransformToObj3d} from "../../application/utils/PhysicsUtils.js";


let configData = null;
let tempVec = new Vector3()
function onConfig(data) {
    configData = data;
}

class PhysicalModel {
    constructor() {
        this.debugColor = 'BLUE'
        this.obj3d = new Object3D();
        this.shapes = [];
        this.rigidBodies = [];
        this.assetId = null;
        this.box = new Box3();

        this.onUpdateCallbacks = [];

        let applyPhysicalConfig = function(data) {
            onConfig(data);
            let rebuild = this.assetId;
            this.deactivatePhysicalModel();
            if (rebuild) {
                this.initPhysicalWorldModel(rebuild, this.obj3d)
            }
        }.bind(this);

        if (!configData) {
            configDataList('PHYSICS', 'ASSET_SHAPES', applyPhysicalConfig)
        }

    }

    getPos() {
        return this.obj3d.position;
    }

    initPhysicalWorldModel(assetId, obj3d, updateCB) {

        if (typeof (updateCB) === 'function') {
            this.onUpdateCallbacks.push(updateCB);
        }

        this.assetId = assetId;
        this.obj3d.copy(obj3d);
        this.box.min.set(999999999, 99999999, 99999999);
        this.box.max.set(-999999999, -99999999, -99999999);
        this.static = false;
        if (configData) {
            let shapes = null;
            if (configData[assetId]) {
                shapes = configData[assetId]['shapes'];
            } else {
                shapes = configData['default']['shapes'];
            }

            let bodyReadyCB = function(body) {
                bodyTransformToObj3d(body, this.obj3d);
                this.rigidBodies.push(body);
                window.AmmoAPI.includeBody(body);
                if (this.static === false) {
                    console.log("Rigid Body: ",assetId, body)
                } else {

                }

            }.bind(this)

            if (!shapes[0].mass) {
                this.static = true;
            }
            for (let i = 0; i < shapes.length; i++) {
                let conf = shapes[i];
            //    let shape = poolFetch('PhysicalShape');

                    window.AmmoAPI.setupRigidBody(this.obj3d, conf['shape'], conf['mass'], conf['friction'], conf['pos'], conf['rot'], conf['scale'], conf['asset'], conf['convex'], bodyReadyCB)

            }
        }
    }

    deactivatePhysicalModel() {
        while (this.onUpdateCallbacks.length) {
            this.onUpdateCallbacks.pop();
        }

        while (this.rigidBodies.length) {
            let body = this.rigidBodies.pop();
            window.AmmoAPI.excludeBody(body);
        }
    }

    sampleBodyState() {

        if (this.static) {
            return;
        }

   //     console.log("sampleBodyState body", this.rigidBodies);

        for (let i = 0; i < this.rigidBodies.length; i++) {
            let body = this.rigidBodies[i];
            if (!body.getMotionState) {
                console.log("Bad physics body", body);
                return;
            }
            bodyTransformToObj3d(body, this.obj3d);
            let vel = body.getLinearVelocity();
            let angVel = body.getAngularVelocity();

            for (let i = 0; i < this.onUpdateCallbacks.length; i++) {
                this.onUpdateCallbacks[i](this.obj3d);
            }
        }

    };

    updatePhysicalModel() {
        this.sampleBodyState()
    }

}

export {PhysicalModel}