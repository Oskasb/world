import {MATH} from "../../../client/js/application/MATH.js";
import {ENUMS} from "../../../client/js/application/ENUMS.js";

function handlePartyHandshakeOk(serverEncounter) {
    let message = {
        stamp:serverEncounter.hostStamp,
        request:ENUMS.ClientRequests.ENCOUNTER_PLAY,
        command:ENUMS.ServerCommands.ENCOUNTER_START,
        encounterId:serverEncounter.id,
        worldEncounterId:serverEncounter.getStatus(ENUMS.EncounterStatus.WORLD_ENCOUNTER_ID)
    }
  //  console.log("Handshake OK ", message);
    serverEncounter.call.messageParticipants(message);
}

function handlePartyDynamicEncountersLoaded(serverEncounter) {
    serverEncounter.serverGrid.buildGridFromReportedTiles(serverEncounter.reportedTiles);
    serverEncounter.spawnServerEncounterActors();
    serverEncounter.enrollEncounterCombatants();
    let message = {
        stamp:serverEncounter.hostStamp,
        request:ENUMS.ClientRequests.ENCOUNTER_PLAY,
        command:ENUMS.ServerCommands.ENCOUNTER_UPDATE,
        encounterId:serverEncounter.id,
        status:serverEncounter.getStatus()
    }
    console.log("handlePartyDynamicEncountersLoaded", message);
    serverEncounter.setStatusKey(ENUMS.EncounterStatus.ACTIVATION_STATE, ENUMS.ActivationState.ACTIVE)
    serverEncounter.call.messageParticipants(message);
}

function handleQueueMessage(message, serverEncounter) {
    if (serverEncounter.memberResponseQueue.length !== 0) {
        let queue = serverEncounter.memberResponseQueue;
        let actorId = message.actorId;
        if (queue.indexOf(actorId) !== -1) {
        //    console.log("Process encounter queue", message);
            MATH.splice(queue, actorId);
            if (message.tiles) {
                serverEncounter.clientTilesReported(message.tiles)
            }

            if(queue.length === 0) {
                if (serverEncounter.getStatus(ENUMS.EncounterStatus.ACTIVATION_STATE) === ENUMS.ActivationState.INIT) {
                    handlePartyHandshakeOk(serverEncounter);
                } else if (serverEncounter.getStatus(ENUMS.EncounterStatus.ACTIVATION_STATE) === ENUMS.ActivationState.ACTIVATING) {
                    handlePartyDynamicEncountersLoaded(serverEncounter);
                }
            }
        } else {
            console.log("While handshaking expecting only one play message per party member")
        }
    }
}

function handlePlayMessage(message, serverEncounter) {
    if (serverEncounter.memberResponseQueue.length !== 0) {
        handleQueueMessage(message, serverEncounter);
        return;
    }
    console.log("Non-queued player message: ", message)
}

export {
    handlePlayMessage
}