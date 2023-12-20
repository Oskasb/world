import {ENUMS} from "../../client/js/application/ENUMS.js";

let msgEvent = {
    stamp:0,
    msg:""
}

class GameServer {
    constructor(sendMessageCB, sendJsonCB) {
        this.sendJsonCB = sendJsonCB;
        this.sendMessageCB = sendMessageCB;
        this.stamp = "init";
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

}

export { GameServer }