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
        postMessage([ENUMS.Protocol.MESSAGE_RECIEVE, msg])
    }

    handleClientMessage(msgJson) {
        let msg = JSON.parse(msgJson)
        msgEvent.stamp = msg.stamp;
        msgEvent.msg = msg.msg;
        console.log("Client Message Event: ", msgEvent)
        this.sendJsonCB(msgJson)
    //    evt.dispatch(ENUMS.Event.ON_SOCKET_MESSAGE, msgEvent)
    //    postMessage([ENUMS.Protocol.MESSAGE_RECIEVE, msg])
    }

}

export { GameServer }