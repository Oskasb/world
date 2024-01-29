import {Status} from "../../../../Server/game/status/Status.js";

let index = 0;

class ServerStronghold {
    constructor(stamp) {
        index++;
        this.status = new Status({STRONGHOLD_ID:'hold_'+index+'_'+stamp, CLIENT_STAMP:stamp})
    }

    applyStatusUpdate(statusMap) {
        for (let key in statusMap) {
            this.status.setStatusKey(key, statusMap[key]);
        }
    }


}



export {ServerStronghold}