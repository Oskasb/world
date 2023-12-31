import {ENUMS} from "../../../client/js/application/ENUMS.js";
import {MATH} from "../../../client/js/application/MATH.js";
import {ServerItem} from "../item/ServerItem.js";
import {getServerActorByActorId, getServerStamp, registerServerItem} from "../utils/GameServerFunctions.js";

class ServerActorStatusProcessor {
    constructor() {

    }

    /*
        let equippedTemplateItems = msg.status['EQUIPPED_ITEMS']
        for (let i = 0; i < equippedTemplateItems.length; i++) {
            let serverItem = new ServerItem(equippedTemplateItems[i]);
            serverActor.equipServerItem(serverItem)
            serverItem.dispatchItemStatus(ENUMS.ServerCommands.ITEM_INIT)
        }
    */

    updateEquippedItems(status, itemTemplateList) {
        let currentItems = status.getStatus(ENUMS.ActorStatus.EQUIPPED_ITEMS);
        if (!currentItems) {
            currentItems = [];
        }

        console.log("UPDATE EQUIPPED ITEMS: ", itemTemplateList)

        for (let i = 0; i < itemTemplateList.length; i++) {
            if (currentItems.indexOf(itemTemplateList[i]) === -1) {
                let serverItem = new ServerItem(itemTemplateList[i], status.getStatus(ENUMS.ActorStatus.CLIENT_STAMP));
                registerServerItem(serverItem)
                let serverActor = getServerActorByActorId(status.getStatus(ENUMS.ActorStatus.ACTOR_ID))

                serverActor.equipServerItem(serverItem)
            //    if (status.getStatus(ENUMS.ActorStatus.PLAYER_STAMP) === getServerStamp()) {
                    serverItem.dispatchItemStatus(ENUMS.ServerCommands.ITEM_INIT)
            //    }
            }
        }

    }

    processServerActorStatusMessage(status, msg) {
    //    console.log("processServerActorStatusMessage", status, msg);
        if (msg[1] !== status.getStatus(ENUMS.ActorStatus.ACTOR_ID)) {
            console.log("Incorrect actor for status")
        } else {

            for (let i = 0; i < msg.length; i++) {
                let statusKey = ENUMS.ActorStatus[msg[i]]
                let currentStatus = status.getStatus(statusKey);
                i++;
                let newValue =  msg[i]

                if (MATH.stupidChecksumArray(currentStatus) !== MATH.stupidChecksumArray(newValue)) {
           //         console.log("Server Status updated", statusKey, newValue, currentStatus);

                    if (statusKey === ENUMS.ActorStatus.ACTIVATION_STATE) {
                        if (newValue === ENUMS.ActivationState.ACTIVATING) {
                            let initRequests = status.getStatus(ENUMS.ActorStatus.EQUIP_REQUESTS);

                            this.updateEquippedItems(status, initRequests);
                            status.setStatusKey(ENUMS.ActorStatus.EQUIP_REQUESTS, []);
                            console.log("Actor ACTIVATING")
                        }
                    }

                    if (status.getStatus(ENUMS.ActorStatus.ACTIVATION_STATE) === ENUMS.ActivationState.ACTIVE) {
                        if (statusKey === ENUMS.ActorStatus.EQUIP_REQUESTS) {
                            this.updateEquippedItems(status, newValue);
                            newValue = []
                        }
                    }

                    status.setStatusKey(statusKey, newValue);
                }
            }

        }
    }

}

export { ServerActorStatusProcessor }