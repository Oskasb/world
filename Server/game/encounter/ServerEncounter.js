import {
    dispatchMessage,
    registerGameServerUpdateCallback,
    unregisterGameServerUpdateCallback
} from "../utils/GameServerUtils.js";
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
    constructor(msgEvent) {

        console.log("New ServerEncounter", msgEvent);

        this.spawn = msgEvent.msg.spawn;

        this.status = new EncounterStatus(msgEvent.msg.encounterId, msgEvent.msg.worldEncounterId);
        this.setStatusKey(ENUMS.EncounterStatus.GRID_ID, msgEvent.msg.grid_id)
        this.setStatusKey(ENUMS.EncounterStatus.GRID_POS, msgEvent.msg.pos)
        this.encounterTime = 0;
        this.hostStamp = msgEvent.stamp;
        let msg = {
            stamp : this.hostStamp,
            msg:{
                command:ENUMS.ServerCommands.ENCOUNTER_TRIGGER,
                encounterId:msgEvent.msg.encounterId,
                worldEncounterId: msgEvent.msg.worldEncounterId
            }
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


    closeServerEncounter() {
        unregisterGameServerUpdateCallback(this.call.updateServerEncounter)
    }


}

export {ServerEncounter}