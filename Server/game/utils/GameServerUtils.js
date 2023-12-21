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

function registerOnServerUpdateCallback(callback) {
    if (gameServer.onUpdateCallbacks.indexOf(callback) === -1) {
        gameServer.onUpdateCallbacks.push(callback);
    } else {
        console.log("GameServerCB already added", callback);
    }

}

function unregisterOnServerUpdateCallback(callback) {
    MATH.splice(gameServer.onUpdateCallbacks, callback);
}



export {
    setGameServer,
    getGameServer,
    registerOnServerUpdateCallback,
    unregisterOnServerUpdateCallback,

}