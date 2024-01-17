import {ENUMS} from "../../../client/js/application/ENUMS.js";
import {
    applyStatusToMap,
    dispatchMessage,
    getGameServer,
    getGameServerWorld, getRegisteredActors, getServerActorByActorId,
    getServerItemByItemId, getServerItems,
    getServerStamp, getStatusFromMsg, statusMapFromMsg
} from "./GameServerFunctions.js";
import {getIncomingBytes, getOutgoingBytes} from "./ServerStatusTracker.js";
import {applyServerAction} from "../action/ServerActionFunctions.js";
import {MATH} from "../../../client/js/application/MATH.js";

let msgEvent = {
    stamp:0,
    msg: {}
}

function processClientRequest(request, stamp, message, connectedClient) {
//    console.log("Process Request: ", ENUMS.getKey('ClientRequests', request), message)

    msgEvent.msg = message
    msgEvent.stamp = stamp;
    message.stamp = connectedClient.stamp;
    let player;
    let actor;
    let target;
    let actorId;
    let statusValues;
    let serverEncounter;

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
            let item = getServerItemByItemId(message.status[1])

            if (!item) {
            //    console.log("Item missing ", message.status[1], getServerItems())
                return;
            }
            item.updateItemStatusFromMessage(message.status)
            message.command = ENUMS.ServerCommands.ITEM_UPDATE;
            dispatchMessage(message);
            break;

        case ENUMS.ClientRequests.APPLY_ACTION_STATUS:
            player = getGameServer().getConnectedPlayerByStamp(connectedClient.stamp);

            if (!player) {
                console.log("No player for action, exiting", message)
                return;
            }

            let actionState = getStatusFromMsg(ENUMS.ActionStatus.ACTION_STATE, message.status);

            if (actionState === ENUMS.ActionState.ACTIVE || actionState === ENUMS.ActionState.APPLY_HIT) {
                let modifiers = getStatusFromMsg(ENUMS.ActionStatus.STATUS_MODIFIERS, message.status);

                if (typeof modifiers === 'object') {
                    if (modifiers.length > 0) {
                            console.log("actionState modifiers", actionState, modifiers)
                        actorId = getStatusFromMsg(ENUMS.ActionStatus.ACTOR_ID, message.status);
                        actor = player.getPlayerActor(actorId);
                        let targetId = getStatusFromMsg(ENUMS.ActionStatus.TARGET_ID, message.status);
                        target = player.serverEncounter.getEncounterCombatantById(targetId);
                        actor.serverAction.processActionStatusModifiers(modifiers, target);
                        MATH.emptyArray(modifiers);
                        player.serverEncounter.sendActorStatusUpdate(target);
                        target.setStatusKey(ENUMS.ActorStatus.DAMAGE_APPLIED, 0)
                        target.setStatusKey(ENUMS.ActorStatus.HEALING_APPLIED, 0)
                    }
                }
            }

            //    statusValues = statusMapFromMsg(message.status);
        //    let item = getServerItemByItemId(message.status[1])

        //    if (!item) {
                //    console.log("Item missing ", message.status[1], getServerItems())
        //        return;
        //    }
        //    item.updateItemStatusFromMessage(message.status)

            message.command = ENUMS.ServerCommands.ACTION_UPDATE;
            dispatchMessage(message);
            break;

        case ENUMS.ClientRequests.APPLY_ACTOR_STATUS:
            player = getGameServer().getConnectedPlayerByStamp(connectedClient.stamp);

            actor = player.getPlayerActor(message.status[1])

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
            getGameServerWorld().initServerEncounter(message)
            break;
        case ENUMS.ClientRequests.ENCOUNTER_PLAY:
            getGameServerWorld().handleEncounterPlayMessage(message)
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

        case ENUMS.ClientRequests.REGISTER_CONFIGS:
            getGameServer().registerServerConfigData(message.data);
            break;
        case ENUMS.ClientRequests.APPLY_ACTION_EFFECT:
        //    console.log('APPLY_ACTION_EFFECT', message);
/*
            player = getGameServer().getConnectedPlayerByStamp(message.stamp)
            target = player.serverEncounter.getEncounterCombatantById(message.targetId);
            let modifier = message.modifier;
            let amount = message.amount;
            applyServerAction(target, modifier, amount);
            player.serverEncounter.sendActorStatusUpdate(target);

 */
            // console.log('APPLY_ACTION_EFFECT', player, target, modifier, amount);
            break;
        default:
            console.log("Message not handled by server:", message)
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