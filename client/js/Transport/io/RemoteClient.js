import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";
import {Vector3} from "../../../libs/three/math/Vector3.js";


let equipQueue = []

let index = 0;

let tempVec = new Vector3()
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
        this.remoteIndex = [];
        GuiAPI.screenText("Player Joined: "+this.index, ENUMS.Message.HINT, 4)
    }


    getActorByIndex(index) {
        for (let i = 0; i < this.actors.length; i++) {
            if (this.actors[i].index = index) {
                return this.actors[i];
            }
        }
    }

    applyRemoteSpatial(actor, timeDelta) {

        let oldTransition = actor.call.getActiveSpatialTransition()
        if (oldTransition) {
            oldTransition.cancelSpatialTransition()
        }

        // let spatialTransition = oldTransition;
        function transitionUpdate(posVec, velocityVec) {
            actor.setSpatialVelocity(velocityVec);
            actor.setStatusKey(ENUMS.ActorStatus.FRAME_TRAVEL_DISTANCE, 0.1);
        }
        function transitionEnded(posVec, transition) {
            poolReturn(transition);
            actor.call.setSpatialTransition(null)
            tempVec.set(0, 0, 0);
            actor.setSpatialVelocity(tempVec);
        }

    //    if (!spatialTransition) {
         let   spatialTransition =  poolFetch('SpatialTransition')
    //    }

    //    let pos = spatialTransition.targetPos
        tempVec.x = actor.getStatus(ENUMS.ActorStatus.POS_X);
        tempVec.y = actor.getStatus(ENUMS.ActorStatus.POS_Y);
        tempVec.z = actor.getStatus(ENUMS.ActorStatus.POS_Z);

    //    let positionDelta = MATH.distanceBetween(tempVec, pos)
    //    if (positionDelta < 0.1) {
    //        return;
    //    }
    //    pos.copy(tempVec);

    //    let charSpeed = actor.getStatus(ENUMS.ActorStatus.MOVEMENT_SPEED)
   //     let distance = MATH.distanceBetween(actor.getPos(), pos);
        let updateTravelTime =  timeDelta-0.05 //  (distance*timeDelta / charSpeed)  // GameAPI.getTurnStatus().turnTime timeDelta //*2 //

    //    if (!oldTransition) {
            spatialTransition.initSpatialTransition(actor.getSpatialPosition(), tempVec, updateTravelTime, transitionEnded, 0, 'curveLinear', transitionUpdate)
            actor.call.setSpatialTransition(spatialTransition)
    //    } else {
    //        spatialTransition.targetTime += updateTravelTime;
    //    }

    //    return;

        let quat = actor.actorObj3d.quaternion;
        quat.x = actor.getStatus(ENUMS.ActorStatus.QUAT_X);
        quat.y = actor.getStatus(ENUMS.ActorStatus.QUAT_Y);
        quat.z = actor.getStatus(ENUMS.ActorStatus.QUAT_Z);
        quat.w = actor.getStatus(ENUMS.ActorStatus.QUAT_W);

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





    processClientMessage(msg) {
        let gameTime = GameAPI.getGameTime();

        GuiAPI.screenText(""+this.index,  ENUMS.Message.SYSTEM, 0.2)
        let actors = this.actors;
        let remoteIndex = null
        if (msg[0] === ENUMS.ActorStatus.ACTOR_INDEX) {
            remoteIndex = msg[1];
        } else {
            console.log("Index for Actor missing ", msg);
        }

    //    GuiAPI.screenText("Remote Index "+remoteIndex,  ENUMS.Message.HINT, 0.5)
        if (typeof(remoteIndex) === 'number') {
            let actor = this.getActorByIndex(remoteIndex);
            if (!actor) {
                let onLoadedCB = function(actr) {
                    let onReady = function(readyActor) {
                       actors.push(readyActor);
                    }

                    actr.activateGameActor(onReady)
                }

                let configId = messageByKey(msg, ENUMS.ActorStatus.CONFIG_ID)

                if (configId === null) {
                    console.log("No configId", msg);
                    return;
                }

                if (this.remoteIndex.indexOf(remoteIndex) === -1) {
                    this.remoteIndex.push(remoteIndex)
                    ThreeAPI.tempVec3.copy(ThreeAPI.getCameraCursor().getPos())
                    evt.dispatch(ENUMS.Event.LOAD_ACTOR, {id:configId, pos:ThreeAPI.tempVec3, callback:onLoadedCB})
                }


            } else {
                actor.actorText.say(remoteIndex)

                for (let i = 2; i < msg.length; i++) {
                    let key = msg[i];
                    i++
                    let status = msg[i]
                    actor.setStatusKey(key, status);
                }

                let delta = gameTime - actor.getStatus(ENUMS.ActorStatus.LAST_UPDATE);
                actor.setStatusKey(ENUMS.ActorStatus.UPDATE_DELTA, MATH.clamp(delta, 0, 2));
                actor.setStatusKey(ENUMS.ActorStatus.LAST_UPDATE, gameTime);

                this.applyRemoteSpatial(actor, delta);
                this.applyRemoteEquipment(actor)

            }
        } else {
            GuiAPI.screenText("No Remote Target "+this.index,  ENUMS.Message.HINT, 2.5)
        }





    }

    getStamp() {
        return this.stamp;
    }

}

export {RemoteClient}