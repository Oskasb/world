import {evt} from "../../application/event/evt.js";
import {notifyCameraStatus} from "../../3d/camera/CameraFunctions.js";

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
    let msg = JSON.parse(message.msg);
    let encounter;

    console.log("processServerCommand", ENUMS.getKey('Protocol', protocolKey), ENUMS.getKey('ServerCommands', msg.command), msg);

    switch (msg.command) {
        case ENUMS.ServerCommands.PLAYER_CONNECTED:
            console.log("Player Connected; ", stamp, msg);

            break;
        case ENUMS.ServerCommands.PLAYER_UPDATE:
            console.log("Player Update; ", stamp, msg);

            break;
        case ENUMS.ServerCommands.PLAYER_DISCONNECTED:
            console.log("Player Disconnected; ", stamp, msg);

            break;
        case ENUMS.ServerCommands.ACTOR_INIT:
            processActorInit(stamp, msg);
            break;
        case ENUMS.ServerCommands.ACTOR_UPDATE:
            console.log("ACTOR_UPDATE; ", stamp, msg);

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
            console.log("Unhandled server Command; ", [stamp, msg]);
    }

}


export {
    processServerCommand
}