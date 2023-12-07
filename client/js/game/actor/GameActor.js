import { Object3D } from "../../../libs/three/core/Object3D.js";
import { GameWalkGrid } from "../gameworld/GameWalkGrid.js";
import { Vector3 } from "../../../libs/three/math/Vector3.js";
import {Quaternion} from "../../../libs/three/math/Quaternion.js";
import { poolFetch, poolReturn } from "../../application/utils/PoolUtils.js";
import { ActorTurnSequencer } from "./ActorTurnSequencer.js";
import { ActorStatus } from "./ActorStatus.js";
import { ControlState} from "../piece_functions/ControlState.js";
import { ActorText } from "../../application/ui/gui/game/ActorText.js";
import { ActorMovement } from "./ActorMovement.js";
import { TravelMode } from "./TravelMode.js";
import { ActorEquipment } from "./ActorEquipment.js";
import { ActorStatusProcessor } from "./ActorStatusProcessor.js";
import {StatusFeedback} from "../visuals/StatusFeedback.js";

// let index = 1; // zero index get culled by connection
let tempVec = new Vector3();
let tempStore = [];
let tempObj = new Object3D();
let tempObj2 = new Object3D();
let tempQuat = new Quaternion();

let broadcastTimeout;
let lastSendTime = 0;
class GameActor {
    constructor(index, config, parsedEquipSlotData) {

        this.id = index+"_"+client.getStamp();
        this.index = index;

        this.framePos = new Vector3();
        this.lastFramePos = new Vector3();

        this.actorStatusProcessor = new ActorStatusProcessor();
        this.actorText = new ActorText(this);
        this.actorStatus = new ActorStatus(this);
        this.statusFeedback = new StatusFeedback();
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

        this.lastSendTime = 0;

        this.activeActions = [];

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
            // skeleton not always ready here...
            this.actorEquipment.activateActorEquipment(this, this.config['equip_slots'])
            this.activated = true;
            GameAPI.registerGameUpdateCallback(updateGameActor);
        }.bind(this);

        let onVisualAdded = function() {
            // add equipment here after visual has loaded skeleton...
        }.bind(this)

        let getActorPos = function() {
            return this.getSpatialPosition();
        }.bind(this);

        this.turnEndCallbacks = [];

        let turnEnd = function() {
            while (this.turnEndCallbacks.length) {
                let cb = this.turnEndCallbacks.pop();
                if (typeof (cb) === 'function') {
                    cb (this);
                } else {
                    console.log("Turn end CB not function... ")
                }
            }

            this.setStatusKey(ENUMS.ActorStatus.TURN_DONE, this.getStatus(ENUMS.ActorStatus.HAS_TURN_INDEX))
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

        let remote = null;

        function setRemote(rem) {
            remote = rem;
        }

        function getRemote() {
            return remote;
        }

        let remove = function() {
            this.removeGameActor();
        }.bind(this);


        let getActionByKey = function(actionKey, actorStatusKey) {
            for (let i = 0; i < this.activeActions.length; i++) {
                if (this.activeActions[i].getActionKey() === actionKey) {
                    return this.activeActions[i];
                }
            }
            let actionKeys = this.getStatus(ENUMS.ActorStatus[actorStatusKey]);
            if (actionKeys.indexOf(actionKey) !== -1) {
                return true
            } else {
                return false;
            }
        }.bind(this);

        let deactivateAction = function(actor, action) {
            actor.actorText.say("Action Completed")
            MATH.splice(this.activeActions, action);
        }.bind(this);

        let activateActionKey = function(actionKey, actorStatusKey) {
            let action = poolFetch('ActorAction');

            if (actorStatusKey === ENUMS.ActorStatus.TRAVEL) {
                while (this.activeActions.length) {
                    this.activeActions.pop().call.updateActionCompleted();
                }

                let deactivateTravel = function() {
                    this.setStatusKey(ENUMS.ActorStatus.TRAVEL_MODE, ENUMS.TravelMode.TRAVEL_MODE_INACTIVE)
                }.bind(this)
                action.onCompletedCallbacks.push(deactivateTravel);
            }

            this.activeActions.push(action);
            action.setActionKey(this, actionKey);
            action.onCompletedCallbacks.push(deactivateAction);
            return action;
        }.bind(this);

        this.call = {
            setRemote:setRemote,
            getRemote:getRemote,
            getActionByKey:getActionByKey,
            activateActionKey:activateActionKey,
            remove:remove,
            turnEnd:turnEnd,
            onActive:onActive,
            onVisualAdded:onVisualAdded,
            setAsSelection:setAsSelection,
            updateGameActor:updateGameActor,
            getActorPos:getActorPos,
            setSpatialTransition:setSpatialTransition,
            getActiveSpatialTransition:getActiveSpatialTransition
        }
    }

    isPlayerActor() {
        if (this.call.getRemote() === null) {
            let isParty = GameAPI.getGamePieceSystem().isPlayerPartyActor(this);
            if (isParty) {
                if (this.call.getRemote()) {
                    return false;
                }
                return true;
            }
        }
        return false;
    }

    rollInitiative() {
        this.setStatusKey(ENUMS.ActorStatus.SEQUENCER_INITIATIVE, Math.random())
    }

    startPlayerTurn(turnEndedCB, turnIndex) {
        if (this.call.getRemote() === null) {
            GameAPI.getGamePieceSystem().setSelectedGameActor(this);
        }

        this.turnEndCallbacks.push(turnEndedCB);
        this.setStatusKey(ENUMS.ActorStatus.HAS_TURN, true);
        this.setStatusKey(ENUMS.ActorStatus.PARTY_SELECTED, true);
        this.setStatusKey(ENUMS.ActorStatus.HAS_TURN_INDEX, turnIndex)
    //    evt.dispatch(ENUMS.Event.SET_CAMERA_MODE, {mode:'game_travel'})
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

    checkBroadcast(actor) {

        if (actor) {
            if (actor.call.getRemote()) {
                return false;
            }

            if (typeof(actor.getSTatus) === 'function') {
                let clientStamp =client.getStamp();
                let actorClientStamp = actor.getStatus(ENUMS.ActorStatus.CLIENT_STAMP)
                if (clientStamp !== actorClientStamp) {
                    return false;
                }
            }
        }

        let encounterHosted = false;
        let dynEnc = GameAPI.call.getDynamicEncounter()
        if (dynEnc) {
            let encActors = dynEnc.status.call.getStatus(ENUMS.EncounterStatus.ENCOUNTER_ACTORS)
            if (encActors.indexOf(this.id) !== -1) {
                encounterHosted = true;
            }
        }

        if (encounterHosted || this.isPlayerActor()) {
            return true;
        } else {
            return false;
        }

    }

    sendStatus(delay) {

        if (this.checkBroadcast(this)) {
            this.actorStatus.setStatusKey(ENUMS.ActorStatus.CLIENT_STAMP, client.getStamp());
            let gameTime = GameAPI.getGameTime();
            if (this.lastSendTime < gameTime -delay) {
                this.actorStatus.broadcastStatus(gameTime);
                this.lastSendTime = gameTime;
            }
        }
    }

    setStatusKey(key, status) {

        let currentStatus = this.actorStatus.getStatusByKey(key)

        if (currentStatus !== status) {

            this.statusFeedback.setStatusKey(key, status, this);
            this.actorStatus.setStatusKey(key, status);
            this.sendStatus(0.05)

        }   else {

            this.sendStatus(2)

        }

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
        this.call.onVisualAdded();
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
        this.actorEquipment.call.showEquipment()
    }

    hideGameActor() {

        this.visualGamePiece.call.hideVisualPiece();
        this.actorEquipment.call.hideEquipment()
        //    this.actorEquipment.call.showEquipment()
    }

    activateGameActor(onActorReady) {
        this.setStatusKey(ENUMS.ActorStatus.IS_ACTIVE, 1);
        this.setStatusKey(ENUMS.ActorStatus.EXISTS, 1);
        this.actorTurnSequencer.setGameActor(this);
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
        this.setStatusKey(ENUMS.ActorStatus.IS_ACTIVE, 0);
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

    leavePlayerParty() {
        let removedPartyActor = GameAPI.getGamePieceSystem().playerParty.removePartyActor(this)
    }

    removeGameActor() {
        this.setStatusKey(ENUMS.ActorStatus.EXISTS, 0);
        this.leavePlayerParty()
        let actors = GameAPI.getGamePieceSystem().getActors();
        MATH.splice(actors, this);
        this.deactivateGameActor()
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

    setDestination(posVec) {
        let destination = this.actorStatus.getStatusByKey(ENUMS.ActorStatus.SELECTED_DESTINATION);
        MATH.vec3ToArray(posVec, destination);
        this.actorStatus.setStatusKey(ENUMS.ActorStatus.SELECTED_DESTINATION, destination);
    }

    getDestination(storeVec) {
        if (!storeVec) {
            storeVec = tempVec;
        }
        let destination = this.actorStatus.getStatusByKey(ENUMS.ActorStatus.SELECTED_DESTINATION);
        MATH.vec3FromArray(storeVec, destination);
        return storeVec;
    }

    setSpatialVelocity(velVec) {
    //    let pos = this.getSpatialPosition();
    //    pos.add(velVec),
    //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:pos, color:'GREEN', size:0.35})
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
    //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:posVec, color:'WHITE', size:0.35})
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

    getHeadPosition() {
        let pos = this.getSpatialPosition()
        pos.y += this.getStatus(ENUMS.ActorStatus.HEIGHT);
        return pos;
    }

    transitionTo(pos, time) {

        let onCompleted = function() {
            poolReturn(transition);
        }

        let onUpdate = function(pos) {
            this.setSpatialPosition(pos);
        }.bind(this);

        let transition = poolFetch('SpatialTransition');
        transition.targetPos.copy(pos);
        transition.initSpatialTransition(this.actorObj3d.position, transition.targetPos, time, onCompleted, null, null, onUpdate)

    }

    getSpatialScale(store) {
        return this.actorStatus.getStatusScale(store);
    }

    updateGameActor(tpf) {

        let remote = this.call.getRemote()
        this.getSpatialPosition(this.framePos);

        if (remote === null) {

            if (this.getStatus(ENUMS.ActorStatus.TRAVEL_MODE) === ENUMS.TravelMode.TRAVEL_MODE_FLY) {

                this.getSpatialVelocity(this.lookDirection);
                this.framePos.add(this.lookDirection);
                this.setSpatialPosition(this.framePos);

            } else {
                if (this.lastFramePos.length() === 0) {
                    this.lastFramePos.copy(this.framePos);
                }

                tempVec.copy(this.framePos);
                tempVec.sub(this.lastFramePos);
                this.setSpatialPosition(this.framePos);
                let speed = tempVec.length();
                if (speed > 100) {
                    console.log("bad speed")
                }

                this.setSpatialVelocity(tempVec);
                //    console.log(tempVec.length())
                //    this.framePos.add(tempVec);

                if (speed < 0.001) {
                    this.setStatusKey(ENUMS.ActorStatus.FRAME_TRAVEL_DISTANCE, 0);
                } else {
                    this.setStatusKey(ENUMS.ActorStatus.FRAME_TRAVEL_DISTANCE, speed);
                    //    tempVec.add(this.framePos);
                    // this.lookDirection.copy(tempVec);
                    this.getSpatialVelocity(this.lookDirection)
                    this.lookDirection.y = 0;

                }

                this.applyHeading(this.lookDirection, this.getStatus(ENUMS.ActorStatus.ACTOR_YAW_RATE) * tpf);
            }


            this.travelMode.updateTravelMode(this);
        } else {

        //    let now = GameAPI.getGameTime();
            let fraction = tpf/remote.timeDelta;
        //    this.getSpatialPosition(this.framePos);
            remote.lastUpdate.vel.lerp(remote.vel, fraction);


            this.setSpatialVelocity(remote.lastUpdate.vel);
            remote.lastUpdate.scale.lerp(remote.scale, fraction);
            this.setSpatialScale(remote.lastUpdate.scale);
            remote.lastUpdate.pos.lerp(remote.pos, fraction);
            this.framePos.copy(remote.lastUpdate.pos);
            remote.lastUpdate.quat.slerp(remote.quat, fraction);

            this.setSpatialQuaternion(remote.lastUpdate.quat);
            this.setSpatialPosition(this.framePos);
        }

        tempObj.position.copy(this.framePos);

        this.lastFramePos.copy(this.framePos);
        this.getSpatialQuaternion(tempObj.quaternion);
        if (this.visualGamePiece.hidden === false) {
            this.visualGamePiece.getSpatial().stickToObj3D(tempObj)
        }

        this.actorStatusProcessor.processActorStatus(this);

    }

}

export { GameActor }