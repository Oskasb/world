import { EncounterGrid } from "./gamescenarios/EncounterGrid.js";

let activeEncounterGrid = null;


class GameEncounterSystem {
    constructor() {

    }

    activateEncounter(event) {
        if (activeEncounterGrid) {
            activeEncounterGrid.removeEncounterGrid()
            activeEncounterGrid = null;
        } else {
            let encounterGrid = new EncounterGrid();
            let selectedActor = GameAPI.getGamePieceSystem().getSelectedGameActor();
            let pos = ThreeAPI.getCameraCursor().getPos();
            let forward = ThreeAPI.getCameraCursor().getForward();
            if (selectedActor) {
                pos = selectedActor.getPos();
                forward = selectedActor.getForward();
            }

            encounterGrid.initEncounterGrid(event['grid_id'], pos, forward)
            activeEncounterGrid = encounterGrid;
        }


    }

}

export { GameEncounterSystem }