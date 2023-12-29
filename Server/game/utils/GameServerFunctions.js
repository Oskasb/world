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
    for (let i = 0; i < msg.length; i++) {
        let statusKey = ENUMS.ActorStatus[msg[i]]
        i++;
        let newValue =  msg[i]
        statusMap[statusKey] = newValue;
    }
    return statusMap
}


function equipActorItem(actor, itemTemplate) {

}

function applyStatusToMap(status, targetMap) {
    for (let key in status) {
        targetMap[key] = status[key]
    }
}

export {
    getServerStamp,
    setServerMessageProcessor,
    getServerActorByActorId,
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
    getServerItemByItemId,
    applyStatusToMap

}