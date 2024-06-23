import {ENUMS} from "../../../client/js/application/ENUMS.js";
import {MATH} from "../../../client/js/application/MATH.js";
import {ServerItem} from "../item/ServerItem.js";
import {
    dispatchMessage,
    getServerActorByActorId,
    getServerStamp, messageFromStatusMap,
    registerServerItem
} from "../utils/GameServerFunctions.js";

class ServerActorMessageProcessor {
    constructor() {

    }

    updateEquippedItems(status, itemTemplateList) {
        let currentItems = status.getStatus(ENUMS.ActorStatus.EQUIPPED_ITEMS);
        if (!currentItems) {
            currentItems = [];
        }

        console.log("UPDATE EQUIPPED ITEMS: ", itemTemplateList)

        let serverActor = getServerActorByActorId(status.getStatus(ENUMS.ActorStatus.ACTOR_ID))

        for (let i = 0; i < itemTemplateList.length; i++) {

            let slotId = itemTemplateList[i];
            i++;
            let templateId = itemTemplateList[i];
            i++;
            let itemId = itemTemplateList[i];
            i++;
            let uiState = itemTemplateList[i];
            serverActor.applyActorEquipRequest(slotId, templateId, itemId, uiState)

            if (templateId === "") {
                serverActor.unequipItemBySlot(slotId)
            } else {
                if (currentItems.indexOf(templateId) === -1) {
                    let slottedItemId = status.getStatus(ENUMS.ActorStatus[slotId]);
                    if (slottedItemId !== "") {
                        console.log("Create item for slot status ", slotId, slottedItemId)
                    }

                    let serverItem = new ServerItem(itemTemplateList[i], status.getStatus(ENUMS.ActorStatus.CLIENT_STAMP), slotId, slottedItemId);
                    registerServerItem(serverItem)

                    serverActor.equipServerItem(serverItem)
                    //    if (status.getStatus(ENUMS.ActorStatus.PLAYER_STAMP) === getServerStamp()) {
                    serverItem.dispatchItemStatus(ENUMS.ClientRequests.LOAD_SERVER_ITEM, ENUMS.ServerCommands.ITEM_INIT)
                    //    }
                } else {
                    console.log("Template Already equipped on Server ", templateId)
                }
            }

        }
    }

    processTurnStateRequest(status, newValue) {

        let currentTurnState = status.getStatus(ENUMS.ActorStatus.TURN_STATE);
    //    console.log("Process Turn State Request:", currentTurnState, newValue);
        status.setStatusKey(ENUMS.ActorStatus.TURN_STATE, newValue);

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

                            console.log("updateEquippedItems ACTIVATING", initRequests)
                            this.updateEquippedItems(status, initRequests);

                            status.setStatusKey(ENUMS.ActorStatus.EQUIP_REQUESTS, []);
                        //  console.log("Actor ACTIVATING")
                        }
                    }

                    if (status.getStatus(ENUMS.ActorStatus.ACTIVATION_STATE) === ENUMS.ActivationState.ACTIVE) {
                        if (statusKey === ENUMS.ActorStatus.EQUIP_REQUESTS) {
                        //    console.log("Server Status updated", statusKey, newValue, currentStatus);
                            this.updateEquippedItems(status, newValue);
                        //    let serverActor = getServerActorByActorId(status.getStatus(ENUMS.ActorStatus.ACTOR_ID))
                        //    console.log("updateEquippedItems ACTIVE", status, msg);




                        }

                    }

                    if (statusKey === ENUMS.ActorStatus.REQUEST_TURN_STATE) {
                    //    console.log("REQUEST_TURN_STATE", status.getStatus(ENUMS.ActorStatus.ACTOR_ID), newValue)
                        this.processTurnStateRequest(status, newValue);
                    }

                    status.setStatusKey(statusKey, newValue);
                }
            }

        }
    }

}

export { ServerActorMessageProcessor }