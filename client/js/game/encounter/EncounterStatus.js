
import {ENUMS} from "../../application/ENUMS.js";

class EncounterStatus {
    constructor(id, worldEncId) {
        this.statusMap = {}
        this.statusMap[ENUMS.EncounterStatus.ENCOUNTER_ID] = id;
        this.statusMap[ENUMS.EncounterStatus.GRID_ID] = "";
        this.statusMap[ENUMS.EncounterStatus.GRID_POS] = [0, 0, 0];
        this.statusMap[ENUMS.EncounterStatus.WORLD_ENCOUNTER_ID] = worldEncId;
        this.statusMap[ENUMS.EncounterStatus.ENCOUNTER_ACTORS] = [];
        this.statusMap[ENUMS.EncounterStatus.HAS_TURN_ACTOR] = "";
        this.statusMap[ENUMS.EncounterStatus.TURN_INDEX] = 0;
        this.statusMap[ENUMS.EncounterStatus.PLAYER_VICTORY] = false;
        this.statusMap[ENUMS.EncounterStatus.ACTIVATION_STATE] = ENUMS.ActivationState.INIT;


        let getStatus = function(key) {
            return this.getStatusByKey(key);
        }.bind(this)

        let setStatus = function(key, status) {
            return this.setStatusKey(key, status);
        }.bind(this)

        this.call = {
            getStatus:getStatus,
            setStatus:setStatus
        }

    }

    getStatusByKey(key) {
        if (!key) {
            return this.statusMap;
        }
        if (typeof (this.statusMap[key]) === 'undefined') {
            this.statusMap[key] = 0;
        }
        return this.statusMap[key]
    }

    setStatusKey(key, status) {
        if (typeof (this.statusMap[key]) === typeof (status)) {

            if (status === ENUMS.TurnState.TURN_INIT) {
                console.log("Set TURN_INIT")
            }

            this.statusMap[key] = status;
        } else {
            if (typeof (this.statusMap[key]) === 'undefined' || this.statusMap[key] === 0) {

                this.statusMap[key] = status;
            } else {
                console.log("changing type for status is bad", key, this.statusMap[key], status)
            }
        }
    }

}

export { EncounterStatus }