import { Vector3 } from "../../../libs/three/math/Vector3.js";
let tempVec3 = new Vector3();

class SpatialTransition {
    constructor() {

        this.startTime = 0;
        this.targetTime = 1;
        this.targetSpatial = null;
        this.startPos = new THREE.Vector3();
        this.targetPos = new THREE.Vector3();

        let _this = this;
        let tickMovement = function(tpf, gameTime) {
            _this.applyFrameToMovement(tpf, gameTime);
        };

        this.callbacks = {
            onGameUpdate:tickMovement
        }

        this.onArriveCallbacks = [];
    }

    initSpatialTransition(mode, gamePiece, tSpatial, overTime, callback) {
        this.gamePiece = gamePiece;
        this.spatial = gamePiece.getSpatial();

        let now = GameAPI.getGameTime();
        if (this.onArriveCallbacks.length === 0) {
            this.gamePiece.addPieceUpdateCallback(this.callbacks.onGameUpdate);
        }
        this.startTime = now;
        this.targetTime = now+overTime;
        tSpatial.getSpatialPosition(this.targetPos);
        this.targetSpatial = tSpatial;
        this.spatial.getSpatialPosition(this.startPos);
        if (typeof(callback) === 'function') {
            this.onArriveCallbacks.push(callback);
        }
    }

    interpolatePosition() {
        let now = GameAPI.getGameTime();
        if (this.targetTime > now) {
            let fraction = MATH.calcFraction(this.startTime, this.targetTime, now);
            if (fraction > 1) fraction = 1;
            this.targetSpatial.getSpatialPosition(this.targetPos);
            this.targetPos.y+=Math.sin(fraction*Math.PI)*0.7+1.1;
            MATH.interpolateVec3FromTo(this.startPos, this.targetPos, fraction, tempVec3 , 'curveSigmoid');
            this.spatial.setPosVec3(tempVec3);
        } else {
            this.spatial.setPosVec3(this.targetPos);

            this.targetSpatial = null;
            MATH.callAll(this.onArriveCallbacks, this.gamePiece);
            this.spatial.setPosVec3(this.targetPos);
            MATH.emptyArray(this.onArriveCallbacks);
            this.gamePiece.removePieceUpdateCallback(this.callbacks.onGameUpdate);
        }
    }

    applyFrameToMovement(tpf, gameTime) {
        if (this.targetTime+tpf > gameTime) {
            this.interpolatePosition();
        }
    }
}

export { SpatialTransition }