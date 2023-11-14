import { Vector3 } from "../../../libs/three/math/Vector3.js";

let tempVec3 = new Vector3();

class SpatialTransition {
    constructor() {

        this.startTime = 0;
        this.elapsedTime = 0;
        this.targetTime = 1;
        this.moveVec3 = null;
        this.frameDelta = new Vector3();
        this.startPos = new Vector3();
        this.targetPos = new Vector3();

        this.bounce = 0;
        this.curve = 'curveSigmoid'

        let _this = this;
        let tickMovement = function(tpf, gameTime) {
            _this.applyFrameToMovement(tpf, gameTime);
        };

        this.defaultTargetFunction = function () {
            return this.targetPos;
        }.bind(this)

        this.targetFunction = this.defaultTargetFunction;

        let getTargetPosition = function() {
            return this.targetFunction();
        }

        this.callbacks = {
            getTargetPosition:getTargetPosition,
            onGameUpdate:tickMovement
        }

        this.onArriveCallbacks = [];
        this.onFrameUpdateCallbacks = [];
    }

    initSpatialTransition(moveVec3, target, overTime, callback, bounce, curve, onFrameUpdateCB) {
        this.bounce = bounce || 0;
        this.curve = curve || 'curveSigmoid'
        this.moveVec3 = moveVec3;
        if (typeof(target) === 'function') {
            this.targetFunction = target;
        } else {
            this.targetPos.copy(target);
            this.targetFunction = this.defaultTargetFunction;
        }

        if (this.onArriveCallbacks.length === 0) {
            ThreeAPI.addPrerenderCallback(this.callbacks.onGameUpdate);
        }
        this.elapsedTime = 0;
        this.startTime = 0;
        this.targetTime = overTime;
        this.startPos.copy(moveVec3);
        if (typeof(callback) === 'function') {
            this.onArriveCallbacks.push(callback);
        }
        if (typeof(onFrameUpdateCB) === 'function') {
            this.onFrameUpdateCallbacks.push(onFrameUpdateCB);
        }
    }

    interpolatePosition(tpf) {
        if (this.elapsedTime+tpf < this.targetTime) {
            let fraction = MATH.calcFraction(this.startTime, this.targetTime, this.elapsedTime);
            if (fraction > 1) fraction = 1;
            this.moveVec3.copy(this.targetFunction());
            MATH.interpolateVec3FromTo(this.startPos, this.targetPos, fraction, this.moveVec3, this.curve);

            if (this.bounce) {
                if (MATH[this.curve]) {
                    this.moveVec3.y += Math.sin(MATH[this.curve](fraction)*Math.PI)*this.bounce;
                } else {
                    this.moveVec3.y += Math.sin(fraction*Math.PI)*this.bounce;
                }
            }

            MATH.callAll(this.onFrameUpdateCallbacks, this.moveVec3);

        } else {
            this.moveVec3.copy(this.targetPos);
            MATH.callAll(this.onArriveCallbacks, this.moveVec3);
            MATH.emptyArray(this.onArriveCallbacks);
            MATH.emptyArray(this.onFrameUpdateCallbacks);
            ThreeAPI.unregisterPrerenderCallback(this.callbacks.onGameUpdate);
        }
    }

    applyFrameToMovement(tpf) {
        if (this.elapsedTime += tpf) {
            this.interpolatePosition(tpf);
        }
    }
}

export { SpatialTransition }