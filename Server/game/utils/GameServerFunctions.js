import {MATH} from "../../../client/js/application/MATH.js";
import {ENUMS} from "../../../client/js/application/ENUMS.js";
import {evt} from "../../../client/js/application/event/evt.js";

let gameServer = null;
let serverMessageProcessor = null;
let serverActors = [];

function setGameServer(gs) {
    evt.setEventKeys(ENUMS.Event);
    gameServer = gs;
}

function getServerStamp() {
    return gameServer.stamp;
}

function setServerMessageProcessor(msgProc) {
    serverMessageProcessor = msgProc;
}

function getGameServer() {
    return gameServer;
}

function registerServerActor(serverActor) {
    serverActors.push(serverActor);
}

function removeServerActor(serverActor) {
    MATH.splice(serverActors, serverActor);
}

function getServerActorByActorId(actorId) {
    for (let i = 0; i < serverActors.length; i++) {
        if (serverActors[i].id === actorId) {
            return serverActors[i];
        }
    }
}

function getGameServerWorld() {
    return gameServer.gameServerWorld;
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
    serverMessageProcessor.sendJson(JSON.stringify(messageData));
    postMessage(msg);

}

function applyMessageToClient(messageDate) {
    postMessage([ENUMS.Protocol.MESSAGE_RELAYED, messageDate]);
}

function processStatusMessage(stamp, msg) {

    if (gameServer === null) {
        console.log("No game Server", stamp, msg)
        return;
    }


    if (typeof (msg.indexOf) !== 'function') {
        console.log("Not array message", msg)

    } else {

        if (msg.indexOf(ENUMS.ItemStatus.ITEM_ID) === 0) {
        //    let player = gameServer.getConnectedPlayerByStamp(stamp);
            let actorIdIdx = msg.indexOf(ENUMS.ItemStatus.ACTOR_ID)+1;
            let actorId = msg[actorIdIdx]
            let actor = getServerActorByActorId(actorId)
            if (actor) {
                actor.updateItemStatusFromMessage(msg)
            } else {
                console.log("Item Message for no actor", msg)
                //    return;
            }

        } else if (msg.indexOf(ENUMS.ActionStatus.ACTION_ID) === 0) {
         //   let player = gameServer.getConnectedPlayerByStamp(stamp);;
            let actorIdIdx = msg.indexOf(ENUMS.ActionStatus.ACTOR_ID)+1;
            let actor = getServerActorByActorId(msg[actorIdIdx])
            if (actor) {
                actor.updateActionStatusFromMessage(msg);
            } else {
                console.log("ServerActor not loaded")
                return;
            }

        } else if (msg.indexOf(ENUMS.ActorStatus.ACTOR_ID) === 0) {
        //    let player = gameServer.getConnectedPlayerByStamp(stamp);;
            let actor = getServerActorByActorId(msg[1])
            if (actor) {
                actor.updateStatusFromMessage(msg);
            } else {
                console.log("ServerActor not loaded", msg[1], msg, player)
                return;
            }
        } else {
            console.log("Request not processed ",request,  msg)
            return;
        }

    }
}

function equipActorItem(actor, itemTemplate) {

}

export {
    getServerStamp,
    setServerMessageProcessor,
    getServerActorByActorId,
    registerServerActor,
    removeServerActor,
    setGameServer,
    getGameServer,
    getGameServerWorld,
    registerGameServerUpdateCallback,
    unregisterGameServerUpdateCallback,
    dispatchMessage,
    applyMessageToClient,
    processStatusMessage,
    equipActorItem
}