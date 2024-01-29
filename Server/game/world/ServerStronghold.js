import {Status} from "../status/Status.js";

let index = 0;

class ServerStronghold {
    constructor(stamp) {
        index++;
        this.id = 'hold_'+index+'_'+stamp
        this.status = new Status({STRONGHOLD_ID:this.id, CLIENT_STAMP:stamp})
    }

    applyStatusUpdate(statusMap) {
        for (let key in statusMap) {
            this.status.setStatusKey(key, statusMap[key]);
        }
    }



}



export {ServerStronghold}