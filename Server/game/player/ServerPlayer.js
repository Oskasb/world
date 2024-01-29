import {ENUMS} from "../../../client/js/application/ENUMS.js";
import {ServerActor} from "../actor/ServerActor.js";
import {getGameServer, getServerActorByActorId, registerServerActor} from "../utils/GameServerFunctions.js";
import {ServerItem} from "../item/ServerItem.js";
import {ServerStronghold} from "../world/ServerStronghold.js";

let index = 0;
class ServerPlayer {
    constructor(stamp) {
        this.actors = [];
        this.stamp = stamp;
        this.stronghold = new ServerStronghold(stamp)
        this.serverEncounter = null;
        index++
    }


    loadPlayerActor(msg) {
    //    console.log('loadPlayerActor', msg);
        let actorId = msg.status[ENUMS.ActorStatus.ACTOR_ID];
        let serverActor = getServerActorByActorId(actorId);
        if (!serverActor) {
            serverActor = new ServerActor(actorId, msg.status)
            serverActor.status.setStatusKey(ENUMS.ActorStatus.CLIENT_STAMP, this.stamp);
            serverActor.status.setStatusKey(ENUMS.ActorStatus.TURN_STATE, ENUMS.TurnState.NO_TURN);
            serverActor.status.setStatusKey(ENUMS.ActorStatus.DAMAGE_APPLIED, 0);
            serverActor.status.setStatusKey(ENUMS.ActorStatus.HEALING_APPLIED, 0);
            this.actors.push(serverActor);
            registerServerActor(serverActor);
       //     console.log("NEW ServerActor", serverActor)
            return serverActor;
        } else {
            console.log("ServerActor already added", serverActor)
            return false;
        }
    }

    updatePlayerStronghold(msg) {
        console.log('updatePlayerStronghold', msg);
        this.stronghold.applyStatusUpdate(msg.status);
        msg.status = this.stronghold.status.statusMap;
        msg.command = ENUMS.ServerCommands.STRONGHOLD_UPDATE;
        getGameServer().messageClientByStamp(this.stamp, msg);
    }

    getPlayerActor(actorId) {
        for (let i = 0; i < this.actors.length; i++) {
            if (this.actors[i].id === actorId) {
                return this.actors[i]
            }
        }
    }

    removeServerPlayer() {
        while (this.actors.length) {
            let serverActor = this.actors.pop();
            serverActor.removeServerActor();
        }
    }

}

export { ServerPlayer }