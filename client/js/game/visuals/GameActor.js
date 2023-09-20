import {Object3D} from "../../../libs/three/core/Object3D.js";
import { GameWalkGrid } from "../gameworld/GameWalkGrid.js";
import { Vector3 } from "../../../libs/three/math/Vector3.js";

let tempVec = new Vector3();

class GameActor {
    constructor(config) {
        this.activated = false;
        this.actorObj3d = new Object3D();
        this.config = config;
        this.visualGamePiece = null;

        this.gameWalkGrid = new GameWalkGrid();

        let setAsSelection = function () {

        }.bind(this);

        let updateGameActor = function() {
            this.updateGameActor();
        }.bind(this);

        this.call = {
            setAsSelection:setAsSelection,
            updateGameActor:updateGameActor
        }
    }

    getGameWalkGrid() {
        return this.gameWalkGrid;
    }

    getPos() {
        return this.gameWalkGrid.getGridMovementObj3d().position;
    }

    getQuat() {
        return this.gameWalkGrid.getGridMovementObj3d().quaternion;
    }

    inspectTilePath(tilePath) {
        if (tilePath.pathTiles.length > 1) {
            tempVec.copy(tilePath.getEndTile().getPos());
            tempVec.y = this.actorObj3d.position.y;
            this.actorObj3d.lookAt(tempVec)
        }
    };

    setVisualGamePiece(visualGamePiece) {
        visualGamePiece.setVisualPieceObj3d(this.actorObj3d);
        this.visualGamePiece = visualGamePiece;
    }

    getVisualGamePiece() {
        return this.visualGamePiece;
    }

    showGameActor() {
        this.visualGamePiece.attachModelAsset();
    }

    activateGameActor() {
        if (!this.activated) {
            this.visualGamePiece.attachModelAsset();
            GameAPI.registerGameUpdateCallback(this.call.updateGameActor);
        }
        this.activated = true;
    }

    deactivateGameActor() {
        this.visualGamePiece.removeVisualGamePiece();
        GameAPI.unregisterGameUpdateCallback(this.call.updateGameActor);
        this.activated = false;
    }

    getPointAtDistanceAhead(distance) {
        tempVec.set(0, 0, distance);
        tempVec.applyQuaternion(this.actorObj3d.quaternion);
        tempVec.add(this.actorObj3d.position);
        return tempVec;
    }

    getForward() {
        tempVec.set(0, 0, 1);
        tempVec.applyQuaternion(this.actorObj3d.quaternion);
        return tempVec;
    }

    updateGameActor = function() {
        tempVec.copy(this.getPos());
        if (MATH.distanceBetween(tempVec, this.actorObj3d.position) > 0.001) {
            this.actorObj3d.position.y = tempVec.y;
            this.actorObj3d.lookAt(tempVec)
        }
        this.actorObj3d.position.copy(tempVec)

        let isLeaping = this.gameWalkGrid.dynamicWalker.isLeaping;
        if (isLeaping) {
            this.visualGamePiece.setMoveState('STAND_COMBAT')
            this.visualGamePiece.setBodyState('DISENGAGING')
        } else {
            this.visualGamePiece.setMoveState('MOVE')
            this.visualGamePiece.setBodyState('IDLE_HANDS')
        }

    }

}

export { GameActor }