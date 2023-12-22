import {Status} from "../status/Status.js";


class ServerActor {
    constructor(id, statusValues) {
        this.id = id;
        this.status = new Status(statusValues);
    }




    updateStatusFromMessage(msg) {
        console.log("Actor status message: ", [msg]);
    }

    updateActionStatusFromMessage(msg) {
        console.log("Actor ACTION message: ", [msg]);
    }

    updateItemStatusFromMessage(msg) {
        console.log("Actor ITEM msg", [msg]);
    }

}

export {ServerActor}