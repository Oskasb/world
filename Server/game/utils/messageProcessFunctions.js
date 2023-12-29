import {ENUMS} from "../../../client/js/application/ENUMS.js";
import {
    dispatchMessage,
    getGameServer,
    getGameServerWorld, getServerActorByActorId,
    getServerItemByItemId,
    getServerStamp, getStatusFromMsg, statusMapFromMsg
} from "./GameServerFunctions.js";

let msgEvent = {
    stamp:0,
    msg: {}
}

function processClientRequest(request, stamp, message, connectedClient) {
    console.log("Process Request: ", ENUMS.getKey('ClientRequests', request), message)

    msgEvent.msg = message
    msgEvent.stamp = stamp;

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

            let player = getGameServer().getConnectedPlayerByStamp(connectedClient.stamp);

            if (!player) {
                console.log("No player for adding actor, something not right!", message)
                return;
            }
            if (stamp === getServerStamp()) {

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
        case ENUMS.ClientRequests.ENCOUNTER_INIT:
            getGameServerWorld().initServerEncounter(msgEvent)
            break;
        default:
            if (stamp === getServerStamp()) {
                if (typeof (msg.indexOf) !== 'function') {
                    console.log("Not array message", msg)

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
    console.log("processClientMessage", messageData)

    if (typeof(messageData.request) === 'number') {
        processClientRequest(messageData.request, messageData.stamp, messageData, connectedClient)
    } else {

    }

}



export {processClientMessage}