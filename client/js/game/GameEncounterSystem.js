import { EncounterGrid } from "./gamescenarios/EncounterGrid.js";

class GameEncounterSystem {
    constructor() {

    }

    activateEncounter(event) {
        let encounterGrid = new EncounterGrid();
        encounterGrid.initEncounterGrid(event['grid_id'])
    }

}

export { GameEncounterSystem }