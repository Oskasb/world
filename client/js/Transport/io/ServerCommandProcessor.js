import {evt} from "../../application/event/evt.js";
import {notifyCameraStatus} from "../../3d/camera/CameraFunctions.js";
import {
    applyStatusToMap, getClientStampFromStatusMessage,
    getStatusFromMsg,
    statusMapFromMsg
} from "../../../../Server/game/utils/GameServerFunctions.js";
import {ENUMS} from "../../application/ENUMS.js";
import {RemoteClient} from "./RemoteClient.js";

let remoteClients = {}

function processActorInit(stamp, msg) {
    let status = msg.status;
    let initLocalPlayerControlledActor = function(playerActor) {
        console.log("initLocalPlayerControlledActor; ", stamp, msg);
        setTimeout(function() {
            GameAPI.getGamePieceSystem().addActorToPlayerParty(playerActor);
            GameAPI.getGamePieceSystem().playerParty.selectPartyActor(playerActor);
            playerActor.call.activateActionKey("ACTION_TRAVEL_WALK", ENUMS.ActorStatus.TRAVEL)
            playerActor.setStatusKey(ENUMS.ActorStatus.TRAVEL_MODE, ENUMS.TravelMode.TRAVEL_MODE_WALK)
            playerActor.setStatusKey(ENUMS.ActorStatus.PARTY_SELECTED, true)
            notifyCameraStatus(ENUMS.CameraStatus.CAMERA_MODE, ENUMS.CameraControls.CAM_MOVE, true)
            notifyCameraStatus(ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_AHEAD, true)
            notifyCameraStatus(ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_PARTY, true)
            notifyCameraStatus(ENUMS.CameraStatus.POINTER_ACTION, ENUMS.CameraControls.CAM_MOVE, null)
            playerActor.setStatusKey(ENUMS.ActorStatus.ACTIVATION_STATE, ENUMS.ActivationState.ACTIVATING)
            GameAPI.getGamePieceSystem().grabLooseItems(playerActor);
        }, 500)

    }

    let actorLoaded = function(actor) {
        console.log("actorLoaded; ", stamp, msg);
        for (let key in status) {
            actor.setStatusKey(key, status[key]);
        }

        actor.id = actor.getStatus(ENUMS.ActorStatus.ACTOR_ID)

        let onActivated = function(actor) {
            if (actor.getStatus(ENUMS.ActorStatus.ACTOR_ID) === GameAPI.getGamePieceSystem().playerActorId) {
                initLocalPlayerControlledActor(actor);
            } else {
                console.log("Remotely operated actor activated", actor);
            }
        }

        actor.activateGameActor(onActivated);
    }

    let configId = status[ENUMS.ActorStatus.CONFIG_ID];
    console.log("ACTOR_INIT; ", configId, stamp, msg);
    evt.dispatch(ENUMS.Event.LOAD_ACTOR,  {id: configId, callback:actorLoaded})


}

function processItemInit(stamp, msg) {
    let status = msg.status;

    let itemLoaded = function(item) {

        for (let key in status) {
            item.setStatusKey(key, status[key]);
        }

        let equippedToActorId = item.getStatus(ENUMS.ItemStatus.ACTOR_ID);
        let actor = GameAPI.getActorById(equippedToActorId);

        if (actor) {
            actor.equipItem(item)
        } else {
            GameAPI.getGamePieceSystem().addLooseItem(item);

        }


    }

    let templateId = status[ENUMS.ItemStatus.TEMPLATE];
    console.log("ITEM_INIT: ", templateId, stamp, msg);
    evt.dispatch(ENUMS.Event.LOAD_ITEM,  {id: templateId, callback:itemLoaded})

}


function processServerCommand(protocolKey, message) {

    let stamp = message.stamp;
    let msg = message;
    let encounter;

    if (!msg.command) {
        console.log("processServerCommand requires msg.command")
        return;
    }

    if (typeof(msg.request) === 'number') {
    //    console.log(ENUMS.getKey('ServerCommands', msg.command) +" is response to request ", ENUMS.getKey('ClientRequests', msg.request))
    }  else {
        console.log("Non Request: ", ENUMS.getKey('Protocol', protocolKey), ENUMS.getKey('ServerCommands', msg.command), msg);
    }

    switch (msg.command) {

        case ENUMS.ServerCommands.PLAYER_CONNECTED:
            console.log("Player Connected; ", stamp, msg);

            if (stamp === client.getStamp()) {

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

            if (stamp === client.getStamp()) {
                processActorInit(stamp, msg);
            } else {
                // use remote client here...
                let remoteClient = remoteClients[stamp];
                if (remoteClient) {
                } else {
                    console.log("ACTOR_INIT Remote client missing for stamp; ", stamp, msg, remoteClients);
                    remoteClient = new RemoteClient(stamp);
                    remoteClients[stamp] = remoteClient
                }

                console.log("REMOTE ACTOR_INIT; ", stamp, [msg.status]);

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
            stamp = getClientStampFromStatusMessage(msg.status)

            if (!stamp) {
                console.log("No client stamp found for message: ", msg)
                return;
            }

            if (stamp === client.getStamp()) {
                // own client already has the command status, use response to possibly validate
            } else {
                // use remote client here...
                let remoteClient = remoteClients[stamp];
                if (remoteClient) {
                //    console.log("REMOTE ACTOR_UPDATE; ", stamp, [msg.status]);
                    remoteClient.processClientMessage(msg.status);
                } else {
                    console.log("ACTOR_UPDATE Remote client missing for stamp; ", stamp, remoteClients);
                    remoteClients[stamp] = new RemoteClient(stamp);
                    remoteClients[stamp].processClientMessage(msg.status);
                //    let statusMap = statusMapFromMsg(msg.status);
                //    applyStatusToMap(statusMap, actor.getStatus());
                }

            }

            break;
        case ENUMS.ServerCommands.ACTOR_REMOVED:
            console.log("ACTOR_REMOVED; ", stamp, msg);

            break;
        case ENUMS.ServerCommands.ITEM_INIT:
            processItemInit(stamp, msg);
            break;
        case ENUMS.ServerCommands.ITEM_UPDATE:
            console.log("ITEM_UPDATE; ", stamp, msg);

            break;
        case ENUMS.ServerCommands.ITEM_REMOVED:
            console.log("ITEM_REMOVED; ", stamp, msg);

            break;
        case ENUMS.ServerCommands.ENCOUNTER_TRIGGER:
            console.log("Trigger Encounter; ", msg.encounterId, msg.worldEncounterId, stamp, msg);
            encounter = GameAPI.getWorldEncounterByEncounterId(msg.worldEncounterId);
            encounter.call.triggerWorldEncounter();
            console.log("WE: ", encounter);
            break;
        case ENUMS.ServerCommands.ENCOUNTER_START:
            console.log("Start Encounter; ", msg.encounterId, msg.worldEncounterId, stamp, msg);
            encounter = GameAPI.getWorldEncounterByEncounterId(msg.worldEncounterId);
            encounter.call.startWorldEncounter();
            break;
        case ENUMS.ServerCommands.ENCOUNTER_CLOSE:
            console.log("Close Encounter; ", msg.encounterId, msg.worldEncounterId, stamp, msg);
            break;
        default:


        //       processStatusMessage(stamp, msg)

         console.log("Unhandled server Command; ", [stamp, msg]);
    }

}


export {
    processServerCommand
}