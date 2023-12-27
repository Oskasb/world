import {ENUMS} from "../../client/js/application/ENUMS.js";
import {ServerEncounter} from "../game/encounter/ServerEncounter.js";
import {
    dispatchMessage,
    getGameServer,
    getGameServerWorld,
    getServerStamp,
    applyMessageToClient,
    processStatusMessage
} from "../game/utils/GameServerFunctions.js";

let msgEvent = {
    stamp:0,
    msg:""
}

function processMessageData(stamp, msg) {

    msgEvent.stamp = stamp;
    msgEvent.msg = msg;
    let request = msg.request;

//    console.log(msg)

    switch (request) {
        case ENUMS.ClientRequests.REGISTER_PLAYER:
            console.log("Register Player: ", msg, msgEvent);

            let add = getGameServer().registerConnectedPlayer(stamp);

            if (add) {
                msgEvent.msg.command = ENUMS.ServerCommands.PLAYER_CONNECTED
                msgEvent.stamp = getServerStamp();
                dispatchMessage(msgEvent)
            }

            break
        case ENUMS.ClientRequests.LOAD_SERVER_ACTOR:
            console.log("LOAD_SERVER_ACTOR: ", msg, msgEvent);

            let player = getGameServer().getConnectedPlayerByStamp(stamp);

            if (!player) {
                console.log("No player for adding actor, something not right!", msg)
                return;
            }
            if (stamp === getServerStamp()) {

            }
            let newActor = player.loadPlayerActor(msg);

            if (newActor) {
                msgEvent.msg.command = ENUMS.ServerCommands.ACTOR_INIT
                dispatchMessage(msgEvent)
            } else {
                console.log("Actor already loaded:", msg, player)
            }

            break
        case ENUMS.ClientRequests.ENCOUNTER_INIT:
            getGameServerWorld().initServerEncounter(msgEvent)
            break;
        default:
            processStatusMessage(stamp, msg)

            if (stamp === getServerStamp()) {
                dispatchMessage(msgEvent)
            } else {
                applyMessageToClient(msgEvent)
            }


    }
}

class ServerMessageProcessor {

    constructor(sendMessage, sendJson) {
        this.sendMessage = sendMessage;
        this.sendJson = sendJson;
    }

    connectionMessage(data) {

        if (data.stamp !== getServerStamp()) {
            //    console.log("handle message from SOCKET", data);
            processMessageData(data.stamp, data.msg);
        } else {
            console.log("No reprocess already dispatched message", data)
        }
    }

    handleClientMessage(msgJson) {
    //    this.sendJson(msgJson)
        this.handleClientRequest(msgJson)
    }

    handleClientRequest(msgJson) {
        let data = JSON.parse(msgJson)
        console.log("handle message from CLIENT", data);
        processMessageData(data.stamp, data.msg)

    }

}



export {ServerMessageProcessor}