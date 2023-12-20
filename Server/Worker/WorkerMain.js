import {WorkerConnection} from "../../client/js/Transport/io/WorkerConnection.js";
import {MATH} from "../../client/js/application/MATHM.js";
import {ENUMS} from "../../client/js/application/ENUMS.js";
import {evt} from "../../client/js/application/event/evt.js";
import {GameServer} from "../game/GameServer.js";

let workerConnection = new WorkerConnection()
let gameServer = new GameServer();


WorkerGlobalScope.MATH = new MATH();
WorkerGlobalScope.ENUMS = ENUMS;
WorkerGlobalScope.evt = new evt(ENUMS.Event);

let stamp = 0;

let onConnected = function(event) {
    console.log("Connected Event:", event)
    if (stamp === 0) {
        stamp = WorkerGlobalScope.MATH.decimalify(event.timeStamp + new Date().getTime(), 1);
        let result = 0;
        result = Number(String(stamp).split('').reverse().join(''));
        gameServer.setStamp(result);
        //    let msg = {}
        //    msg[ENUMS.Send.CONNECTED] = stamp;
        //    client.evt.dispatch(ENUMS.Event.SEND_SOCKET_MESSAGE, msg)
    }

//    evt.on(ENUMS.Event.SEND_SOCKET_MESSAGE, connection.call.sendMessage)


}

let onError = function(event) {
    console.log("Worker socket error: ", event)
}

let onDisconnect = function() {
    console.log("Worker socket disconnected")
}

workerConnection.setupSocket(onConnected, onError, onDisconnect)

let handleMessage = function(oEvent) {

    console.log("Game Worker Main message: ", oEvent.data);

    if (oEvent.data[0] == 'storeJson') {

    }

    if (oEvent.data[0] == 'json') {

    }

    if (oEvent.data[0] == 'svg') {

    }

    if (oEvent.data[0] == 'bin') {

    }
};

console.log("Load Worker Main")

onmessage = function (oEvent) {
    handleMessage(oEvent);
};

