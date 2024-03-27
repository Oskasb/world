import {evt} from "../../application/event/evt.js";
import {notifyCameraStatus} from "../../3d/camera/CameraFunctions.js";
import {
    applyStatusMessageToMap,
    applyStatusToMap, getClientStampFromStatusMessage,
    getStatusFromMsg,
    statusMapFromMsg
} from "../../../../Server/game/utils/GameServerFunctions.js";
import {ENUMS} from "../../application/ENUMS.js";
import {MATH} from "../../application/MATH.js";
import {RemoteClient} from "./RemoteClient.js";
import {processStatisticalActionApplied} from "../../game/actions/ActionStatusProcessor.js";
import {applyRemoteConfigMessage, setEditIndexClient} from "../../application/utils/ConfigUtils.js";
import {saveFileFromSocketMessage} from "../../../../Server/game/utils/EditorFunctions.js";


let remoteClients = {}

function processActorInit(stamp, msg) {
    let status = msg.status;

    let initLocalPlayerControlledActor = function(playerActor, startingItems) {
        console.log("initLocalPlayerControlledActor; ", stamp, msg);

        let items = [];
        let equiped = playerActor.getStatus(ENUMS.ActorStatus.EQUIPPED_ITEMS)
/*
        while (startingItems.length) {
            playerActor.equipItem(startingItems.pop())
        }
*/
        for (let i = 0; i < startingItems.length; i++) {
            let template = startingItems[i].getStatus(ENUMS.ItemStatus.TEMPLATE);
            let slotId = GameAPI.getGamePieceSystem().getItemConfig(template)['equip_slot'];
        //    console.log(slotId);;
            items.push(slotId);
            items.push(template);
        }

        playerActor.setStatusKey(ENUMS.ActorStatus.EQUIPPED_ITEMS, [])

        setTimeout(function() {

        //    playerActor.setStatusKey(ENUMS.ActorStatus.EQUIPPED_ITEMS, [])
            console.log("Equip Items ", items);

            GameAPI.getGamePieceSystem().addActorToPlayerParty(playerActor);
            GameAPI.getGamePieceSystem().playerParty.selectPartyActor(playerActor);
            playerActor.call.activateActionKey("ACTION_TRAVEL_WALK", ENUMS.ActorStatus.TRAVEL)
            playerActor.setStatusKey(ENUMS.ActorStatus.TRAVEL_MODE, ENUMS.TravelMode.TRAVEL_MODE_WALK)
            playerActor.setStatusKey(ENUMS.ActorStatus.PARTY_SELECTED, true)
            notifyCameraStatus(ENUMS.CameraStatus.CAMERA_MODE, ENUMS.CameraControls.CAM_MOVE, true)
            notifyCameraStatus(ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_AHEAD, true)
            notifyCameraStatus(ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_PARTY, true)
            notifyCameraStatus(ENUMS.CameraStatus.POINTER_ACTION, ENUMS.CameraControls.CAM_MOVE, null)
            playerActor.setStatusKey(ENUMS.ActorStatus.ACTIVATION_STATE, ENUMS.ActivationState.ACTIVE)

           setTimeout(function() {
               playerActor.setStatusKey(ENUMS.ActorStatus.EQUIP_REQUESTS, items)
               setTimeout(function() {
                   playerActor.setStatusKey(ENUMS.ActorStatus.EQUIP_REQUESTS, [])
               }, 200)
           }, 500)


        //    GameAPI.getGamePieceSystem().grabLooseItems(playerActor);
        }, 300)

    }

    let actorLoaded = function(actor) {
    //    console.log("actorLoaded; ", stamp, msg);
        for (let key in status) {
            actor.setStatusKey(key, status[key]);
        }

        actor.id = actor.getStatus(ENUMS.ActorStatus.ACTOR_ID)

        let onActivated = function(actor) {
            if (actor.getStatus(ENUMS.ActorStatus.ACTOR_ID) === GameAPI.getGamePieceSystem().playerActorId) {
                initLocalPlayerControlledActor(actor, GameAPI.getGamePieceSystem().startingItems);
            } else {
                console.log("Remotely operated actor activated", actor);
            }
        }

        actor.activateGameActor(onActivated);
    }

    let configId = status[ENUMS.ActorStatus.CONFIG_ID];
  //  console.log("ACTOR_INIT; ", configId, stamp, msg);
    evt.dispatch(ENUMS.Event.LOAD_ACTOR,  {id: configId, callback:actorLoaded})


}

function processItemInit(msg) {
    let status = msg.status;

    let itemLoaded = function(item) {

        item.id = status[ENUMS.ItemStatus.ITEM_ID]

        for (let key in status) {
            item.setStatusKey(key, status[key]);
        }console.log("itemLoaded: ", item, status)
        ThreeAPI.addPostrenderCallback(item.status.call.pulseStatusUpdate)
        let equippedToActorId = item.getStatus(ENUMS.ItemStatus.ACTOR_ID);
        let actor = GameAPI.getActorById(equippedToActorId);

        if (actor) {
            actor.equipItem(item)
        } else {
            GameAPI.getGamePieceSystem().addLooseItem(item);

        }


    }

    let templateId = status[ENUMS.ItemStatus.TEMPLATE];
//    console.log("ITEM_INIT: ", templateId, msg);
    evt.dispatch(ENUMS.Event.LOAD_ITEM,  {id: templateId, callback:itemLoaded})

}

function processRemoteStatus(stamp, msgStatus) {
    let remoteClient = remoteClients[stamp];
    if (remoteClient) {
        //    console.log("REMOTE ACTOR_UPDATE; ", stamp, [msg.status]);
        remoteClient.processClientMessage(msgStatus);
    } else {
        console.log("REMOTE UPDATE - Remote client missing for stamp; ", stamp, remoteClients);
        remoteClients[stamp] = new RemoteClient(stamp);
        remoteClients[stamp].processClientMessage(msgStatus);
    }
}

let lastBytesOut = 0;
let lastBytesIn = 0;
let lastPingTime = 0;

function processServerCommand(protocolKey, message) {

 //   console.log("processServerCommand", protocolKey, message)

    let clientStamp = client.getStamp();
    let stamp = message.stamp;
    let msg = message;
    let encounter;
    let actorId;

    if (!msg.command) {
        console.log("processServerCommand requires msg.command", message)
        return;
    }

    if (typeof(msg.request) === 'number') {
    //    console.log(ENUMS.getKey('ServerCommands', msg.command) +" is response to request ", ENUMS.getKey('ClientRequests', msg.request), message)
    }  else {
        console.log("Non Request: ", ENUMS.getKey('Protocol', protocolKey), ENUMS.getKey('ServerCommands', msg.command), msg);
    }

    switch (msg.command) {
        case ENUMS.ServerCommands.SYSTEM_INFO:
            let now = performance.now();
            let clientFrame = GameAPI.getFrame().frame;
            let pingFrame = msg.pingFrame;
            let pingFrames = pingFrame - clientFrame;
            let pingCycleTime = MATH.numberToDigits(now - msg.outTime, 1, 1);
            let clientCount = msg.clientCount;
            let actorCount = msg.actorCount;
            let bytesOut = msg.bytesOut;
            let bytesIn = msg.bytesIn;
            let bytesOutDelta = bytesOut - lastBytesOut;
            let bytesInDelta = bytesIn - lastBytesIn;
            let timeDelta = (now - lastPingTime) * 0.001; // measure in seconds
            lastBytesOut = bytesOut;
            lastBytesIn = bytesIn;
            lastPingTime = now;
            let bytesOutPerS = MATH.numberToDigits(0.001 * bytesOutDelta / timeDelta, 1, 1);
            let bytesInPerS = MATH.numberToDigits(0.001 * bytesInDelta / timeDelta, 1, 1);

        //    console.log("Ping; ", pingCycleTime, msg);
            GuiAPI.screenText(pingCycleTime+'ms', ENUMS.Message.PING, 2);
            GuiAPI.screenText('out: '+bytesOutPerS+'kb/s in: '+bytesInPerS+'kb/s', ENUMS.Message.SERVER_STATUS, 3);
            break;
        case ENUMS.ServerCommands.PLAYER_CONNECTED:
    //        console.log("Player Connected; ", stamp, msg);

            if (stamp === clientStamp ) {

            } else {
                GuiAPI.screenText("Remote Player Connected", ENUMS.Message.HINT, 2)
                if (!remoteClients[stamp]) {
                    remoteClients[stamp] = new RemoteClient(stamp);
                } else {
                    console.log("Remote already added for stamp: ", stamp);
                }
            }


            break;
        case ENUMS.ServerCommands.PLAYER_UPDATE:
            console.log("Player Update; ", stamp, msg);

            break;
        case ENUMS.ServerCommands.PLAYER_DISCONNECTED:
            console.log("Player Disconnected; ", stamp, msg);
            GuiAPI.screenText("Player Disconnected", ENUMS.Message.HINT, 2)
            break;
        case ENUMS.ServerCommands.ACTOR_INIT:
            stamp = msg.status[ENUMS.ActorStatus.CLIENT_STAMP];

            if (stamp === clientStamp) {
                processActorInit(stamp, msg);
            } else {
                // use remote client here...
                let remoteClient = remoteClients[stamp];
                if (remoteClient) {
                } else {
                //    console.log("ACTOR_INIT Remote client missing for stamp; ", stamp, msg, remoteClients);
                    remoteClient = new RemoteClient(stamp);
                    remoteClients[stamp] = remoteClient
                }

            //    console.log("REMOTE ACTOR_INIT; ", stamp, [msg.status]);

                let statusList = [];
                statusList[0] = ENUMS.ActorStatus.ACTOR_ID;
                statusList[1] = msg.status[ENUMS.ActorStatus.ACTOR_ID];
                for (let key in msg.status) {
                    if (key !== ENUMS.ActorStatus.ACTOR_ID) {
                        statusList.push(key)
                        statusList.push(msg.status[key])
                    }
                }

                remoteClient.processClientMessage(statusList);
            }

            break;
        case ENUMS.ServerCommands.ACTOR_UPDATE:

            if (stamp === clientStamp) {
                // own client already has the command status, use response for hard states
                let clientActor = GameAPI.getGamePieceSystem().selectedActor;
                if (clientActor) {
                    clientActor.actorStatus.applyServerCommandStatus(msg.status);
                }

            } else {
                // use remote client here...
                processRemoteStatus(stamp, msg.status)
            }

            break;
        case ENUMS.ServerCommands.ACTION_UPDATE:
        //    console.log("ACTION_UPDATE; ", stamp, message);
            if (stamp === clientStamp) {
                // own client already has the command status, use response for something?
        //        console.log("Local ACTION_UPDATE response", message)
                let clientActor = GameAPI.getGamePieceSystem().selectedActor;


                if (clientActor) {
                    let passiveActions = clientActor.getStatus(ENUMS.ActorStatus.PASSIVE_ACTIONS)
                //    console.log("PlayerActor update", passiveActions, message.status)
                    let key = getStatusFromMsg(ENUMS.ActionStatus.ACTION_KEY, message.status)
                    if (passiveActions.indexOf(key) !== -1) {
                        let actionState = getStatusFromMsg(ENUMS.ActionStatus.ACTION_STATE, message.status);
                        if (actionState === ENUMS.ActionState.DISABLED) {
                            console.log("PlayerActor activate passive action", message.status);
                            clientActor.actorText.say(key)
                        } else {
                            console.log("PlayerActor update passive action", message.status);
                        }


                    }

            //        clientActor.actorStatus.applyServerCommandStatus(msg.status);
                }

            } else {
                // use remote client here...
            //    console.log("Remote ACTION_UPDATE", message)
                processRemoteStatus(stamp, msg.status)
            }

            let actionState = getStatusFromMsg(ENUMS.ActionStatus.ACTION_STATE, message.status);

            if (actionState === ENUMS.ActionState.ACTIVE || actionState === ENUMS.ActionState.APPLY_HIT ) {
                let modifiers = getStatusFromMsg(ENUMS.ActionStatus.STATUS_MODIFIERS, message.status);
                if (typeof modifiers === 'object') {
                    if (modifiers.length > 0) {
                        actorId = getStatusFromMsg(ENUMS.ActionStatus.ACTOR_ID, message.status);
                     //   console.log("actionState client", actionState, modifiers, message)
                        let sourceActor = GameAPI.getActorById(actorId);
                        let targetId = getStatusFromMsg(ENUMS.ActionStatus.TARGET_ID, message.status);
                        let targetActor = GameAPI.getActorById(targetId);
                        processStatisticalActionApplied(targetActor, modifiers, sourceActor);
                        // actor.serverAction.processActionStatusModifiers(modifiers, target);
                        MATH.emptyArray(modifiers);
                    }
                }
            }


            break;
        case ENUMS.ServerCommands.ACTOR_REMOVED:
            console.log("ACTOR_REMOVED; ", stamp, message);
            actorId = message.actorId;

            let remoteClient = remoteClients[stamp];
            if (remoteClient) {
               remoteClient.removeRemoteActor(actorId);
            } else {
                let actor = GameAPI.getActorById(actorId);
                actor.removeGameActor();
            }

            break;
        case ENUMS.ServerCommands.ITEM_INIT:
        //    console.log("Command: ITEM_INIT", message)
            if (stamp === clientStamp) {
        //        console.log("Local: ITEM_INIT", stamp, message)
                processItemInit(message);
            } else {
        //        console.log("Remote: ITEM_INIT", stamp, message)
            //    processRemoteStatus(stamp, message.status)
            }
            break;
        case ENUMS.ServerCommands.ITEM_UPDATE:
        //    console.log("ITEM_UPDATE; ", message);

            if (stamp === clientStamp) {
                let itemId = message.status[1];
                let item = GameAPI.getItemById(itemId)
                if (!item) {
                    console.log("No client item found:", itemId, message )
                    return;
                }
            //    console.log("Item ", item, message.status);
                item.call.applyStatusMessage(message.status)
            } else {
                processRemoteStatus(stamp, message.status)
            }

            break;
        case ENUMS.ServerCommands.ITEM_REMOVED:
            console.log("ITEM_REMOVED; ", message);

            break;
        case ENUMS.ServerCommands.ENCOUNTER_TRIGGER:
        //    console.log("Trigger Encounter; ", message.encounterId, message.worldEncounterId, stamp, message);
            encounter = GameAPI.getWorldEncounterByEncounterId(message.worldEncounterId);
            if (!encounter) {
                console.log("Assume encounter already completed but started by other party member");

                let onReady = function(worldEnc) {
                    worldEnc.call.serverEncounterActivated(message);
                }

                GameAPI.worldModels.activateCompletedEncounter(message.worldEncounterId, onReady)
            } else {
                encounter.call.serverEncounterActivated(message);
            //    console.log("WE: ", encounter);
            }

            break;
        case ENUMS.ServerCommands.ENCOUNTER_START:
        //    console.log("Start Encounter; ", message.encounterId, message.worldEncounterId, stamp, message);
            encounter = GameAPI.getWorldEncounterByEncounterId(msg.worldEncounterId);
         //   console.log("Enc: ",encounter.triggered, encounter.started, encounter);

            if (encounter.triggered === false) {
                encounter.call.triggerWorldEncounter();
            } else if (encounter.started === false) {
                encounter.call.startWorldEncounter(message);
            } else {
                console.log("Once encounter is started there should be no more start messages for it", message)
            }
            break;
        case ENUMS.ServerCommands.ENCOUNTER_UPDATE:
            let encounterId = message.status[1];
            encounter = GameAPI.call.getDynamicEncounter();
            if (encounter.id === encounterId) {
                encounter.applyEncounterStatusUpdate(message.status);
            } else {

                if (message.status) {
                    if (message.status[ENUMS.EncounterStatus.ENCOUNTER_ID]) {
                        for (let key in message.status) {
                        //    console.log("Encounter key map", key, message.status[key])
                            encounter.setStatusKey(key, message.status[key])
                        }
                    }
                } else {
                    console.log("Bad Encounter ID; ", [message.status], message.status[0], message.status[1],encounterId, message.encounterId, encounter.id, [encounter]);
                }

            }

            break;
        case ENUMS.ServerCommands.ENCOUNTER_CLOSE:
            console.log("Close Encounter; ", message);
            break;
        case ENUMS.ServerCommands.STRONGHOLD_UPDATE:
            console.log("STRONGHOLD_UPDATE; ", message);
            let shId = message.status[ENUMS.StrongholdStatus.STRONGHOLD_ID];
            let sh = GameAPI.getGamePieceSystem().getStrongholdById(shId);
            sh.applyServerStatus(message.status);

            if (sh.worldModel === null) {
                sh.call.setupVisualSh()
            }

            break;
        case ENUMS.ServerCommands.FETCH_CONFIGS:
        //    console.log("FETCH_CONFIGS; ", message.folders, CONFIGS);

            let res = {
                request:ENUMS.ClientRequests.REGISTER_CONFIGS,
                data:{}
            }

            for (let i = 0; i < message.folders.length; i++) {
                let folder = message.folders[i];
                let folderData = CONFIGS[folder];
                res.data[folder] = folderData;
            }



            if (message.folders.length) {
                console.log("Send configs to server; ", res.data);
                evt.dispatch(ENUMS.Event.SEND_SOCKET_MESSAGE, res);
            }


            break;
        case ENUMS.ServerCommands.LOAD_FILE_DATA:
            console.log("LOAD_FILE_DATA:", message);
            if (message.id === "edit_index") {
                setEditIndexClient(message.data);
            } else {
                applyRemoteConfigMessage(message);
            }

            break;
        default:


        //       processStatusMessage(stamp, msg)

         console.log("Unhandled server Command; ", [stamp, msg]);
    }

}

function getRemoteClients() {
    return remoteClients;
}

export {
    processServerCommand,
    getRemoteClients
}