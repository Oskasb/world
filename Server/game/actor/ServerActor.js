import {Status} from "../status/Status.js";


class ServerActor {
    constructor(id, statusValues) {
        this.id = id;
        this.status = new Status(statusValues);
    }
}

export {ServerActor}