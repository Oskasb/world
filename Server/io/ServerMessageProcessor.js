import {ENUMS} from "../../client/js/application/ENUMS.js";
import {ServerEncounter} from "../game/encounter/ServerEncounter.js";
import {
    dispatchMessage,
    getGameServer,
    getGameServerWorld,
    getServerStamp,
    applyMessageToClient,
    getServerActorByActorId, statusMapFromMsg, getStatusFromMsg, getServerItemByItemId
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

                dispatchMessage(msgEvent)
            } else {
                applyMessageToClient(msgEvent)
            }


    }
}

class ServerMessageProcessor {

    constructor(sendJson) {
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
        let data = JSON.parse(msgJson)
        //    console.log("handle message from CLIENT", data);
        processMessageData(data.stamp, data.msg)
    }

}



export {ServerMessageProcessor}