import {Status} from "../../../../Server/game/status/Status.js";

class ClientStronghold {
    constructor(id) {
        this.id = id;
        this.status = new Status()
    }

    applyServerStatus(statusMap) {
        for (let key in statusMap) {
            this.status.setStatusKey(key, statusMap[key])
        }
        console.log("applyServerStatus", this);
    }

}

export {ClientStronghold}