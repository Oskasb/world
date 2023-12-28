import {applyStatusToMap, dispatchMessage, getServerStamp, statusMapFromMsg} from "../utils/GameServerFunctions.js";
import {Status} from "../status/Status.js";
import {ENUMS} from "../../../client/js/application/ENUMS.js";



let index = 0;

class ServerItem {
    constructor(itemTemplate) {
        this.id = "item_"+index+"_"+getServerStamp()
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
        console.log("ITEM status msg", [msg]);
        let status = statusMapFromMsg(msg);
    //    applyStatusToMap(status, this.status.statusMap)
    //    dispatchMessage(ENUMS.ServerCommands.ITEM_UPDATE)
    }

    setStatusKey(key, status) {
        this.status.setStatusKey(key, status)
    }

    getStatus(key) {
        return this.status.getStatus(key)
    }

    dispatchItemStatus(command) {
        this.msgEvent.msg.command = command
        dispatchMessage(this.msgEvent);
    }

}

export { ServerItem }