import {ENUMS} from "../../../client/js/application/ENUMS.js";
import {ServerActor} from "../actor/ServerActor.js";
import {getServerActorByActorId, registerServerActor} from "../utils/GameServerFunctions.js";
class ServerPlayer {
    constructor(stamp) {
        this.actors = [];
        this.stamp = stamp;
    }



    loadPlayerActor(msg) {
        console.log('loadPlayerActor', msg);
        let actorId = msg.status[ENUMS.ActorStatus.ACTOR_ID];
        let serverActor = getServerActorByActorId(actorId);
        if (!serverActor) {
            serverActor = new ServerActor(actorId, msg.status)
            registerServerActor(serverActor);
            console.log("NEW ServerActor", serverActor)
        } else {
            console.log("ServerActor already added", serverActor)
        }

    }


}

export { ServerPlayer }