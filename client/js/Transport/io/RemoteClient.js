import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";
import {Vector3} from "../../../libs/three/math/Vector3.js";
import {Quaternion} from "../../../libs/three/math/Quaternion.js";
import {DynamicEncounter} from "../../game/encounter/DynamicEncounter.js";

let equipQueue = []
let index = 0;
let tempVec = new Vector3()
let tempQuat = new Quaternion();

function messageByKey(msg, key ) {
    let keyIndex = msg.indexOf(key);
    console.log(keyIndex, [msg], key)
    if (keyIndex === -1) {
        return null;
    }
    return msg[keyIndex+1];
}

class RemoteClient {
    constructor(stamp) {
        this.index = index;
        index++
        this.stamp = stamp;
        this.actors = [];
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

    applyRemoteSpatial(actor, timeDelta) {

        let remote = actor.call.getRemote();
        tempQuat.copy(remote.quat)
        actor.getSpatialVelocity(remote.vel);
        actor.getSpatialPosition(remote.pos);
        actor.getSpatialScale(remote.scale);
        actor.getSpatialQuaternion(remote.quat);
        actor.setSpatialQuaternion(tempQuat);
        remote.timeDelta = timeDelta;

    }

    applyRemoteAction(actor) {
        let remote = actor.call.getRemote();
        let lastActionKey = remote.remoteActionKey;
        let newActionKey = actor.getStatus(ENUMS.ActorStatus.SELECTED_ACTION);

        let statusKey = actor.getStatus(ENUMS.ActorStatus.ACTION_STATE_KEY);

        if (statusKey !== 'attack_precast') {
            return;
        }

        if (!newActionKey) {
            remote.remoteActionKey = newActionKey;
            return;
        }

            if (lastActionKey === newActionKey) {
                console.log("SAME ACTION!")
            } else {

                    remote.remoteActionKey = newActionKey;
                    let action = poolFetch('ActorAction');
                    action.setActionKey(newActionKey);
                    action.initAction(actor);
                    let target = GameAPI.getActorById(actor.getStatus(ENUMS.ActorStatus.SELECTED_TARGET))
                    if (!target) {
                        console.log("Action needs a target!")
                        target = actor;
                    }
                    setTimeout(function() {
                        action.activateAttack(target, action.call.closeAttack)
                    }, 500)

            }

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
                    console.log("EQUIP: ", equippedList[i])
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

    deactivateEncounter(status) {
        GuiAPI.screenText(status+" BATTLE")
        let actorList = this.encounter.status.call.getStatus(ENUMS.EncounterStatus.ENCOUNTER_ACTORS)
    //    console.log("DEACTIVATING: ", actorList, this.actors)
        for (let i = 0; i < actorList.length; i++) {
            let actor = this.getActorById(actorList[i])
            MATH.splice(this.actors, actor);
            MATH.splice(this.remoteIndex, actor.id);
            actor.call.remove()
        }
    }

    handleEncounterMessage(encounterId, msg) {
    //    console.log("Encounter Message; ", msg);

        if (!this.encounter) {
            this.encounter = new DynamicEncounter(encounterId)
            this.encounter.isRemote = true;
        }

        let statusPre = this.encounter.status.call.getStatus(ENUMS.EncounterStatus.ACTIVATION_STATE)

        for (let i = 2; i < msg.length; i++) {
            let key = msg[i];
            i++
            let status = msg[i]
            if (key === ENUMS.EncounterStatus.ACTIVATION_STATE) {
                if (status === ENUMS.ActivationState.DEACTIVATING) {
                    this.deactivateEncounter(status)
                }
            }
            this.encounter.setStatusKey(key, status);
        }

        let activationState = this.encounter.status.call.getStatus(ENUMS.EncounterStatus.ACTIVATION_STATE)

        if (activationState !== statusPre) {
            console.log(statusPre, activationState)
            GuiAPI.screenText(activationState + " BATTLE")
        }
    }

    processClientMessage(msg) {
        let gameTime = GameAPI.getGameTime();
        let stamp = this.stamp;
        GuiAPI.screenText(""+this.index,  ENUMS.Message.SYSTEM, 0.2)
        let actors = this.actors;
        let remoteId = null
        if (msg[0] === ENUMS.ActorStatus.ACTOR_ID) {
       //     console.log("REMOTE INDEX: ", msg[1])
            remoteId = msg[1];
        //    GuiAPI.screenText("REQUEST REMOTE ACTOR "+ remoteId)
        } else if (msg[0] === ENUMS.EncounterStatus.ENCOUNTER_ID) {
            this.handleEncounterMessage(msg[1], msg);
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
                    console.log("Remote Actor Loaded", actr)
                    actr.id = remoteId;
                    let onReady = function(readyActor) {
                       actors.push(readyActor);
                    }
                    let remote = {
                        stamp:stamp,
                        remoteId:remoteId,
                        pos:new Vector3(),
                        scale:new Vector3(),
                        vel:new Vector3(),
                        quat:new Quaternion(),
                        remoteActionKey:'',
                        action:null,
                        lastSpatialTime:0,
                        timeDelta:2
                    }
                    actr.call.setRemote(remote)
                    actr.activateGameActor(onReady)
                }

                let configId = messageByKey(msg, ENUMS.ActorStatus.CONFIG_ID)


                if (configId === null) {
                    console.log("No configId", msg);
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
                    actor.setStatusKey(key, status);
                    if (key === (ENUMS.ActorStatus.QUAT_Z || ENUMS.ActorStatus.POS_X || ENUMS.ActorStatus.VEL_X || ENUMS.ActorStatus.VEL_Z)) {
                        hasSpatial = true;
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
                    let spatialDelta = gameTime - actor.call.getRemote().lastSpatialTime
                    this.applyRemoteSpatial(actor, MATH.clamp(spatialDelta, 0, 2));
                    actor.call.getRemote().lastSpatialTime = gameTime;
                }

                this.applyRemoteEquipment(actor)
                this.applyRemoteAction(actor);
            //    console.log(msg)

            }
        } else {
            GuiAPI.screenText("No Remote Target "+this.index,  ENUMS.Message.HINT, 2.5)
            console.log("NO REMOTE: ", msg)
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