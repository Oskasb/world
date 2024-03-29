import {EncounterStatus} from "./EncounterStatus.js";
import {applyStatusMessageToMap} from "../../../../Server/game/utils/GameServerFunctions.js";
import {debugTrackStatusMap} from "../../application/utils/DebugUtils.js";

let encounterActors = []
let faces = ['face_1', 'face_2', 'face_3', 'face_5', 'face_6', 'face_7', 'face_8']
let loads = 0;

let trackStatusKeys = [
    ENUMS.EncounterStatus.CLIENT_STAMP
];

class DynamicEncounter {
    constructor(id, worldEncId) {
    //    console.log("New Dyn Enc ", id, worldEncId);
        this.id = id;
        this.status = new EncounterStatus(id, worldEncId)
        this.status.setStatusKey(ENUMS.EncounterStatus.ACTIVATION_STATE, ENUMS.ActivationState.ACTIVATING)
        this.isRemote = false;
        this.page = GuiAPI.activatePage('page_encounter_info');
    }

    setStatusKey(key, status) {
        let write = this.status.setStatusKey(key, status);
        return write
    }

    getStatus(key) {
        return this.status.getStatusByKey(key);
    }


    applyEncounterStatusUpdate(statusMsg) {
        applyStatusMessageToMap(statusMsg, this.status.statusMap);
        debugTrackStatusMap('ENCOUNTER_STATUS', this.status.statusMap)
    }

    setEncounterGrid(encounterGrid) {
        this.encounterGrid = encounterGrid;
    }

    closeDynamicEncounter() {
        this.page.closeGuiPage();
    }

}

export { DynamicEncounter }