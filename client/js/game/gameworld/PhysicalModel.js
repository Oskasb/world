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

setTimeout(function() {
    configDataList('PHYSICS', 'ASSET_SHAPES', onConfig)
}, 1000);

let tempBox = new Box3()

class PhysicalModel {
    constructor() {
        this.debugColor = 'BLUE'
        this.obj3d = new Object3D();
        let model = null;
        let instance = null;
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

        let getModel = function() {
            return model;
        }.bind(this)

        let setModel = function(m) {
            instance = null;
            model = m;
        }.bind(this)

        let setInstance = function(i) {
            model = null;
            instance = i;
        }.bind(this)

        let getInstance = function() {
            return instance;
        }.bind(this)

        this.call = {
            setInstance:setInstance,
            getInstance:getInstance,
            setModel:setModel,
            getModel:getModel
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

        this.includePhysicalModel();
   //     if (configData) {

    //    }

    }

    includePhysicalModel() {
        let shapes = null;
        if (configData[this.assetId]) {
            shapes = configData[this.assetId]['shapes'];
        } else {
            shapes = configData['default']['shapes'];
        }

        let bodyReadyCB = function(body) {
            bodyTransformToObj3d(body, this.obj3d);
            this.rigidBodies.push(body);
            window.AmmoAPI.includeBody(body);

            if (this.static === false) {
                //        console.log("Rigid Body: ",assetId, body)
            } else {

            }

        }.bind(this)

        if (!shapes[0].mass) {
            this.static = true;
        }
        for (let i = 0; i < shapes.length; i++) {
            let conf = shapes[i];
            //    let shape = poolFetch('PhysicalShape');

            AmmoAPI.setupRigidBody(this.obj3d, conf['shape'], conf['mass'], conf['friction'], conf['pos'], conf['rot'], conf['scale'], conf['asset'], conf['convex'], bodyReadyCB)

        }
    }

    testinclusion() {

    }

    testExclusion() {

    }

    deactivatePhysicalModel() {
     //   this.call.setModel("null");
        while (this.onUpdateCallbacks.length) {
            this.onUpdateCallbacks.pop();
        }

        while (this.rigidBodies.length) {
            let body = this.rigidBodies.pop();
            AmmoAPI.excludeBody(body);
        }
    }

    fitAAB(debugDraw) {
        this.box.min.copy(this.getPos());
        this.box.max.copy(this.getPos())
        for (let i = 0; i < this.rigidBodies.length; i++) {
            let body = this.rigidBodies[i];

            window.AmmoAPI.getBodyAABB(body, tempBox);
            if (debugDraw === true) {
                evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, {min:tempBox.min, max:tempBox.max, color:'BLUE'})
            }
              //    console.log(tempBox) //, bpProxy.lB(), bpProxy.nB(), bpProxy.pB());
            MATH.fitBoxAround(this.box, tempBox.min, tempBox.max);
        }
        return this.box;
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
                this.onUpdateCallbacks[i](this.obj3d, body.kB);
            }
        }

    };

    updatePhysicalModel() {
        this.sampleBodyState()
    }

}

export {PhysicalModel}