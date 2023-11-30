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

function initEncounter(id, worldEncId) {
    dynamicEncounter = new DynamicEncounter(id, worldEncId);
    dynamicEncounter.setStatusKey(ENUMS.EncounterStatus.ACTIVATION_STATE, ENUMS.ActivationState.ACTIVATING);
}

function activateGrid(gridId, updateCB) {

}


class GameEncounterSystem {
    constructor() {
        encounterUiSystem = new EncounterUiSystem();
        encounterTurnSequencer = new EncounterTurnSequencer();

        let updateEncounterSystem = function() {

            let selectedActor = GameAPI.getGamePieceSystem().getSelectedGameActor();
            let min = activeEncounterGrid.minXYZ;
            let max = activeEncounterGrid.maxXYZ;
        //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, {min:min, max:max, color:'GREEN'})

            let isWithin = testPosIsWithin(selectedActor.getSpatialPosition(), min, max);

            if (isWithin) {
                encounterTurnSequencer.updateTurnSequencer()
            } else {
                selectedActor.setStatusKey(ENUMS.ActorStatus.HAS_TURN, false);
                selectedActor.setStatusKey(ENUMS.ActorStatus.SELECTED_TARGET, '');
                selectedActor.setStatusKey(ENUMS.ActorStatus.SEQUENCER_SELECTED, false);
                selectedActor.setStatusKey(ENUMS.ActorStatus.ACTIVATING_ENCOUNTER, '');
                selectedActor.setStatusKey(ENUMS.ActorStatus.ACTIVATED_ENCOUNTER, '');
                selectedActor.setStatusKey(ENUMS.ActorStatus.SELECTED_ENCOUNTER, '');
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
        if (event.encounterId !== null) {
            if (!dynamicEncounter) {
                console.log("INIT DYN ENC, ", event.worldEncounterId);
                initEncounter(event.encounterId, event.worldEncounterId)
                activeEncounterGrid = new EncounterGrid();
            }
            if (dynamicEncounter.id !== event.encounterId) {
                console.log("Wrong Encounter ID")
                return;
            }
        }

        let updateCB = this.call.updateEncounterSystem

        let onSpawnDone = function() {
            let playerParty = GameAPI.getGamePieceSystem().getPlayerParty();
            let partyActors = playerParty.getPartyActors();
            for (let i = 0; i < partyActors.length; i++) {
                let pActor = partyActors[i];
                let startTile = activeEncounterGrid.getTileAtPosition(pActor.getSpatialPosition());
                pActor.setSpatialPosition(startTile.getPos());
                encounterTurnSequencer.addEncounterActor(pActor);
            }

            encounterUiSystem.setEncounterSequencer(encounterTurnSequencer)
            GameAPI.registerGameUpdateCallback(updateCB)
            dynamicEncounter.setStatusKey(ENUMS.EncounterStatus.ACTIVATION_STATE, ENUMS.ActivationState.ACTIVE);
        }

        let gridReady = function(grid) {

            GuiAPI.getWorldInteractionUi().closeWorldInteractUi();
            GameAPI.worldModels.deactivateEncounters();
            dynamicEncounter.setEncounterGrid(grid);

            if (event.spawn) {
                dynamicEncounter.processSpawnEvent(event.spawn, encounterTurnSequencer, onSpawnDone)
            } else {
                console.log("encounter event requires spawn data")
            }
        }

        if (event.grid_id) {
            activeEncounterGrid.initEncounterGrid(event['grid_id'], event.pos, gridReady )
        }
    }

    deactivateActiveEncounter() {
        if (dynamicEncounter) {

        //    let statusActors = dynamicEncounter.getStatus(ENUMS.EncounterStatus.ENCOUNTER_ACTORS);
        //    MATH.emptyArray(statusActors);
        //    dynamicEncounter.setStatusKEy(ENUMS.EncounterStatus.ENCOUNTER_ACTORS, statusActors);
            dynamicEncounter.setStatusKey(ENUMS.EncounterStatus.ACTIVATION_STATE, ENUMS.ActivationState.DEACTIVATING);
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