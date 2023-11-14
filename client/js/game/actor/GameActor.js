import {Object3D} from "../../../libs/three/core/Object3D.js";
import { GameWalkGrid } from "../gameworld/GameWalkGrid.js";
import { Vector3 } from "../../../libs/three/math/Vector3.js";
import { poolFetch, poolReturn } from "../../application/utils/PoolUtils.js";
import { ActorTurnSequencer } from "./ActorTurnSequencer.js";
import { ActorStatus } from "./ActorStatus.js";
import { ControlState} from "../piece_functions/ControlState.js";
import { ActorText } from "../../application/ui/gui/game/ActorText.js";
import { ActorMovement } from "./ActorMovement.js";
import { TravelMode } from "./TravelMode.js";
import { ActorEquipment } from "./ActorEquipment.js";

let index = 0;
let tempVec = new Vector3();
let tempStore = [];

class GameActor {
    constructor(config) {
        this.index = index;
        index++;
        this.actorText = new ActorText(this);
        this.actorStatus = new ActorStatus();
        this.controlState = new ControlState();
        this.travelMode = new TravelMode();
        this.actorMovement = new ActorMovement();
        this.activated = false;
        this.actorObj3d = new Object3D();
        this.config = config;
        this.actorEquipment = new ActorEquipment()
        this.visualGamePiece = null;

        this.velocity = new Vector3()

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
            this.actorEquipment.activateActorEquipment(this, this.config['equip_slots'])
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
            this.setStatusKey(ENUMS.ActorStatus.HAS_TURN, false);
            this.setStatusKey(ENUMS.ActorStatus.PARTY_SELECTED, false);
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
        GameAPI.getGamePieceSystem().setSelectedGameActor(this);
        this.turnEndCallbacks.push(turnEndedCB);
        this.setStatusKey(ENUMS.ActorStatus.HAS_TURN, true);
        this.setStatusKey(ENUMS.ActorStatus.PARTY_SELECTED, true);
        this.setStatusKey(ENUMS.ActorStatus.TURN_DONE, turnIndex)
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
        MATH.emptyArray(tempStore)
        this.actorEquipment.call.getEquipmentStatusKey(key, tempStore);
        let status = this.actorStatus.getStatusByKey(key);
        if (tempStore.length) {

            if (status.length) {
                for (let i = 0; i < status.length; i++) {
                    tempStore.push(status[i])
                }
                return tempStore;
            } else if (typeof(status) === 'number') {
                while (tempStore.length) {
                    status+=tempStore.pop();
                }
            }
        }
        return status;
    }

    setControlKey(key, status) {
        return this.controlState.setControlByKey(key, status);
    }

    getControl(key) {
        return this.controlState.getControlByKey(key);
    }

    getPos() {
        return this.gameWalkGrid.getGridMovementObj3d().position;
    }


    setVelocity(vec3) {
        this.velocity.copy(vec3);
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

    equipItem(item) {
        this.actorEquipment.call.equipActorItem(item);
    }

    getVisualGamePiece() {
        return this.visualGamePiece;
    }

    showGameActor() {
        this.visualGamePiece.call.showVisualPiece();
        //    this.actorEquipment.call.hideEquipment()
    //    this.actorEquipment.call.showEquipment()
    }

    hideGameActor() {
        this.visualGamePiece.call.hideVisualPiece();
    //    this.actorEquipment.call.hideEquipment()
        //    this.actorEquipment.call.showEquipment()
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

    activateWalkGrid(tileRange) {
        let gameWalkGrid = this.getGameWalkGrid()
        gameWalkGrid.activateWalkGrid(this.actorObj3d, tileRange)
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

        this.travelMode.updateTravelMode(this);

        this.getPos().add(this.velocity);

        if (this.velocity.length() < 0.001) {
            if (MATH.distanceBetween(this.getPos(), this.actorObj3d.position) > 0.001) {
                this.turnTowardsPos(this.getPos())
            }
        } else {
            ThreeAPI.getCameraCursor().getPos().copy(this.getPos())
            this.visualGamePiece.getSpatial().stickToObj3D(this.actorObj3d)
        //    this.turnTowardsPos(this.velocity)
        }

        this.actorObj3d.position.copy(this.getPos())

        let isLeaping = this.gameWalkGrid.dynamicWalker.isLeaping;
        if (isLeaping) {
            this.visualGamePiece.setMoveState('STAND_COMBAT')
            this.visualGamePiece.setBodyState('DISENGAGING')
        } else {
            if (this.getStatus(ENUMS.ActorStatus.IN_COMBAT)) {
                this.visualGamePiece.setMoveState('MOVE_COMBAT')
                this.visualGamePiece.setStandState('STAND_COMBAT')
                this.visualGamePiece.setBodyState('ENGAGING')
            } else {
                this.visualGamePiece.setMoveState('MOVE')
                this.visualGamePiece.setStandState('IDLE_LEGS')
                this.visualGamePiece.setBodyState('IDLE_HANDS')
            }


        }

    }

}

export { GameActor }