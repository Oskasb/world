import { EncounterGrid } from "./gamescenarios/EncounterGrid.js";
import {DynamicEncounter } from "./gamescenarios/DynamicEncounter.js";

let activeEncounterGrid = null;
let dynamicEncounter = null;

let gridLoaded = function(grid) {
    console.log("gridLoaded", grid)
    dynamicEncounter = new DynamicEncounter()
    dynamicEncounter.setEncounterGrid(grid);
    dynamicEncounter.addEncounterActors(8)
}

class GameEncounterSystem {
    constructor() {

    }

    activateEncounter(event) {

        if (dynamicEncounter) {
            dynamicEncounter.removeEncounterActors()
            dynamicEncounter = null;
        }

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

            encounterGrid.initEncounterGrid(event['grid_id'], pos, forward, gridLoaded)
            activeEncounterGrid = encounterGrid;
        }


    }

}

export { GameEncounterSystem }