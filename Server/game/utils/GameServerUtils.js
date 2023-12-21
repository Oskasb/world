import {MATH} from "../../../client/js/application/MATH.js";
import {ENUMS} from "../../../client/js/application/ENUMS.js";
import {evt} from "../../../client/js/application/event/evt.js";

let gameServer = null;

function setGameServer(gs) {
    evt.setEventKeys(ENUMS.Event);
    gameServer = gs;
}

function getGameServer() {

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
    gameServer.sendJson(JSON.stringify(messageData));
    postMessage(msg);

}


export {
    setGameServer,
    getGameServer,
    registerGameServerUpdateCallback,
    unregisterGameServerUpdateCallback,
    dispatchMessage,
}