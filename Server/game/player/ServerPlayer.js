import {ENUMS} from "../../../client/js/application/ENUMS.js";
import {ServerActor} from "../actor/ServerActor.js";
import {getServerActorByActorId, registerServerActor} from "../utils/GameServerFunctions.js";
import {ServerItem} from "../item/ServerItem.js";

let index = 0;
class ServerPlayer {
    constructor(stamp) {
        this.actors = [];
        this.stamp = stamp;
        index++
    }



    loadPlayerActor(msg) {
        console.log('loadPlayerActor', msg);
        let actorId = msg.status[ENUMS.ActorStatus.ACTOR_ID];
        let serverActor = getServerActorByActorId(actorId);
        if (!serverActor) {
            serverActor = new ServerActor(actorId, msg.status)
            serverActor.status.setStatusKey(ENUMS.ActorStatus.PLAYER_STAMP, this.stamp);
            this.actors.push(serverActor);
            registerServerActor(serverActor);

            let equippedTemplateItems = msg.status['EQUIPPED_ITEMS']
            for (let i = 0; i < equippedTemplateItems.length; i++) {
                let serverItem = new ServerItem(equippedTemplateItems[i]);
                serverActor.equipServerItem(serverItem)
                serverItem.dispatchItemStatus(ENUMS.ServerCommands.ITEM_INIT)
            }


            console.log("NEW ServerActor", serverActor)
            return true;
        } else {
            console.log("ServerActor already added", serverActor)
            return false;
        }

    }


    getPlayerActor(actorId) {
        for (let i = 0; i < this.actors.length; i++) {
            if (this.actors[i].id === actorId) {
                return this.actors[i]
            }
        }
    }

}

export { ServerPlayer }