import {Status} from "../status/Status.js";
import {ENUMS} from "../../../client/js/application/ENUMS.js";
import {ServerActorStatusProcessor} from "./ServerActorStatusProcessor.js";

class ServerActor {
    constructor(id, statusValues) {
        this.id = id;
        this.status = new Status(statusValues);
        this.equippedItems = [];
            this.serverActorStatusProcessor = new ServerActorStatusProcessor()
    }


    equipServerItem(serverItem) {
        if (this.equippedItems.indexOf(serverItem) === -1) {
            this.equippedItems.push(serverItem);
            serverItem.setStatusKey(ENUMS.ItemStatus.ACTOR_ID, this.status.getStatus(ENUMS.ActorStatus.ACTOR_ID))
        } else {
            console.log("Item already equipped", serverItem, this)
        }

    }




    updateStatusFromMessage(msg) {
        console.log("Actor status message: ", [msg]);
        this.serverActorStatusProcessor.processServerActorStatusMessage(this.status, msg)
    }

    updateActionStatusFromMessage(msg) {
        console.log("Actor ACTION message: ", [msg]);
    }

    updateItemStatusFromMessage(msg) {
        console.log("Actor ITEM msg", [msg]);
    }

}

export {ServerActor}