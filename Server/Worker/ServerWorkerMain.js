import {WorkerConnection} from "../../client/js/Transport/io/WorkerConnection.js";
import {ENUMS} from "../../client/js/application/ENUMS.js";
import {ConnectedPlayer} from "../game/player/ConnectedPlayer.js";

let workerConnection = new WorkerConnection()

let messageLocalClient = function(json) {
    postMessage([ENUMS.Protocol.SERVER_DISPATCH, JSON.parse(json)])
}

let localPlayer = new ConnectedPlayer(messageLocalClient)

let onConnected = function(event, serverStamp) {
    console.log("Connected Event:", event, serverStamp)
    localPlayer.setStamp(serverStamp);
    workerConnection.call.sendJson(JSON.stringify({request:ENUMS.ClientRequests.REGISTER_PLAYER, stamp:serverStamp}))
}

let onError = function(event) {
    console.log("Worker socket error: ", event)
}

let onDisconnect = function() {
    console.log("Worker socket disconnected")
}

let onMessage = function(data) {
    console.log("handle message from SOCKET", data);
    localPlayer.handleMessage(data, "SOCKET")
}

workerConnection.setupSocket(onConnected, onError, onDisconnect, onMessage)

let handleMessage = function(oEvent) {
   // console.log("handle message:", oEvent.data);
    if (oEvent.data[0] === ENUMS.Protocol.CLIENT_TO_WORKER) {
        localPlayer.handleMessage(oEvent.data[1], "WORKER");
    } else {
        console.log("Not Parsed message:", oEvent.data);
    }

};

console.log("Load Worker Main")

onmessage = function (oEvent) {
    handleMessage(oEvent);
};

