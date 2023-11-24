import { Object3D } from "../../../libs/three/core/Object3D.js";
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
import { ActorStatusProcessor } from "./ActorStatusProcessor.js";

let index = 1; // zero index get culled by connection
let tempVec = new Vector3();
let tempStore = [];
let tempObj = new Object3D();
let tempObj2 = new Object3D();

let broadcastTimeout;
let lastSendTime = 0;
class GameActor {
    constructor(config, parsedEquipSlotData) {
        this.index = index;
        index++;

        this.framePos = new Vector3();

        this.actorStatusProcessor = new ActorStatusProcessor();
        this.actorText = new ActorText(this);
        this.actorStatus = new ActorStatus();
        this.controlState = new ControlState();
        this.travelMode = new TravelMode();
        this.actorMovement = new ActorMovement();
        this.activated = false;
        this.actorObj3d = new Object3D();
        this.config = config;
        this.actorEquipment = new ActorEquipment(parsedEquipSlotData)
        this.visualGamePiece = null;

        this.lookDirection = new Vector3()

        this.gameWalkGrid = new GameWalkGrid();

        this.actorTurnSequencer = new ActorTurnSequencer()
        this.actorTurnSequencer.setGameActor(this);

        let setAsSelection = function () {

        }.bind(this);

        let updateGameActor = function(tpf) {
            this.updateGameActor(tpf);
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
            return this.getSpatialPosition();
        }.bind(this);

        this.turnEndCallbacks = [];

        let turnEnd = function() {
            while (this.turnEndCallbacks.length) {
                this.turnEndCallbacks.pop()(this);
            }
            this.setStatusKey(ENUMS.ActorStatus.HAS_TURN, false);
            this.setStatusKey(ENUMS.ActorStatus.PARTY_SELECTED, false);
        }.bind(this)


        let spatialTransition;
        let setSpatialTransition = function(transition) {
            spatialTransition = transition;
        }

        let getActiveSpatialTransition = function() {
            return spatialTransition;
        }

        this.call = {
            turnEnd:turnEnd,
            onActive:onActive,
            setAsSelection:setAsSelection,
            updateGameActor:updateGameActor,
            getActorPos:getActorPos,
            setSpatialTransition:setSpatialTransition,
            getActiveSpatialTransition:getActiveSpatialTransition
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

        if (this.isPlayerActor()) {
            this.actorStatus.setStatusKey(ENUMS.ActorStatus.CLIENT_STAMP, client.getStamp());
            this.actorStatus.setStatusKey(ENUMS.ActorStatus.ACTOR_INDEX, this.index);
            let gameTime = GameAPI.getGameTime();
            if (lastSendTime < gameTime -0.05) {
                this.actorStatus.broadcastStatus(gameTime);
                lastSendTime = gameTime;
            }
        }

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
        //    return this.actorObj3d.position;
        console.log("actor getPos()")
        return this.gameWalkGrid.getGridMovementObj3d().position;
    }


    getQuat() {
        console.log("actor getQuat()")
        return this.gameWalkGrid.getGridMovementObj3d().quaternion;
    }

    getObj3d() {
        console.log("actor getObj3d()")
        return this.gameWalkGrid.getGridMovementObj3d();
    }


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
        let equippedList = this.getStatus(ENUMS.ActorStatus.EQUIPPED_ITEMS);
        equippedList.push(item.configId);
    }

    unequipItem(item) {
        this.actorEquipment.call.unequipActorItem(item);
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

    activateGameActor(onActorReady) {
        if (!this.activated) {
        //    this.updateGameActor()

            let onReady = function() {
                this.call.onActive()
                if (typeof (onActorReady) === 'function') {
                    onActorReady(this);
                }

            }.bind(this)

            this.visualGamePiece.attachModelAsset(onReady);

        } else {
            this.activated = true;
        }

    }

    deactivateGameActor() {
        if (this.activated === true) {
            this.actorEquipment.removeAllItems();
            this.visualGamePiece.removeVisualGamePiece();
            GameAPI.unregisterGameUpdateCallback(this.call.updateGameActor);
            this.activated = false;
            this.actorStatusProcessor.clearActorStatus(this);
        } else {
            this.preDeactivated = true;
        }

    }

    activateWalkGrid(tileRange, onActiveCB) {
        let gameWalkGrid = this.getGameWalkGrid()
        gameWalkGrid.activateWalkGrid(this, tileRange, onActiveCB)
        gameWalkGrid.call.updateWalkGrid()
    }

    prepareTilePath(toPos) {
        let gameWalkGrid = this.getGameWalkGrid()
        gameWalkGrid.buildGridPath(toPos, this.getSpatialPosition())
    }

    moveActorOnGridTo(pos, onMoveEnded) {
        let gameWalkGrid = this.getGameWalkGrid()
        gameWalkGrid.buildGridPath(pos, this.getSpatialPosition())
        gameWalkGrid.applySelectedPath(null, onMoveEnded )
    }

    getForward() {
        tempVec.set(0, 0, 1);
        this.getSpatialQuaternion(tempObj)
        tempVec.applyQuaternion(tempObj);
        return tempVec;
    }

    getActorGridMovementTargetPosition() {
        let tiles = GameAPI.call.getActiveEncounter().getRandomWalkableTiles(2);
        if (tiles[0] === this.gameWalkGrid.getTileAtPosition(this.getSpatialPosition())) {
            return tiles[1].getPos()
        } else {
            return tiles[0].getPos()
        }
    }

    turnTowardsPos(posVec) {
        this.lookDirection.copy(posVec);
        this.getSpatialPosition(tempVec)
        this.lookDirection.y = tempVec.y;
        this.lookDirection.sub(tempVec);
    }

    applyHeading(direction, alpha) {
        tempObj.position.set(0, 0, 0)
        tempObj.lookAt(direction);
        this.getSpatialQuaternion(tempObj2.quaternion)
        tempObj2.quaternion.slerp(tempObj.quaternion, alpha || 0.1)
        this.setSpatialQuaternion(tempObj2.quaternion);
    }

    setSpatialVelocity(velVec) {
        MATH.testVec3ForNaN(velVec)
        this.actorStatus.setStatusVelocity(velVec);
    }

    getSpatialVelocity(store) {
        return this.actorStatus.getStatusVelocity(store);
    }

    setSpatialQuaternion(quat) {
        this.actorObj3d.quaternion.copy(quat)
        this.actorStatus.setStatusQuaternion(quat);
    }

    getSpatialQuaternion(store) {
        return this.actorStatus.getStatusQuaternion(store);
    }

    setSpatialPosition(posVec) {
        this.actorObj3d.position.copy(posVec)
        this.actorStatus.setStatusPosition(posVec);
    }

    getSpatialPosition(store) {
        return this.actorStatus.getStatusPosition(store);
    }

    setSpatialScale(scaleVec) {
        this.actorStatus.setStatusScale(scaleVec);
        this.actorObj3d.position.copy(scaleVec)
    }

    getSpatialScale(store) {
        return this.actorStatus.getStatusScale(store);
    }

    updateGameActor(tpf) {

        this.travelMode.updateTravelMode(this);

        this.getSpatialVelocity(tempVec);
        this.getSpatialPosition(this.framePos);

        this.framePos.add(tempVec);
        let speed = tempVec.length();

        if (speed < 0.001) {
            this.setStatusKey(ENUMS.ActorStatus.FRAME_TRAVEL_DISTANCE, 0);
            this.applyHeading(this.lookDirection, this.getStatus(ENUMS.ActorStatus.ACTOR_YAW_RATE) * tpf);
        } else {
            this.setStatusKey(ENUMS.ActorStatus.FRAME_TRAVEL_DISTANCE, speed);
            this.turnTowardsPos(tempObj.position, MATH.clamp(speed*10, 0.05, 0.5));
        }

        this.setSpatialPosition(this.framePos);
        tempObj.position.copy(this.framePos);
        this.getSpatialQuaternion(tempObj.quaternion);
        this.visualGamePiece.getSpatial().stickToObj3D(tempObj)
        this.actorStatusProcessor.processActorStatus(this);

    }

}

export { GameActor }