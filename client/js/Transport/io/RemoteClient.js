import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";
import {Vector3} from "../../../libs/three/math/Vector3.js";
import {Quaternion} from "../../../libs/three/math/Quaternion.js";
import {DynamicEncounter} from "../../game/encounter/DynamicEncounter.js";
import {Remote} from "./Remote.js";
import {ActorAction} from "../../game/actor/ActorAction.js";
import {notifyCameraStatus} from "../../3d/camera/CameraFunctions.js";

let equipQueue = []
let index = 0;
let tempVec = new Vector3()
let tempQuat = new Quaternion();

function messageByKey(msg, key ) {
    let keyIndex = msg.indexOf(key);
//    console.log(keyIndex, [msg], key)
    if (keyIndex === -1) {
        return null;
    }
    return msg[keyIndex+1];
}

let onRemoteClientActionDone = function(actingActor) {
    console.log("Remote Action Done: ", actingActor)
  //  actingActor.actorText.say('Action Done')
    // action.call.closeAttack()
}

let spatialMap = [
    ENUMS.ActorStatus.POS_X,
    ENUMS.ActorStatus.POS_Y,
    ENUMS.ActorStatus.POS_Z,
    ENUMS.ActorStatus.VEL_X,
    ENUMS.ActorStatus.VEL_Y,
    ENUMS.ActorStatus.VEL_Z,
    ENUMS.ActorStatus.SCALE_X,
    ENUMS.ActorStatus.SCALE_Y,
    ENUMS.ActorStatus.SCALE_Z,
    ENUMS.ActorStatus.QUAT_X,
    ENUMS.ActorStatus.QUAT_Y,
    ENUMS.ActorStatus.QUAT_Z,
    ENUMS.ActorStatus.QUAT_W
]


class RemoteClient {
    constructor(stamp) {
        this.index = index;
        index++
        this.isPaused = false;
        this.stamp = stamp;
        this.actors = [];
        this.actions = [];
        this.items = [];
        this.encounter = null;
        this.remoteIndex = [];
        this.closeTimeout = null;
        GuiAPI.screenText("Player Joined: "+this.index, ENUMS.Message.HINT, 4)

        let timeout = function() {
            this.closeRemoteClient();
        }.bind(this)

        this.call = {
            timeout:timeout
        }

    }

    getActorByIndex(index) {
        for (let i = 0; i < this.actors.length; i++) {
            if (this.actors[i].index === index) {
                return this.actors[i];
            }
        }
    }

    getActorById(id) {
        for (let i = 0; i < this.actors.length; i++) {
            let actor = this.actors[i];
            if (actor.id === id) {
                return this.actors[i];
            }
        }
    }

    getActionById(id) {
        for (let i = 0; i < this.actions.length; i++) {
            let action = this.actions[i];
            if (action.id === id) {
                return this.actions[i];
            }
        }
    }

    getItemById(id) {
        for (let i = 0; i < this.items.length; i++) {
            let item = this.items[i];
            if (item.id === id) {
                return this.items[i];
            }
        }
    }

    applyRemoteSpatial(actor, timeDelta) {

        let remote = actor.call.getRemote();
        if (MATH.distanceBetween(remote.pos, remote.lastUpdate.pos) > 50) {
            remote.copyLastFrame();
        }

        tempQuat.copy(remote.quat)
        actor.getSpatialScale(remote.scale);
        remote.timeDelta = timeDelta;
    /*
        tempVec.copy(remote.pos);
        tempVec.add(remote.vel);
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:remote.pos, to:tempVec, color:'GREEN', drawFrames:Math.floor(timeDelta/GameAPI.getFrame().tpf)});
   */
    }


    applyRemoteEquipment(actor) {
        let equippedList = actor.getStatus(ENUMS.ActorStatus.EQUIPPED_ITEMS);
        let actorItems = actor.actorEquipment.items;

        let equipCb = function(item) {
            equipQueue.splice(equipQueue.indexOf(item.configId))
            actor.equipItem(item);
        }

        for (let i = 0; i < equippedList.length; i++) {
            let isEquipped = false;
            for (let j = 0; j < actorItems.length; j++) {
                if (actorItems[j].configId === equippedList[i]) {
                    isEquipped = true;
                }
            }

            if (isEquipped === false) {
                if (equipQueue.indexOf(equippedList[i]) === -1) {
                 //   console.log("EQUIP: ", equippedList[i])
                    equipQueue.push(equippedList[i])
                    evt.dispatch(ENUMS.Event.LOAD_ITEM, {id: equippedList[i], callback:equipCb})
                }
            }
        }

        for (let i = 0; i < actorItems.length; i++) {
            if (equippedList.indexOf(actorItems[i].configId) === -1) {
                actor.unequipItem(actorItems[i])
            }
        }
    }

    deactivateEncounter() {
    //    GuiAPI.screenText(status+" BATTLE")
        let actorList = this.encounter.status.call.getStatus(ENUMS.EncounterStatus.ENCOUNTER_ACTORS)
        //    console.log("DEACTIVATING: ", actorList, this.actors)
        for (let i = 0; i < actorList.length; i++) {
            let actor = this.getActorById(actorList[i])
            MATH.splice(this.actors, actor);
            if (typeof (actor) === 'object') {
                MATH.splice(this.remoteIndex, actor.id);
                actor.call.remove()
            } else {
                console.log("Bad remote actor removal ", actorList[i], this.actors);
            }
        }
        this.encounter = null;
    }

    handleItemMessage(itemId, msg) {

    //    console.log("Item Messasge", msg);

        let item = this.getItemById(itemId);

        if (!item) {
            if (msg.indexOf(ENUMS.ItemStatus.ACTOR_ID) !== -1) {
                let actorId = msg[msg.indexOf(ENUMS.ItemStatus.ACTOR_ID) +1]
                let actor = this.getActorById(actorId);

                if (!actor) {
                    GuiAPI.screenText("Item before Actor "+this.index,  ENUMS.Message.SYSTEM, 1.5)
                    return;
                }

                if (msg.indexOf(ENUMS.ItemStatus.EQUIPPED_SLOT) !== -1) {
                    let idIdx = msg.indexOf(ENUMS.ItemStatus.EQUIPPED_SLOT)+1
                    let slotId = msg[idIdx]
                    item = actor.actorEquipment.getEquippedItemBySlotId(slotId);
                    if (item) {
                        item.id = itemId;
                        ThreeAPI.unregisterPostrenderCallback(item.status.call.pulseStatusUpdate);
                        this.items.push(item);
                    } else {
                        console.log("Item not equipped as expected..")
                        return;
                    }
                }
            }
        }

        if (msg.indexOf(ENUMS.ItemStatus.PALETTE_VALUES) !== -1) {
            let valueIdx = msg.indexOf(ENUMS.ItemStatus.PALETTE_VALUES)+1
            let paletteValues = msg[valueIdx]
            if (paletteValues.length === 8) {
                let actorId = msg[msg.indexOf(ENUMS.ItemStatus.ACTOR_ID) +1]
                let actor = this.getActorById(actorId);
                item.getVisualGamePiece().visualModelPalette.setFromValuearray(paletteValues);
                let instance = item.getVisualGamePiece().call.getInstance()
                if (instance) {
                    item.getVisualGamePiece().visualModelPalette.applyPaletteToInstance(instance)
                } else {
                    console.log("Remote item expects instance here")
                }

            }

        }

    }

    handleActionMessage(actionId, msg) {

        if (actionId === "none") {
            return;
        }

        let action = this.getActionById(actionId);
        if (!action) {
            action = poolFetch('ActorAction');
            action.id = actionId;
       //     console.log("Start new Action ", actionId)
            this.actions.push(action);
            action.isRemote = true;
        }

        for (let i = 0; i < msg.length; i++) {
            let key = msg[i];
            i++
            let status = msg[i]
            action.call.setStatusKey(key, status);
        }

        let actorKey = action.call.getStatus(ENUMS.ActionStatus.ACTOR_ID)
        if (actorKey === "none" ) {
        //    GuiAPI.screenText("SYNC ACTION "+this.index,  ENUMS.Message.SYSTEM, 1.5)
            // console.log("No Actor Key yet", msg);
            return;
        }

        let actor = this.getActorById(actorKey);
        if (!actor) {
            GuiAPI.screenText("No Actor "+this.index,  ENUMS.Message.SYSTEM, 1.5)
            // console.log("No such actor... ", msg);
            return;
        } else {
            if (action.initiated === false) {
                let actionKey = action.call.getStatus(ENUMS.ActionStatus.ACTION_KEY);
            //    action.call.initStatus(actor, actionKey)
                if (actionKey === "none") {
                    GuiAPI.screenText("No Action Key "+this.index,  ENUMS.Message.SYSTEM, 1.5)
           //         console.log("No key yet")
                    return;
                }
                action.setActionKey(actor, actionKey)

                let getActionByKey = function(key) {
                    if (key === actorKey) {
                        return action;
                    }
                };

                actor.call.getRemote().call.setGetActionFunction(getActionByKey);
            }
        }

        let actionState = action.call.getStatus(ENUMS.ActionStatus.ACTION_STATE)

        if (action.remoteState === actionState) {
            return;
        } else {
            action.remoteState = actionState;
        }

        let actionStateKey = ENUMS.getKey('ActionState', actionState)

    //    console.log("Remote Action State", actionStateKey ,actionState, msg);

        if (actionState === 1) {
        //    console.log("Status Map:", action.state.statusMap);
        }

        if (actionState === ENUMS.ActionState.SELECTED) {

            action.call.updateActivate();
            GuiAPI.screenText("ACTION SELECTED "+this.index,  ENUMS.Message.SYSTEM, 1.2)
        //    console.log("Remote Action State: SELECTED", actionState, action.status);
        }

        if (actionState === ENUMS.ActionState.PRECAST) {
        //    console.log("Remote Action State: PRECAST", actionState, msg);
        }

        if (actionState === ENUMS.ActionState.ACTIVE) {
        //    console.log("Remote Action State: ACTIVE", actionState, msg);
            action.visualAction.visualizeAttack(action.call.applyHitConsequences);

        }

        if (actionState === ENUMS.ActionState.APPLY_HIT) {

        }

        if (actionState === ENUMS.ActionState.POST_HIT) {

        }

        if (actionState === ENUMS.ActionState.COMPLETED) {
        //    console.log("Remote Action State: COMPLETED", actionState, msg);
            GuiAPI.screenText("ACTION COMPLETED "+this.index,  ENUMS.Message.SYSTEM, 1.5)
            action.call.updateActionCompleted();
            action.call.setStatusKey(ENUMS.ActionStatus.ACTOR_ID, "none")
            action.call.setStatusKey(ENUMS.ActionStatus.ACTION_KEY, "none")
            action.isRemote = false;
            MATH.splice(this.actions, action);
        }

    }


    pauseRemoteClient() {
        while (this.actors.length) {
            let remove = this.actors.pop();

            remove.actorText.say("Entering Battle")
            setTimeout(function () {
                remove.removeGameActor();
            }, 1000)

        }

        this.isPaused = true;
    }

    unpauseRemoteClient() {
        this.isPaused = false;
    }

    handleEncounterMessage(encounterId, msg) {
     //       console.log("Encounter Message; ", msg);

            if (!this.encounter) {
                let playerParty = GameAPI.getGamePieceSystem().playerParty;
                let participate = false;
                for (let i = 0; i < playerParty.actors.length; i++) {
                    let otherActor = playerParty.actors[i];
                    let stamp = otherActor.getStatus(ENUMS.ActorStatus.CLIENT_STAMP);
                    if (stamp !== 0) {
                        if (msg.indexOf(stamp) !== -1) {
                            GuiAPI.screenText("PARTY BATTLE "+this.index,  ENUMS.Message.SYSTEM, 1.2)
                        //    console.log("Participate: ", otherActor, msg, stamp)
                            participate = true;
                        }
                    }

                }

                if (participate === false) {
                    // not my encounter;
                    if (msg.indexOf(ENUMS.ActivationState.DEACTIVATING) !== -1) {
                        this.encounter = null;
                        this.unpauseRemoteClient()
                    } else {
                        this.pauseRemoteClient()
                    }
                    return
                }
                this.encounter = new DynamicEncounter(encounterId)
                this.encounter.isRemote = true;
            }


        let statusPre = this.encounter.status.call.getStatus(ENUMS.EncounterStatus.ACTIVATION_STATE)

        for (let i = 2; i < msg.length; i++) {
            let key = msg[i];
            i++
            let status = msg[i]
            this.encounter.setStatusKey(key, status);
        }

        let activationState = this.encounter.status.call.getStatus(ENUMS.EncounterStatus.ACTIVATION_STATE)

        if (activationState !== statusPre) {

            if (activationState === ENUMS.ActivationState.ACTIVATING) {
                GameAPI.call.getGameEncounterSystem().activateByRemote(this.encounter)
            }

            if (activationState === ENUMS.ActivationState.DEACTIVATING) {

                GameAPI.call.getGameEncounterSystem().deactivateActiveEncounter(true);
                this.deactivateEncounter(status)

            }

            GuiAPI.screenText("ENCOUNTER "+activationState, ENUMS.Message.SYSTEM, 2);
            // console.log(statusPre, activationState)

        }
    }

    processClientMessage(msg) {
        let gameTime = GameAPI.getGameTime();
        let stamp = this.stamp;
        GuiAPI.screenText(""+this.index,  ENUMS.Message.SYSTEM, 0.2)
        let actors = this.actors;
        let remoteId = null

        if (msg[0] === ENUMS.EncounterStatus.ENCOUNTER_ID) {
            this.handleEncounterMessage(msg[1], msg);
            return;
        }

        if (this.isPaused === false) {
            if (msg[0] === ENUMS.ActorStatus.ACTOR_ID) {
                //     console.log("REMOTE INDEX: ", msg[1])
                remoteId = msg[1];
                //    GuiAPI.screenText("REQUEST REMOTE ACTOR "+ remoteId)
            } else if (msg[0] === ENUMS.ActionStatus.ACTION_ID) {
                this.handleActionMessage(msg[1], msg);
                return;
            } else if (msg[0] === ENUMS.ItemStatus.ITEM_ID) {
                this.handleItemMessage(msg[1], msg);
                return;
            } else {
                console.log("Index for Actor missing ", msg);
                return;
            }

            //    GuiAPI.screenText("Remote Index "+remoteId,  ENUMS.Message.HINT, 0.5)
            if (typeof(remoteId) === 'string') {
                let actor = this.getActorById(remoteId);
                if (!actor) {
                    let onLoadedCB = function(actr) {
                    //    console.log("Remote Actor Loaded", actr)
                        GuiAPI.screenText("REMOTE LOADED "+this.index,  ENUMS.Message.SYSTEM, 1.2)

                        actr.id = remoteId;
                        let onReady = function(readyActor) {
                            actors.push(readyActor);
                        }
                        let remote = new Remote(stamp, remoteId);
                        actr.call.setRemote(remote)
                        actr.activateGameActor(onReady)
                    }

                    let configId = messageByKey(msg, ENUMS.ActorStatus.CONFIG_ID)


                    if (configId === null) {
                        // console.log("No configId", msg);
                        GuiAPI.screenText("loading config "+this.index,  ENUMS.Message.SYSTEM, 0.5)
                        return;
                    }

                    if (this.remoteIndex.indexOf(remoteId) === -1) {
                        this.remoteIndex.push(remoteId)
                        ThreeAPI.tempVec3.copy(ThreeAPI.getCameraCursor().getPos())
                        evt.dispatch(ENUMS.Event.LOAD_ACTOR, {id:configId, pos:ThreeAPI.tempVec3, callback:onLoadedCB})
                    }

                } else {
                    //    actor.actorText.say(remoteId+' '+actor.index)

                    let hasSpatial = false;

                    let removeActor = function() {
                        MATH.splice(this.actors, actor);
                        MATH.splice(this.remoteIndex, actor.id);
                        actor.call.remove()
                    }.bind(this);

                    clearTimeout(actor.closeTimeout);
                    actor.closeTimeout = setTimeout(removeActor, 6000);

                    for (let i = 2; i < msg.length; i++) {



                        let key = msg[i];
                        i++
                        let status = msg[i]
                        if (spatialMap.indexOf(key) !== -1) {
                            hasSpatial = true;
                            actor.call.getRemote().updateSpatial(key, status);
                        } else {
                            actor.setStatusKey(key, status);
                        }

                        if (key === ENUMS.ActorStatus.EXISTS) {
                            if (status === 0) {
                                clearTimeout(actor.closeTimeout);
                                removeActor();
                                return;
                            }
                        }
                    }


                    let delta = gameTime - actor.getStatus(ENUMS.ActorStatus.LAST_UPDATE);

                    actor.setStatusKey(ENUMS.ActorStatus.UPDATE_DELTA, MATH.clamp(delta, 0, 2));
                    actor.setStatusKey(ENUMS.ActorStatus.LAST_UPDATE, gameTime);

                    if (hasSpatial) {
                        let spatialMaxDelta = actor.getStatus(ENUMS.ActorStatus.SPATIAL_DELTA);
                        let spatialDelta = gameTime - actor.call.getRemote().updateTime
                        this.applyRemoteSpatial(actor, MATH.clamp(spatialDelta, 0.02, spatialMaxDelta));
                        actor.call.getRemote().updateTime = gameTime;
                    }

                    this.applyRemoteEquipment(actor)
                    //    this.applyRemoteAction(actor);
                    //    console.log(msg)

                }
            } else {
                GuiAPI.screenText("No Remote Target "+this.index,  ENUMS.Message.HINT, 2.5)
                console.log("NO REMOTE: ", msg)
            }
        }

        clearTimeout(this.closeTimeout);
        this.closeTimeout = setTimeout(this.call.timeout, 8000);

    }


    closeRemoteClient() {
        GuiAPI.screenText("Player Left: "+this.index, ENUMS.Message.HINT, 4)
        while (this.actors.length) {
            this.actors.pop().removeGameActor();
        }
    }

    getStamp() {
        return this.stamp;
    }

}

export {RemoteClient}