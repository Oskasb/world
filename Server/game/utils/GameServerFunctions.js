import {MATH} from "../../../client/js/application/MATH.js";
import {ENUMS} from "../../../client/js/application/ENUMS.js";
import {evt} from "../../../client/js/application/event/evt.js";

let gameServer = null;
let serverMessageProcessor = null;
let serverActors = [];
let serverItems = []

function setGameServer(gs) {
    evt.setEventKeys(ENUMS.Event);
    gameServer = gs;
}

function getServerStamp() {
    return gameServer.stamp;
}

function setServerMessageProcessor(msgProc) {
    serverMessageProcessor = msgProc;
}

function getGameServer() {
    return gameServer;
}

function registerServerActor(serverActor) {
    serverActors.push(serverActor);
}

function getRegisteredActors() {
    return serverActors;
}

function removeServerActor(serverActor) {
    MATH.splice(serverActors, serverActor);
}

function getServerActorByActorId(actorId) {
    for (let i = 0; i < serverActors.length; i++) {
        if (serverActors[i].id === actorId) {
            return serverActors[i];
        }
    }
}

function registerServerItem(serverItem) {
    serverItems.push(serverItem);
}

function removeServerItem(serverItem) {
    MATH.splice(serverItems, serverItem);
}

function getServerItemByItemId(itemId) {
    for (let i = 0; i < serverItems.length; i++) {
        if (serverItems[i].id === itemId) {
            return serverItems[i];
        }
    }
}

function getServerItems() {
    return serverItems;
}

function getGameServerWorld() {
    return gameServer.gameServerWorld;
}

function registerGameServerUpdateCallback(callback) {
    if (gameServer.onUpdateCallbacks.indexOf(callback) === -1) {
        gameServer.onUpdateCallbacks.push(callback);
    } else {
        console.log("GameServerCB already added", callback);
    }

}

function unregisterGameServerUpdateCallback(callback) {
    MATH.splice(gameServer.onUpdateCallbacks, callback);
}

let msgData = {
    stamp:-1,
    msg:"json"
}

function dispatchMessage(messageData) {
    console.log("Dispatch Msg ", messageData);
    getGameServer().messageAllClients(messageData)
}

function applyMessageToClient(messageDate) {
    postMessage([ENUMS.Protocol.MESSAGE_RELAYED, messageDate]);
}

function getStatusFromMsg(key, msg) {
    let keyIndex = msg.indexOf(key);
    if (keyIndex !== -1) {
        return msg[keyIndex+1]
    } else {
        return 'no_value'
    }

}

function statusMapFromMsg(msg) {
    let statusMap = {}
    applyStatusMessageToMap(msg, statusMap)
    return statusMap
}

function applyStatusMessageToMap(status, statusMap) {
    for (let i = 0; i < status.length; i++) {
        let statusKey = status[i]
        i++;
        let newValue =  status[i]
        statusMap[statusKey] = newValue;
    }
}


function equipActorItem(actor, itemTemplate) {

}

function applyStatusToMap(status, targetMap) {
    for (let key in status) {
        targetMap[key] = status[key]
    }
}

function getClientStampFromStatusMessage(status) {
    let stamp = getStatusFromMsg(ENUMS.ActorStatus.CLIENT_STAMP, status)

    if (stamp === 'no_value') {
    //    console.log("No client stamp in message... spatial update")
        if (status[0] === ENUMS.ActorStatus.ACTOR_ID) {
            let actor = GameAPI.getActorById(status[1])
            if (!actor) {
                console.log("No actor either... exiting")
                return;
            } else {
                stamp = actor.getStatus(ENUMS.ActorStatus.CLIENT_STAMP)
            }
        } else {
            console.log("Not trying to get stamp from status: ", status);
            return;
        }

    }
    return stamp;
}

export {
    getServerStamp,
    setServerMessageProcessor,
    getServerActorByActorId,
    getRegisteredActors,
    registerServerActor,
    removeServerActor,
    setGameServer,
    getGameServer,
    getGameServerWorld,
    registerGameServerUpdateCallback,
    unregisterGameServerUpdateCallback,
    dispatchMessage,
    applyMessageToClient,
    equipActorItem,
    getStatusFromMsg,
    statusMapFromMsg,
    registerServerItem,
    removeServerItem,
    getServerItems,
    getServerItemByItemId,
    applyStatusToMap,
    getClientStampFromStatusMessage,
    applyStatusMessageToMap

}