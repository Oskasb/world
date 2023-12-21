import {WorkerConnection} from "../../client/js/Transport/io/WorkerConnection.js";
import {ENUMS} from "../../client/js/application/ENUMS.js";
import {GameServer} from "../game/GameServer.js";
import {setGameServer} from "../game/utils/GameServerUtils.js";

let workerConnection = new WorkerConnection()
let gameServer = new GameServer(workerConnection.call.sendMessage, workerConnection.call.sendJson);
setGameServer(gameServer);





let stamp = 0;

let onConnected = function(event, serverStamp) {
    console.log("Connected Event:", event)
        gameServer.setStamp(serverStamp);
        //    let msg = {}
        //    msg[ENUMS.Send.CONNECTED] = stamp;
        //    client.evt.dispatch(ENUMS.Event.SEND_SOCKET_MESSAGE, msg)

//    evt.on(ENUMS.Event.SEND_SOCKET_MESSAGE, connection.call.sendMessage)

}

let onError = function(event) {
    console.log("Worker socket error: ", event)
}

let onDisconnect = function() {
    console.log("Worker socket disconnected")
}

workerConnection.setupSocket(onConnected, onError, onDisconnect, gameServer.connectionMessage)

let handleMessage = function(oEvent) {

    if (oEvent.data[0] === ENUMS.Protocol.CLIENT_TO_WORKER) {
        gameServer.handleClientMessage(oEvent.data[1]);
    } else if (oEvent.data[0] === ENUMS.Protocol.SERVER_CALL) {
        gameServer.handleClientRequest(oEvent.data[1]);
    } else {
        console.log("Not Parsed message:", oEvent.data);
    }

};

gameServer.initServerLoop(100)

console.log("Load Worker Main")

onmessage = function (oEvent) {
    handleMessage(oEvent);
};
