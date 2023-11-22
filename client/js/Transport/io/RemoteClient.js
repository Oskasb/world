let equipQueue = []

class RemoteClient {
    constructor(stamp) {
        this.stamp = stamp;
        this.actors = [];
        this.remoteIndex = [];
    }


    getActorByIndex(index) {
        for (let i = 0; i < this.actors.length; i++) {
            if (this.actors[i].index = index) {
                return this.actors[i];
            }
        }
    }

    applyRemoteSpatial(actor) {
        let pos = actor.getPos()
        pos.x = actor.getStatus(ENUMS.ActorStatus.POS_X);
        pos.y = actor.getStatus(ENUMS.ActorStatus.POS_Y);
        pos.z = actor.getStatus(ENUMS.ActorStatus.POS_Z);
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
        let actors = this.actors;
        let remoteIndex = msg[ENUMS.ActorStatus.ACTOR_INDEX]
        if (typeof(remoteIndex) === 'number') {
            let actor = this.getActorByIndex(remoteIndex);
            if (!actor) {
                let onLoadedCB = function(actr) {
                    let onReady = function(readyActor) {
                       actors.push(readyActor);
                    }

                    actr.activateGameActor(onReady)
                }
                if (this.remoteIndex.indexOf(remoteIndex) === -1) {
                    this.remoteIndex.push(remoteIndex)
                    evt.dispatch(ENUMS.Event.LOAD_ACTOR, {id:msg[ENUMS.ActorStatus.CONFIG_ID], pos:ThreeAPI.tempVec3, callback:onLoadedCB})
                }


            } else {
                actor.actorText.say(remoteIndex)
                for (let key in msg) {
                    actor.setStatusKey(key, msg[key]);
                    this.applyRemoteSpatial(actor);
                    this.applyRemoteEquipment(actor)
                }
            }
        }





    }

    getStamp() {
        return this.stamp;
    }

}

export {RemoteClient}