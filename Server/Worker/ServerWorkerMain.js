import {WorkerConnection} from "../../client/js/Transport/io/WorkerConnection.js";
import {ENUMS} from "../../client/js/application/ENUMS.js";
import {GameServer} from "../game/GameServer.js";
import {setGameServer, setServerMessageProcessor} from "../game/utils/GameServerFunctions.js";
import {ServerMessageProcessor} from "../io/ServerMessageProcessor.js";

let workerConnection = new WorkerConnection()
let gameServer = new GameServer();
gameServer.initServerLoop(100)
let serverMessageProcessor = new ServerMessageProcessor(workerConnection.call.sendMessage, workerConnection.call.sendJson)

setGameServer(gameServer);
setServerMessageProcessor(serverMessageProcessor);

let onConnected = function(event, serverStamp) {
    console.log("Connected Event:", event)
    gameServer.setStamp(serverStamp);
}

let onError = function(event) {
    console.log("Worker socket error: ", event)
}

let onDisconnect = function() {
    console.log("Worker socket disconnected")
}

workerConnection.setupSocket(onConnected, onError, onDisconnect, serverMessageProcessor.connectionMessage)

let handleMessage = function(oEvent) {
    console.log("handle message:", oEvent.data);
    if (oEvent.data[0] === ENUMS.Protocol.CLIENT_TO_WORKER) {
        serverMessageProcessor.handleClientMessage(oEvent.data[1]);
    } else if (oEvent.data[0] === ENUMS.Protocol.SERVER_CALL) {
        serverMessageProcessor.handleClientRequest(oEvent.data[1]);
    } else {
        console.log("Not Parsed message:", oEvent.data);
    }

};

console.log("Load Worker Main")

onmessage = function (oEvent) {
    handleMessage(oEvent);
};

