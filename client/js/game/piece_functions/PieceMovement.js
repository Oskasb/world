import { SpatialTransition } from "./SpatialTransition.js";
import { Vector3 } from "../../../libs/three/math/Vector3.js";

let tempVec3 = new Vector3();


class PieceMovement {
    constructor(gamePiece) {
        this.target = null;
        this.tempVec = new THREE.Vector3()
        this.targetPosVec3 = new THREE.Vector3();
        this.gamePiece = gamePiece;
        this.spatial = gamePiece.getSpatial();
        this.spatialTransition = new SpatialTransition();
        this.startTime = 0;
        this.targetTime = 1;
        this.targetSpatial = null;
        this.startPos = new THREE.Vector3();
        this.targetPos = new THREE.Vector3();
        this.margin = 0;

        let _this = this;
        let tickMovement = function(tpf, gameTime) {
            _this.applyFrameToMovement(tpf, gameTime);
        };

        let onArrive = function() {

        }

        this.callbacks = {
            onGameUpdate:tickMovement,
            onArrive:onArrive
        }

        this.onArriveCallbacks = [];

    }

    moveAlongTilePath(tilePath, callback) {

        let pathTiles = tilePath.getTiles();
        let gamePiece = this.gamePiece;
        if (this.onArriveCallbacks.indexOf(callback) !== -1) {
            return;
        }

        let tileCount = pathTiles.length;
        let totalDistance = 0;

        let turnTimeRemaining = GameAPI.getTurnStatus().timeRemaining();

        this.tempVec.copy(pathTiles[0].getPos())
        for (let i = 0; i < pathTiles.length; i++) {
            let tile = pathTiles[i];
            tile.setTileStatus('IS_PATH');
            tile.indicateTileStatus(true);
        //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:this.tempVec, color:'WHITE', size:0.2})
        //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:tile.getPos(), color:'GREEN', size:0.1})
            this.tempVec.sub(tile.getPos());
            let distance = this.tempVec.length();
            totalDistance+= distance;
            this.tempVec.copy(tile.getPos())
        }

        let charSpeed = gamePiece.getStatusByKey('move_speed');
        let distancePerTile = totalDistance / tileCount;
        let timePerTile = GameAPI.getTurnStatus().turnTime * distancePerTile / charSpeed ;
        let tile;
        let nextTileCB = function() {
            if (pathTiles.length) {
                tile = pathTiles.shift();
                tile.setTileStatus('FREE');
                tile.indicateTileStatus(false);
                processTile(tile, timePerTile)

                if (!pathTiles.length) {

                }

            } else {
                callback(tile)
            }
        }

        let processTile = function(tile, travelTime) {
       //     console.log("Process Tile: ", travelTime);

            if (gamePiece !== GameAPI.getMainCharPiece()) {
                let target = gamePiece.getTarget()
                if (target) {
                    let rangeCheck = gamePiece.distanceToReachTarget(target)
                    if (rangeCheck < 0) {
                        tile.setTileStatus('OCCUPIED');
                        tile.setOccupant(gamePiece);
                        nextTileCB();
                        return;
                    }
                }
            }

            let spos = gamePiece.getPos()
       //     evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:tpos, color:'WHITE', size:0.4})
            this.moveToTargetAtTime('walk', spos, tile.getPos(), travelTime, nextTileCB, 0.1)
        }.bind(this)

        nextTileCB();

    }


    setTargetPosition(vec3) {
        this.targetPosVec3.copy(vec3)
        return this.targetPosVec3;
    }

    getTargetPosition() {
        return this.targetPosVec3;
    }

    moveToTargetAtTime(mode, source, target, overTime, callback, margin) {

        if (mode === 'grab_loot') {
            return this.spatialTransition.initSpatialTransition(mode, this.gamePiece, target, overTime, callback )
        } else {

        }

        let now = GameAPI.getGameTime();
        if (this.onArriveCallbacks.length === 0) {
            this.gamePiece.addPieceUpdateCallback(this.callbacks.onGameUpdate);
        }

        if (typeof(callback) === 'function') {
            if (this.onArriveCallbacks.indexOf(callback) === -1) {
                this.onArriveCallbacks.push(callback);
            } else {
                console.log("move callback already installed")
            }
        }

        this.startTime = now;
        this.target = target;
        this.margin = margin || 0.01;
        this.spatial.setPosVec3(source);
        this.startPos.copy(source);
        this.targetTime = now+overTime;
    }

    interpolatePosition(tpf) {
        let now = GameAPI.getGameTime();
        if (typeof (now) === 'undefined') {
            console.log("Now is bad..")
            return;
        }
        this.targetPos.copy(this.target);
    //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:this.targetPos, color:'YELLOW', size:0.1})
        let distanceRemaining = MATH.distanceBetween(this.spatial.obj3d.position, this.targetPos)
        if (distanceRemaining > this.margin) {
            let fraction = MATH.calcFraction(this.startTime, this.targetTime, now);
            if (fraction > 1) {
                fraction = 1
            }
            MATH.interpolateVec3FromTo(this.startPos, this.targetPos, fraction, tempVec3);
            this.spatial.setPosVec3(tempVec3);
        } else {
        //    this.spatial.call.setStopped();
            this.gamePiece.removePieceUpdateCallback(this.callbacks.onGameUpdate);
            MATH.callAndClearAll(this.onArriveCallbacks, this.gamePiece)
            let gamePiece= this.gamePiece;
                setTimeout(function() {
                    gamePiece.getSpatial().call.setStopped()
                },0)

        }
    }

    cancelActiveTransition() {
        this.gamePiece.removePieceUpdateCallback(this.callbacks.onGameUpdate);
        MATH.emptyArray(this.onArriveCallbacks);
    }
    applyFrameToMovement(tpf) {
        this.interpolatePosition(tpf);
    }


}

export { PieceMovement }