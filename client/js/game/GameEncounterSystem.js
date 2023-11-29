import { EncounterGrid } from "./encounter/EncounterGrid.js";
import { DynamicEncounter } from "./encounter/DynamicEncounter.js";
import {EncounterTurnSequencer} from "./encounter/EncounterTurnSequencer.js";
import {EncounterUiSystem} from "../application/ui/gui/systems/EncounterUiSystem.js";

let encounterUiSystem;
let encounterTurnSequencer = null;
let activeEncounterGrid = null;
let dynamicEncounter = null;

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

let getActiveDynamicEncounter = function() {
    return dynamicEncounter;
}

class GameEncounterSystem {
    constructor() {
        encounterUiSystem = new EncounterUiSystem();
        encounterTurnSequencer = new EncounterTurnSequencer();

        let updateEncounterSystem = function() {

            let selectedActor = GameAPI.getGamePieceSystem().getSelectedGameActor();
            let min = activeEncounterGrid.minXYZ;
            let max = activeEncounterGrid.maxXYZ;
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, {min:min, max:max, color:'GREEN'})

            let isWithin = testPosIsWithin(selectedActor.getSpatialPosition(), min, max);

            if (isWithin) {
                encounterTurnSequencer.updateTurnSequencer()
            } else {
                this.deactivateActiveEncounter()
            }

        }.bind(this);

        this.call = {
            updateEncounterSystem:updateEncounterSystem,
            getActiveEncounterGrid:getActiveEncounterGrid,
            getActiveDynamicEncounter:getActiveDynamicEncounter
        }

    }

    getEncounterTurnSequencer() {
        return encounterTurnSequencer;
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

        let updateEncounterSystem = this.call.updateEncounterSystem

            let gridReady = function(grid) {
                dynamicEncounter = new DynamicEncounter(event.encounterId);
                dynamicEncounter.setEncounterGrid(grid);
                dynamicEncounter.setStatusKey(ENUMS.EncounterStatus.WORLD_ENCOUNTER_ID, event.worldEncounterId);
                dynamicEncounter.setStatusKey(ENUMS.EncounterStatus.ACTIVATION_STATE, ENUMS.ActivationState.ACTIVATING);

                let onSpawnDone = function() {
                    let playerParty = GameAPI.getGamePieceSystem().getPlayerParty();
                    let partyActors = playerParty.getPartyActors();
                    for (let i = 0; i < partyActors.length; i++) {
                        let pActor = partyActors[i];
                        let startTile = encounterGrid.getTileAtPosition(pActor.getSpatialPosition());
                        pActor.setSpatialPosition(startTile.getPos());
                        encounterTurnSequencer.addEncounterActor(pActor);
                    }

                    encounterUiSystem.setEncounterSequencer(encounterTurnSequencer)
                    GameAPI.registerGameUpdateCallback(updateEncounterSystem)
                }


                    if (event.spawn) {
                        dynamicEncounter.processSpawnEvent(event.spawn, encounterTurnSequencer, onSpawnDone)
                    } else {
                        console.log("encounter event requires spawn data")
                    }

            }

            encounterGrid.initEncounterGrid(event['grid_id'], event.pos, gridReady )

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
        encounterUiSystem.closeEncounterUi()
        GameAPI.unregisterGameUpdateCallback(this.call.updateEncounterSystem)
        GameAPI.call.spawnWorldEncounters();
    }

}

export { GameEncounterSystem }