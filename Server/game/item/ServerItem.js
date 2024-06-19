import {applyStatusToMap, dispatchMessage, getServerStamp, statusMapFromMsg} from "../utils/GameServerFunctions.js";
import {Status} from "../status/Status.js";
import {ENUMS} from "../../../client/js/application/ENUMS.js";


let index = 0;

class ServerItem {
    constructor(itemTemplate, stamp, slotId, slottedItemId) {
        this.id = slottedItemId || "item_"+index+"_"+stamp;
        this.slotId = slotId;
        this.stamp = stamp;
        index++
        this.status = new Status();
        this.setStatusKey(ENUMS.ItemStatus.ITEM_ID, this.id);
        this.setStatusKey(ENUMS.ItemStatus.TEMPLATE, itemTemplate);
        this.msgEvent = {

            stamp:getServerStamp(),
            msg: {
                status:this.status.statusMap,
                command:ENUMS.ServerCommands.ITEM_INIT,
            }
        }
    }

    updateItemStatusFromMessage(msg) {


        let status = statusMapFromMsg(msg);


        applyStatusToMap(status, this.status.statusMap)
    //    console.log("ITEM status msg", [msg], [this.status.statusMap]);
    //    message.command = ENUMS.ServerCommands.ITEM_UPDATE;
    //    this.dispatchItemStatus(ENUMS.ClientRequests.APPLY_ITEM_STATUS, ENUMS.ServerCommands.ITEM_UPDATE)
    //    dispatchMessage(ENUMS.ServerCommands.ITEM_UPDATE)
    }

    setStatusKey(key, status) {
        this.status.setStatusKey(key, status)
    }

    getStatus(key) {
        return this.status.getStatus(key)
    }

    dispatchItemStatus(request, command) {
        this.msgEvent.msg.request = request;
        this.msgEvent.msg.command = command;
        this.msgEvent.msg.stamp = this.stamp;
    //    console.log("Dispatch item msg", this.msgEvent.msg)
        dispatchMessage(this.msgEvent.msg);
    }

}

export { ServerItem }