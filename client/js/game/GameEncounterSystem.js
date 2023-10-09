import { EncounterGrid } from "./encounter/EncounterGrid.js";
import { DynamicEncounter } from "./encounter/DynamicEncounter.js";
import {EncounterTurnSequencer} from "./encounter/EncounterTurnSequencer.js";

let encounterTurnSequencer = null;
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

        encounterTurnSequencer = new EncounterTurnSequencer();
        let updateEncounterSystem = function() {

            let selectedActor = GameAPI.getGamePieceSystem().getSelectedGameActor();

            let min = activeEncounterGrid.minXYZ;
            let max = activeEncounterGrid.maxXYZ;
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, {min:min, max:max, color:'GREEN'})

            let isWithin = testPosIsWithin(selectedActor.getPos(), min, max);

            if (isWithin) {
                encounterTurnSequencer.updateTurnSequencer()
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
        encounterGrid.setCameraHomePos(event.cam_pos)

            let gridReady = function(grid) {
                dynamicEncounter = new DynamicEncounter()
                dynamicEncounter.setEncounterGrid(grid);

                    if (event.spawn) {
                        dynamicEncounter.processSpawnEvent(event.spawn)
                    } else {
                        console.log("encounter event requires spawn data")
                    }

                    let actors = dynamicEncounter.getEncounterActors();
                    for (let i = 0; i < actors.length; i++) {
                        encounterTurnSequencer.addEncounterActor(actors[i]);
                    }
                //let selectedActor = GameAPI.getGamePieceSystem().getSelectedGameActor();
                encounterTurnSequencer.addEncounterActor(GameAPI.getGamePieceSystem().getSelectedGameActor());
            }

            encounterGrid.initEncounterGrid(event['grid_id'], event.pos, gridReady )



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

        encounterTurnSequencer.closeTurnSequencer();

        GameAPI.unregisterGameUpdateCallback(this.call.updateEncounterSystem)
        GameAPI.call.spawnWorldEncounters();
    }



}

export { GameEncounterSystem }