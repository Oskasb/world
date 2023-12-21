import {
    dispatchMessage,
    registerGameServerUpdateCallback,
    unregisterGameServerUpdateCallback
} from "../utils/GameServerUtils.js";
import {ENUMS} from "../../../client/js/application/ENUMS.js";
import {EncounterStatus} from "../../../client/js/game/encounter/EncounterStatus.js";

class ServerEncounter {
    constructor(msgEvent) {

        console.log("New ServerEncounter", msgEvent);

        this.status = new EncounterStatus(msgEvent.msg.encounterId, msgEvent.msg.worldEncounterId);
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
        registerGameServerUpdateCallback(this.updateServerEncounter);
    }

    updateServerEncounter(tpf, time) {
        this.encounterTime+=tpf;
    }


    closeServerEncounter() {
        unregisterGameServerUpdateCallback(this.updateServerEncounter)
    }


}

export {ServerEncounter}