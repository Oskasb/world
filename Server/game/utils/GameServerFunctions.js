import {MATH} from "../../../client/js/application/MATH.js";
import {ENUMS} from "../../../client/js/application/ENUMS.js";
import {evt} from "../../../client/js/application/event/evt.js";

let gameServer = null;
let serverMessageProcessor = null;
let serverActors = [];

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

    msgData.stamp = messageData.stamp;
    msgData.msg = JSON.stringify(messageData.msg)

    let msg = [ENUMS.Protocol.SERVER_DISPATCH, msgData];
    serverMessageProcessor.sendJson(JSON.stringify(messageData));
    postMessage(msg);

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
}