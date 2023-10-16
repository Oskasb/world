import {Object3D} from "../../../libs/three/core/Object3D.js";
import { GameWalkGrid } from "../gameworld/GameWalkGrid.js";
import { Vector3 } from "../../../libs/three/math/Vector3.js";
import { poolFetch, poolReturn } from "../../application/utils/PoolUtils.js";
import { ActorTurnSequencer } from "./ActorTurnSequencer.js";
import {ActorStatus} from "./ActorStatus.js";
import { ActorText } from "../../application/ui/gui/game/ActorText.js";

let index = 0;
let tempVec = new Vector3();

class GameActor {
    constructor(config) {
        this.index = index;
        index++;
        this.actorText = new ActorText(this);
        this.actorStatus = new ActorStatus();
        this.activated = false;
        this.actorObj3d = new Object3D();
        this.config = config;
        this.visualGamePiece = null;

        this.gameWalkGrid = new GameWalkGrid();

        this.actorTurnSequencer = new ActorTurnSequencer()
        this.actorTurnSequencer.setGameActor(this);

        let setAsSelection = function () {

        }.bind(this);

        let updateGameActor = function() {
            this.updateGameActor();
        }.bind(this);

        let onActive = function() {
            if (this.preDeactivated) {
                console.log("Pre Deactivated happened, fix callback chain..")
                return;
            }
            this.activated = true;
            GameAPI.registerGameUpdateCallback(updateGameActor);
        }.bind(this);

        let getActorPos = function() {
            return this.actorObj3d.position;
        }.bind(this);

        this.turnEndCallbacks = [];

        let turnEnd = function() {
            while (this.turnEndCallbacks.length) {
                this.turnEndCallbacks.pop()(this);
            }
        }.bind(this)

        this.call = {
            turnEnd:turnEnd,
            onActive:onActive,
            setAsSelection:setAsSelection,
            updateGameActor:updateGameActor,
            getActorPos:getActorPos
        }
    }

    isPlayerActor() {
        return GameAPI.getGamePieceSystem().isPlayerPartyActor(this)
    }

    startPlayerTurn(turnEndedCB, turnIndex) {
        this.turnEndCallbacks.push(turnEndedCB);
        this.setStatusKey('has_turn', true);
        this.setStatusKey('party_selected', true);
        this.setStatusKey('turn_done', turnIndex)
        evt.dispatch(ENUMS.Event.SET_CAMERA_MODE, {mode:'game_travel'})
    }

    getGameWalkGrid() {
        return this.gameWalkGrid;
    }

    getActorTurnSequencer() {
        return this.actorTurnSequencer;
    };

    getVisualJointWorldTransform(jointKey, storeObj3d) {
        this.getVisualGamePiece().getModel().getJointKeyWorldTransform(jointKey, storeObj3d);
    }

    setStatusKey(key, status) {
        return this.actorStatus.setStatusKey(key, status);
    }

    getStatus(key) {
        return this.actorStatus.getStatusByKey(key);
    }

    getPos() {
        return this.gameWalkGrid.getGridMovementObj3d().position;
    }



    getQuat() {
        return this.gameWalkGrid.getGridMovementObj3d().quaternion;
    }

    getObj3d() {
        return this.gameWalkGrid.getGridMovementObj3d();
    }

    inspectTilePath(tilePath) {
        if (tilePath.pathTiles.length > 1) {
            tempVec.copy(tilePath.getEndTile().getPos());
            tempVec.y = this.actorObj3d.position.y;
            this.actorObj3d.lookAt(tempVec)
        }
    };

    setVisualGamePiece(visualGamePiece) {
        visualGamePiece.setVisualPieceActor(this);
        this.visualGamePiece = visualGamePiece;
        let visualConfig = visualGamePiece.config;

        if (visualConfig.status) {
            for (let key in visualConfig.status) {
                this.setStatusKey(key, visualConfig.status[key])
            }
        }

    }

    getVisualGamePiece() {
        return this.visualGamePiece;
    }

    showGameActor() {
        this.visualGamePiece.attachModelAsset();
    }

    activateGameActor() {
        if (!this.activated) {
        //    this.updateGameActor()
            this.visualGamePiece.attachModelAsset(this.call.onActive);

        } else {
            this.activated = true;
        }

    }

    deactivateGameActor() {
        if (this.activated === true) {
            this.visualGamePiece.removeVisualGamePiece();
            GameAPI.unregisterGameUpdateCallback(this.call.updateGameActor);
            this.activated = false;
        } else {
            this.preDeactivated = true;
        }

    }

    activateWalkGrid() {
        let gameWalkGrid = this.getGameWalkGrid()
        gameWalkGrid.activateWalkGrid(this.actorObj3d)
        gameWalkGrid.call.updateWalkGrid()
    }

    prepareTilePath(toPos) {
        let gameWalkGrid = this.getGameWalkGrid()
        gameWalkGrid.buildGridPath(toPos, this.getPos())
        this.inspectTilePath(gameWalkGrid.getActiveTilePath())
    }

    moveActorOnGridTo(pos, onMoveEnded) {
        let gameWalkGrid = this.getGameWalkGrid()
        gameWalkGrid.buildGridPath(pos, this.getPos())
        gameWalkGrid.applySelectedPath(null, onMoveEnded )
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

    getActorGridMovementTargetPosition() {
        let tiles = GameAPI.call.getActiveEncounter().getRandomWalkableTiles(2);

        if (tiles[0] === this.gameWalkGrid.getTileAtPosition(this.getPos())) {
            return tiles[1].getPos()
        } else {
            return tiles[0].getPos()
        }

    }

    turnTowardsPos(posVec) {
        tempVec.copy(posVec);
        tempVec.y = this.actorObj3d.position.y
        this.actorObj3d.lookAt(tempVec)
    }

    updateGameActor = function() {

        if (MATH.distanceBetween(this.getPos(), this.actorObj3d.position) > 0.001) {
            this.turnTowardsPos(this.getPos())
        }

        this.actorObj3d.position.copy(this.getPos())

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