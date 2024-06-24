import {ENUMS} from "../../../client/js/application/ENUMS.js";
import {MATH} from "../../../client/js/application/MATH.js";
import {ServerItem} from "../item/ServerItem.js";
import {
    dispatchMessage,
    getServerActorByActorId,
    getServerStamp, messageFromStatusMap,
    registerServerItem, statusMapFromMsg
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

        while (itemTemplateList.length) {
            let slotId = itemTemplateList.shift();
            let templateId = itemTemplateList.shift();
            let itemId = itemTemplateList.shift();
            let uiState = itemTemplateList.shift();
            serverActor.applyActorEquipRequest(slotId, templateId, itemId, uiState)
        }

    }

    processTurnStateRequest(status, newValue) {

        let currentTurnState = status.getStatus(ENUMS.ActorStatus.TURN_STATE);
    //    console.log("Process Turn State Request:", currentTurnState, newValue);
        status.setStatusKey(ENUMS.ActorStatus.TURN_STATE, newValue);

    }


    processServerActorStatusMessage(status, message) {
    //    console.log("processServerActorStatusMessage", status, msg);
        let msg = message.status;
        let zeroKey = ENUMS.ActorStatus.ACTOR_ID
        if (msg[1] !== status.getStatus(zeroKey)) {
            console.log("Incorrect actor for status")
        } else {

            for (let i = 0; i < msg.length; i++) {
                let statusKey = ENUMS.ActorStatus[msg[i]]
                let currentStatus = status.getStatus(statusKey);
                i++;
                let newValue =  msg[i]

                let returnFullStatus = false;

                if (MATH.stupidChecksumArray(currentStatus) !== MATH.stupidChecksumArray(newValue)) {
           //         console.log("Server Status updated", statusKey, newValue, currentStatus);


                    if (statusKey === ENUMS.ActorStatus.ACTIVATION_STATE) {
                        if (newValue === ENUMS.ActivationState.ACTIVATING) {
                            let initRequests = status.getStatus(ENUMS.ActorStatus.EQUIP_REQUESTS);

                            if (initRequests.length !== 0) {
                                console.log("updateEquippedItems ACTIVATING", initRequests)
                                this.updateEquippedItems(status, initRequests);
                                returnFullStatus = true;
                            }

                        //  console.log("Actor ACTIVATING")
                        }
                    }

                    if (status.getStatus(ENUMS.ActorStatus.ACTIVATION_STATE) === ENUMS.ActivationState.ACTIVE) {
                        if (statusKey === ENUMS.ActorStatus.EQUIP_REQUESTS) {
                        //    console.log("Server Status updated", statusKey, newValue, currentStatus);
                            if (newValue.length !== 0) {
                                this.updateEquippedItems(status, newValue);
                                returnFullStatus = true;
                            }

                        //    let serverActor = getServerActorByActorId(status.getStatus(ENUMS.ActorStatus.ACTOR_ID))
                        //    console.log("updateEquippedItems ACTIVE", status, msg);




                        }

                    }

                    if (statusKey === ENUMS.ActorStatus.REQUEST_TURN_STATE) {
                    //    console.log("REQUEST_TURN_STATE", status.getStatus(ENUMS.ActorStatus.ACTOR_ID), newValue)
                        this.processTurnStateRequest(status, newValue);
                    }

                    status.setStatusKey(statusKey, newValue);

                    if (returnFullStatus === true) {
                        message.status = messageFromStatusMap(status.statusMap, zeroKey);
                        console.log("returnFullStatus", message.status)
                    }
                }
            }

        }
    }

}

export { ServerActorMessageProcessor }