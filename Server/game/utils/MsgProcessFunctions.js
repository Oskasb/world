import {ENUMS} from "../../../client/js/application/ENUMS.js";
import {
    applyStatusToMap,
    dispatchMessage,
    getGameServer,
    getGameServerWorld, getRegisteredActors, getServerActorByActorId,
    getServerItemByItemId,
    getServerStamp, getStatusFromMsg, statusMapFromMsg
} from "./GameServerFunctions.js";
import {getIncomingBytes, getOutgoingBytes} from "./ServerStatusTracker.js";

let msgEvent = {
    stamp:0,
    msg: {}
}

function processClientRequest(request, stamp, message, connectedClient) {
//    console.log("Process Request: ", ENUMS.getKey('ClientRequests', request), message)

    msgEvent.msg = message
    msgEvent.stamp = stamp;
    let player;
    let actor;
    let actorId;
    let statusValues;

    switch (request) {
        case ENUMS.ClientRequests.REGISTER_PLAYER:
            console.log("REGISTER_PLAYER: ",message);

            let add = getGameServer().registerConnectedPlayer(stamp);

            if (add) {
                connectedClient.setStamp(stamp)
                message.command = ENUMS.ServerCommands.PLAYER_CONNECTED
                dispatchMessage(message)
            }

            break
        case ENUMS.ClientRequests.LOAD_SERVER_ACTOR:
            console.log("LOAD_SERVER_ACTOR: ", message);

            player = getGameServer().getConnectedPlayerByStamp(connectedClient.stamp);

            if (!player) {
                console.log("No player for adding actor, something not right!", message)
                return;
            }

            let newActor = player.loadPlayerActor(message);

            if (newActor) {
                message.command = ENUMS.ServerCommands.ACTOR_INIT
                message.status = newActor.status.statusMap;
                dispatchMessage(message)
            } else {
                console.log("Actor already loaded:", message, player)
            }

            break
        case ENUMS.ClientRequests.APPLY_ITEM_STATUS:
            player = getGameServer().getConnectedPlayerByStamp(connectedClient.stamp);

            if (!player) {
                console.log("No player for item, exiting")
                return;
            }

            actorId = getStatusFromMsg(ENUMS.ActorStatus.ACTOR_ID, message.status);
        //    actor = player.getPlayerActor(actorId)

        //    statusValues = statusMapFromMsg(message.status);
            console.log("APPLY_ITEM_STATUS", message, player.actors)

        //    applyStatusToMap(statusValues, actor.getStatusMap());
            //    getGameServerWorld().initServerEncounter(msgEvent)
            message.command = ENUMS.ServerCommands.ITEM_UPDATE;
            dispatchMessage(message);
            break;
        case ENUMS.ClientRequests.APPLY_ACTOR_STATUS:
            player = getGameServer().getConnectedPlayerByStamp(connectedClient.stamp);

            let actor = player.getPlayerActor(message.status[1])

            if (actor) {
                actor.updateStatusFromMessage(message.status);
            } else {
                console.log("actor not found", message)
                return;
            }


        //    getGameServerWorld().initServerEncounter(msgEvent)
            message.command = ENUMS.ServerCommands.ACTOR_UPDATE;
            dispatchMessage(message);
            break;
        case ENUMS.ClientRequests.ENCOUNTER_INIT:
            getGameServerWorld().initServerEncounter(msgEvent)
            break;
        case ENUMS.ClientRequests.SERVER_PING:
            message.serverNow = performance.now();
            message.clientCount = getGameServer().connectedClients.length;
            message.actorCount = getRegisteredActors().length;
            message.command = ENUMS.ServerCommands.SYSTEM_INFO;
            message.bytesIn = getIncomingBytes();
            message.bytesOut = getOutgoingBytes();
        //    console.log("Process Ping Msg", message)
            connectedClient.call.returnDataMessage(message);
            break;
        default:
            if (stamp === getServerStamp()) {
                if (typeof (message.indexOf) !== 'function') {
                    console.log("Not array message", message)

                } else {

                    if (msg.indexOf(ENUMS.ItemStatus.ITEM_ID) === 0) {
                        //    let player = gameServer.getConnectedPlayerByStamp(stamp);
                        let itemId = msg[1];

                        let item = getServerItemByItemId(itemId)
                        if (item) {
                            item.updateItemStatusFromMessage(msg)
                        } else {
                            console.log("Item Message for no item", msg)
                            return;
                        }

                    } else if (msg.indexOf(ENUMS.ActionStatus.ACTION_ID) === 0) {
                        //   let player = gameServer.getConnectedPlayerByStamp(stamp);;
                        let actorIdIdx = msg.indexOf(ENUMS.ActionStatus.ACTOR_ID)+1;
                        let actor = getServerActorByActorId(msg[actorIdIdx])
                        if (actor) {
                            actor.updateActionStatusFromMessage(msg);
                        } else {
                            console.log("ServerActor not loaded")
                            return;
                        }

                    } else if (msg.indexOf(ENUMS.ActorStatus.ACTOR_ID) === 0) {
                        //    let player = gameServer.getConnectedPlayerByStamp(stamp);;
                        let actor = getServerActorByActorId(msg[1])
                        if (actor) {
                            actor.updateStatusFromMessage(msg);
                        } else {

                            let exists = getStatusFromMsg(ENUMS.ActorStatus.EXISTS, msg)
                            if (exists !== 'no_value') {
                                console.log("Load actor from message")

                                let player = getGameServer().getConnectedPlayerByStamp(stamp);
                                let status = statusMapFromMsg(msg);
                                player.loadPlayerActor({status:status});
                            } else {
                                console.log("not loading actor", msg[1], msg)
                            }

                            return;
                        }
                    } else {
                        console.log("Request not processed ",request,  msg)
                        return;
                    }

                }

            }
            dispatchMessage(message)

    }


}




function processClientMessage(messageData, connectedClient) {
//    console.log("processClientMessage", messageData)

    if (typeof(messageData.request) === 'number') {
        processClientRequest(messageData.request, messageData.stamp, messageData, connectedClient)
    } else {
        console.log("clientMessage needs request value", messageData)
    }

}



export {processClientMessage}