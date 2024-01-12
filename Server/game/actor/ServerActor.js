import {Status} from "../status/Status.js";
import {ENUMS} from "../../../client/js/application/ENUMS.js";
import {ServerActorMessageProcessor} from "./ServerActorMessageProcessor.js";
import {ServerActorPathWalker} from "./ServerActorPathWalker.js";
import {ServerActorTurnSequencer} from "./ServerActorTurnSequencer.js";
import {dispatchMessage, getGameServer, getGameServerWorld} from "../utils/GameServerFunctions.js";
import {TilePath} from "../../../client/js/game/piece_functions/TilePath.js";
import {Object3D} from "../../../client/libs/three/core/Object3D.js";
import {Vector3} from "../../../client/libs/three/math/Vector3.js";

class ServerActor {
    constructor(id, statusValues) {
        this.obj3d = new Object3D();
        this.pos = this.obj3d.position;
        this.id = id;
        this.status = new Status(statusValues);
        this.equippedItems = [];
        this.serverActorStatusProcessor = new ServerActorMessageProcessor()
        this.serverActorPathWalker = new ServerActorPathWalker();
        this.turnSequencer = new ServerActorTurnSequencer()
        this.tilePath = new TilePath();
    }

    getStatus(key) {
        return this.status.getStatus(key);
    }

    setStatusKey(key, status) {
        return this.status.setStatusKey(key, status);
    }

    getStatusMap() {
        return this.status.statusMap;
    }

    rollInitiative() {
        this.turnSequencer.setGameActor(this);
        this.setStatusKey(ENUMS.ActorStatus.SEQUENCER_INITIATIVE, Math.random())
    }

    equipServerItem(serverItem) {
        if (this.equippedItems.indexOf(serverItem) === -1) {
            this.equippedItems.push(serverItem);
            serverItem.setStatusKey(ENUMS.ItemStatus.ACTOR_ID, this.status.getStatus(ENUMS.ActorStatus.ACTOR_ID))
            serverItem.setStatusKey(ENUMS.ItemStatus.ITEM_ID, serverItem.id)
        //    console.log("Server Equip: to actor_id",serverItem.id, this.status.getStatus(ENUMS.ActorStatus.ACTOR_ID))
        } else {
            console.log("Item already equipped", serverItem, this)
        }
    }

    updateStatusFromMessage(msg) {
    //    console.log("Actor status message: ", [msg]);
        this.serverActorStatusProcessor.processServerActorStatusMessage(this.status, msg)
    }

    updateActionStatusFromMessage(msg) {
        console.log("Actor ACTION message: ", [msg]);
    }

    removeServerActor() {
        let clientStamp = this.status.getStatus(ENUMS.ActorStatus.CLIENT_STAMP);
        this.status.setStatusKey(ENUMS.ActorStatus.ACTIVATION_STATE, ENUMS.ActivationState.DEACTIVATING)
        dispatchMessage(
            {
                request:ENUMS.ClientRequests.APPLY_ACTOR_STATUS,
                command:ENUMS.ServerCommands.ACTOR_REMOVED,
                stamp:clientStamp,
                actorId:this.status.getStatus(ENUMS.ActorStatus.ACTOR_ID)
            }
        )

        let activeEncounters = getGameServerWorld().getActiveEncoutners();

        for (let i = 0; i < activeEncounters.length; i++) {
            if (activeEncounters[i].hostStamp === clientStamp) {
                activeEncounters[i].handleHostActorRemoved()
            }
        }
    }

    buildServerActorStatusMessage(request, command) {
        let message = {
            request:request,
            command:command,
            status:this.getStatusMap(),
            stamp:this.getStatus(ENUMS.ActorStatus.CLIENT_STAMP)
        }
        return message;
    }

    messageClient(messageData) {
        let clientStamp = this.status.getStatus(ENUMS.ActorStatus.CLIENT_STAMP);
        getGameServer().messageClientByStamp(clientStamp, messageData);
    }

}

export {ServerActor}