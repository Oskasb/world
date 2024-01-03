import {
    dispatchMessage,
    registerGameServerUpdateCallback,
    unregisterGameServerUpdateCallback
} from "../utils/GameServerFunctions.js";
import {ENUMS} from "../../../client/js/application/ENUMS.js";
import {EncounterStatus} from "../../../client/js/game/encounter/EncounterStatus.js";


function processActivationState(encounter) {

    if (encounter.getStatus(ENUMS.EncounterStatus.ACTIVATION_STATE) === ENUMS.ActivationState.INIT) {
        if (encounter.encounterTime > 2) {
            encounter.setStatusKey(ENUMS.EncounterStatus.ACTIVATION_STATE, ENUMS.ActivationState.ACTIVATING);
            let msg = {
                stamp : encounter.hostStamp,
                msg:{
                    command:ENUMS.ServerCommands.ENCOUNTER_START,
                    encounterId:encounter.getStatus(ENUMS.EncounterStatus.ENCOUNTER_ID),
                    worldEncounterId: encounter.getStatus(ENUMS.EncounterStatus.WORLD_ENCOUNTER_ID),
                }
            }
            dispatchMessage(msg);
        }
    } else {
        console.log("ProcessEncActivationState")
    }
}

class ServerEncounter {
    constructor(message, closeEncounterCB) {

        console.log("New ServerEncounter", message);

        this.spawn = message.spawn;
        this.id = message.encounterId;
        this.status = new EncounterStatus(message.encounterId, message.worldEncounterId);
        this.setStatusKey(ENUMS.EncounterStatus.GRID_ID, message.grid_id)
        this.setStatusKey(ENUMS.EncounterStatus.GRID_POS, message.pos)
        this.encounterTime = 0;
        this.hostStamp = message.stamp;
        this.onCloseCallbacks = [closeEncounterCB];

        let msg = {
            stamp : this.hostStamp,
            command:ENUMS.ServerCommands.ENCOUNTER_TRIGGER,
            encounterId:message.encounterId,
            worldEncounterId: message.worldEncounterId
        }

        dispatchMessage(msg);

        let updateServerEncounter = function(tpf) {
            this.encounterTime+=tpf;
            processActivationState(this)
        }.bind(this);

        this.call = {
            updateServerEncounter:updateServerEncounter
        }

        registerGameServerUpdateCallback(this.call.updateServerEncounter);
    }

    getStatus(key) {
        return this.status.call.getStatus(key)
    }

    setStatusKey(key, status) {
        this.status.call.setStatus(key, status);
    }

    applyPlayerPlayMessage(message) {
        console.log("applyPlayerPlayMessage", message);
    }

    handleHostActorRemoved() {
        this.closeServerEncounter();
    }

    closeServerEncounter() {
        while (this.onCloseCallbacks.length) {
            this.onCloseCallbacks.pop()(this.hostStamp);
        }
        unregisterGameServerUpdateCallback(this.call.updateServerEncounter)
    }


}

export {ServerEncounter}