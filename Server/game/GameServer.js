import {ENUMS} from "../../client/js/application/ENUMS.js";

let msgEvent = {
    stamp:0,
    msg:""
}

class GameServer {
    constructor(sendMessageCB, sendJsonCB) {
        this.serverTime = 0;
        this.sendJsonCB = sendJsonCB;
        this.sendMessageCB = sendMessageCB;
        this.stamp = "init";
        this.onUpdateCallbacks = [];
    }


    setStamp(stamp) {
        console.log("Set GameServer Stamp: ", stamp);
        this.stamp = stamp;
    }

    handleServerMessage(msg) {
        msgEvent.stamp = msg.stamp;
        msgEvent.msg = msg.msg;
        //	evt.dispatch(ENUMS.Event.ON_SOCKET_MESSAGE, msgEvent)
        postMessage([ENUMS.Protocol.MESSAGE_RECEIVE, msg])
    }

    handleClientMessage(msgJson) {

        this.sendJsonCB(msgJson)
    }

    handleClientRequest(msgJson) {
        let data = JSON.parse(msgJson)
        msgEvent.stamp = data.stamp;
        msgEvent.msg = data.msg;

        let request = data.msg.request;

        if (request === ENUMS.ClientRequests.ENCOUNTER_INIT) {
            console.log("Handle Encounter Init", data.msg)
        } else {
            console.log("Request not processed ",request,  msg)
        }

    //    console.log("Client Message Event: ", msgEvent)


    }

    initServerLoop(targetTpfMs) {

        let lastTick = performance.now();
        let avgTpf = targetTpfMs;

        let update = function() {
            let now = performance.now();
            let dt = now-lastTick;
            avgTpf = avgTpf*0.95 + dt*0.05;
            this.tickGameServer(Math.round(avgTpf));
            lastTick = now;
        }.bind(this)

        setInterval(update, targetTpfMs);

    }

    tickGameServer(tpf) {
        this.serverTime += tpf;
        console.log(tpf, this.serverTime);

    }

}

export { GameServer }