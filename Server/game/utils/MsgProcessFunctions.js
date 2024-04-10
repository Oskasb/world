import {ENUMS} from "../../../client/js/application/ENUMS.js";
import {
    applyStatusToMap, broadcastAll,
    dispatchMessage,
    getGameServer,
    getGameServerWorld, getRegisteredActors, getServerActorByActorId,
    getServerItemByItemId, getServerItems,
    getServerStamp, getStatusFromMsg, statusMapFromMsg
} from "./GameServerFunctions.js";
import {getIncomingBytes, getOutgoingBytes} from "./ServerStatusTracker.js";
import {applyServerAction} from "../action/ServerActionFunctions.js";
import {MATH} from "../../../client/js/application/MATH.js";
import {getEditIndex, readFileFromSocketMessage, saveFileFromSocketMessage} from "./EditorFunctions.js";

let msgEvent = {
    stamp:0,
    msg: {}
}


function relayActorMessage(actor, message, player) {
    let inCombat = actor.getStatus(ENUMS.ActorStatus.IN_COMBAT)
    if (inCombat) {
        if (player.serverEncounter) {
            player.serverEncounter.call.messageParticipants(message);
        } else {
            dispatchMessage(message);
        }

    } else {
        dispatchMessage(message);
    }
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
        //    console.log("REGISTER_PLAYER: ",message);

            let add = getGameServer().registerConnectedPlayer(stamp);

            if (add) {
                connectedClient.setStamp(stamp)
                message.command = ENUMS.ServerCommands.PLAYER_CONNECTED
                dispatchMessage(message)
                message.command = ENUMS.ServerCommands.LOAD_FILE_DATA
                message.id = "edit_index";
                message.data = getEditIndex();
                connectedClient.call.returnDataMessage(message)
            }

            break
        case ENUMS.ClientRequests.LOAD_SERVER_ACTOR:
        //    console.log("LOAD_SERVER_ACTOR: ", message);

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
        case ENUMS.ClientRequests.UPDATE_STRONGHOLD:
            player = getGameServer().getConnectedPlayerByStamp(connectedClient.stamp);
            player.updatePlayerStronghold(message);
            break;
        case ENUMS.ClientRequests.APPLY_ITEM_STATUS:
            player = getGameServer().getConnectedPlayerByStamp(connectedClient.stamp);

            if (!player) {
                console.log("No player for item, exiting")
                return;
            }

            actorId = getStatusFromMsg(ENUMS.ActorStatus.ACTOR_ID, message.status);
            actor = player.getPlayerActor(actorId)

            if (!actor) {
            //    console.log("No actor for item msg", connectedClient.stamp)
                return;
            }

        //    statusValues = statusMapFromMsg(message.status);
            let item = getServerItemByItemId(message.status[1])

            if (!item) {
            //    console.log("Item missing ", message.status[1], getServerItems())
                return;
            }
            item.updateItemStatusFromMessage(message.status)
            message.command = ENUMS.ServerCommands.ITEM_UPDATE;
            relayActorMessage(actor, message, player)
            // dispatchMessage(message);
            break;

        case ENUMS.ClientRequests.APPLY_ACTION_STATUS:
            player = getGameServer().getConnectedPlayerByStamp(connectedClient.stamp);

            if (!player) {
                console.log("No player for action, exiting", connectedClient.stamp)
                return;
            }

            let actionState = getStatusFromMsg(ENUMS.ActionStatus.ACTION_STATE, message.status);

            actorId = getStatusFromMsg(ENUMS.ActionStatus.ACTOR_ID, message.status);
            actor = player.getPlayerActor(actorId);

            if (!actor) {
            //    console.log("No actor for action msg", connectedClient.stamp)
                return;
            }

            if ( actionState === ENUMS.ActionState.SELECTED || actionState === ENUMS.ActionState.ACTIVE || actionState === ENUMS.ActionState.APPLY_HIT) {
                let modifiers = getStatusFromMsg(ENUMS.ActionStatus.STATUS_MODIFIERS, message.status);

                if (typeof modifiers === 'object') {
                    if (modifiers.length > 0) {
                        console.log("actionState modifiers", actionState, modifiers)

                        let targetId = getStatusFromMsg(ENUMS.ActionStatus.TARGET_ID, message.status);
                        target = player.serverEncounter.getEncounterCombatantById(targetId);
                        actor.serverAction.processActionStatusModifiers(modifiers, target, actor);
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
            relayActorMessage(actor, message, player);
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
            relayActorMessage(actor, message, player);

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

        case ENUMS.ClientRequests.WRITE_FILE:
            console.log("saveFileFromSocketMessage", message.id)
            saveFileFromSocketMessage(message);
            message.command = ENUMS.ServerCommands.LOAD_FILE_DATA;
        //    if (message.format === 'json') {
                message.data = JSON.parse(message.data);
        //    }
            broadcastAll(message)
            break;
        case ENUMS.ClientRequests.READ_FILE:
        //    console.log("ENUMS.ClientRequests.READ_FILE", message)


            let callback = function(data) {

                let res = {
                    stamp:message.stamp,
                    command:ENUMS.ServerCommands.LOAD_FILE_DATA,
                    request:ENUMS.ClientRequests.READ_FILE,
                    id:message.id,
                    root:message.root,
                    folder:message.folder,
                    path:message.path,
                    format:message.format,
                    timestamp:message.timestamp
                }

                res.data = data;
                connectedClient.call.returnDataMessage(res)
            }

            readFileFromSocketMessage(message, callback)
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