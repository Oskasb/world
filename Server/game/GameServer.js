import {ENUMS} from "../../client/js/application/ENUMS.js";
import {MATH} from "../../client/js/application/MATH.js";
import {ServerEncounter} from "./encounter/ServerEncounter.js";

let msgEvent = {
    stamp:0,
    msg:""
}

class GameServer {
    constructor(sendMessageCB, sendJson) {
        this.tpf = 1;
        this.serverTime = 0;
        this.onUpdateCallbacks = [];
        this.sendJson = sendJson;
        this.sendMessageCB = sendMessageCB;
        this.stamp = "init";
    }


    setStamp(stamp) {
        console.log("Set GameServer Stamp: ", stamp);
        this.stamp = stamp;
    }

    connectionMessage(msg) {
        msgEvent.stamp = msg.stamp;
        msgEvent.msg = msg.msg;
        console.log("relay message", msg);
        postMessage([ENUMS.Protocol.MESSAGE_RELAYED, msg])
    }

    handleClientMessage(msgJson) {

        this.sendJson(msgJson)
    }

    handleClientRequest(msgJson) {
        let data = JSON.parse(msgJson)
        msgEvent.stamp = data.stamp;
        msgEvent.msg = data.msg;

        let request = data.msg.request;

        if (request === ENUMS.ClientRequests.ENCOUNTER_INIT) {
            new ServerEncounter(msgEvent);
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

    tickGameServer(avgTpf) {
        this.tpf = avgTpf;
        this.serverTime += avgTpf;
    //    console.log(this.tpf, this.serverTime);
        MATH.callAll(this.onUpdateCallbacks, this.tpf, this.serverTime);

    }

}

export { GameServer }