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

let testPosIsWithin = function(pos, min, max) {
    if (min.x <= pos.x && max.x >= pos.x) {
        if (min.z <= pos.z && max.z >= pos.z) {
            return true;
        }
    }
    return false;
}

let getActiveEncounterGrid = function() {
    return activeEncounterGrid;
}

class GameEncounterSystem {
    constructor() {


        let updateEncounterSystem = function() {

            let selectedActor = GameAPI.getGamePieceSystem().getSelectedGameActor();

            let min = activeEncounterGrid.minXYZ;
            let max = activeEncounterGrid.maxXYZ;
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, {min:min, max:max, color:'GREEN'})

            let isWithin = testPosIsWithin(selectedActor.getPos(), min, max);

            if (isWithin) {

            } else {
                this.deactivateActiveEncounter()
            }


        }.bind(this);

        this.call = {
            updateEncounterSystem:updateEncounterSystem,
            getActiveEncounterGrid:getActiveEncounterGrid
        }

    }

    activateEncounter(event) {

        console.log("activateEncounter", event)

        if (activeEncounterGrid) {
            this.deactivateActiveEncounter()
            return;
        }

        let encounterGrid = new EncounterGrid();
        activeEncounterGrid = encounterGrid;

        if (event.pos) {

            let gridReady = function(grid) {
                dynamicEncounter = new DynamicEncounter()
                dynamicEncounter.setEncounterGrid(grid);

                    if (event.spawn) {
                        dynamicEncounter.processSpawnEvent(event.spawn)
                    } else {
                        dynamicEncounter.addEncounterActors(8)
                    }

            }

            encounterGrid.initEncounterGrid(event['grid_id'], event.pos, gridReady )

        } else {
            let selectedActor = GameAPI.getGamePieceSystem().getSelectedGameActor();
            let pos = ThreeAPI.getCameraCursor().getPos();
            let forward = ThreeAPI.getCameraCursor().getForward();
            if (selectedActor) {
                pos = selectedActor.getPos();
                forward = selectedActor.getForward();
            }

            encounterGrid.initEncounterGrid(event['grid_id'], pos,gridLoaded , forward)

        }

        GameAPI.registerGameUpdateCallback(this.call.updateEncounterSystem)

    }

    deactivateActiveEncounter() {
        if (dynamicEncounter) {
            dynamicEncounter.removeEncounterActors()
            dynamicEncounter = null;
        }

        if (activeEncounterGrid) {
            activeEncounterGrid.removeEncounterGrid()
            activeEncounterGrid = null;
        }
        GameAPI.unregisterGameUpdateCallback(this.call.updateEncounterSystem)
        GameAPI.call.spawnWorldEncounters();
    }



}

export { GameEncounterSystem }