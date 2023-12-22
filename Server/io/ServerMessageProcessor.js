import {ENUMS} from "../../client/js/application/ENUMS.js";
import {ServerEncounter} from "../game/encounter/ServerEncounter.js";
import {dispatchMessage, getGameServer, getGameServerWorld, getServerStamp} from "../game/utils/GameServerFunctions.js";

let msgEvent = {
    stamp:0,
    msg:""
}

function processMessageData(stamp, msg) {

    msgEvent.stamp = stamp;
    msgEvent.msg = msg;
    let request = msg.request;

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
                dispatchMessage(msgEvent)
            }
            player.loadPlayerActor(msg);

            break
        case ENUMS.ClientRequests.ENCOUNTER_INIT:
            getGameServerWorld().initServerEncounter(msgEvent)
            break;
        default:

            if (msg.indexOf(ENUMS.ItemStatus.ITEM_ID) === 0) {
                let player = getGameServer().getConnectedPlayerByStamp(stamp);
                let actorIdIdx = msg.indexOf(ENUMS.ItemStatus.ACTOR_ID)+1;
                let actor = player.getPlayerActor(msg[actorIdIdx])
                if (actor) {
                    actor.updateItemStatusFromMessage(msg)
                } else {
                    // console.log("Item Message for no actor", msg)
                    return;
                }

            } else if (msg.indexOf(ENUMS.ActionStatus.ACTION_ID) === 0) {
                let player = getGameServer().getConnectedPlayerByStamp(stamp);;
                let actorIdIdx = msg.indexOf(ENUMS.ActionStatus.ACTOR_ID)+1;
                let actor = player.getPlayerActor(msg[actorIdIdx])
                if (actor) {
                    actor.updateActionStatusFromMessage(msg);
                } else {
                    console.log("ServerActor not loaded")
                    return;
                }

            } else if (msg.indexOf(ENUMS.ActorStatus.ACTOR_ID) === 0) {
                let player = getGameServer().getConnectedPlayerByStamp(stamp);;
                let actor = player.getPlayerActor(msg[1])
                if (actor) {
                    actor.updateStatusFromMessage(msg);
                } else {
                    console.log("ServerActor not loaded")
                    return;
                }
            } else {
                console.log("Request not processed ",request,  msg)
                return;
            }

            if (stamp === getServerStamp()) {
                dispatchMessage(msgEvent)
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
        this.sendJson(msgJson)
    }

    handleClientRequest(msgJson) {
        let data = JSON.parse(msgJson)
        console.log("handle message from CLIENT", data);
        processMessageData(data.stamp, data.msg)

    }

}



export {ServerMessageProcessor}