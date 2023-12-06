import { EncounterGrid } from "./encounter/EncounterGrid.js";
import { DynamicEncounter } from "./encounter/DynamicEncounter.js";
import {EncounterTurnSequencer} from "./encounter/EncounterTurnSequencer.js";
import {EncounterUiSystem} from "../application/ui/gui/systems/EncounterUiSystem.js";
import {EncounterStatusProcessor} from "./encounter/EncounterStatusProcessor.js";
import {notifyCameraStatus} from "../3d/camera/CameraFunctions.js";

let encounterUiSystem;
let encounterTurnSequencer = null;
let activeEncounterGrid = null;
let dynamicEncounter = null;
let encounterStatusProcessor = new EncounterStatusProcessor();

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
    dynamicEncounter.setStatusKey(ENUMS.EncounterStatus.ACTIVATION_STATE, ENUMS.ActivationState.INIT);
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
        // Hosting Client Handles this stuff, remote goes other path

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
                    if (!pActor.call.getRemote()) {
                        let startTile = activeEncounterGrid.getTileAtPosition(pActor.getSpatialPosition());
                        pActor.setSpatialPosition(startTile.getPos());
                    }
                    encounterTurnSequencer.addEncounterActor(pActor);
                    pActor.rollInitiative()
                }

                // encounterUiSystem.setEncounterSequencer(encounterTurnSequencer)
                encounterUiSystem.setActiveEncounter(dynamicEncounter);
                GameAPI.registerGameUpdateCallback(updateCB)
                GameAPI.registerGameUpdateCallback(encounterStatusProcessor.processEncounterStatus)
                encounterStatusProcessor.call.setEncounter(dynamicEncounter);
                dynamicEncounter.setStatusKey(ENUMS.EncounterStatus.ACTIVATION_STATE, ENUMS.ActivationState.ACTIVE);

        }

        let gridReady = function(grid) {

            GuiAPI.getWorldInteractionUi().closeWorldInteractUi();
            GameAPI.worldModels.deactivateEncounters();
            dynamicEncounter.setEncounterGrid(grid);
            let posArray = dynamicEncounter.status.call.getStatus(ENUMS.EncounterStatus.GRID_POS);
            MATH.vec3ToArray(activeEncounterGrid.center, posArray)
            dynamicEncounter.status.call.setStatus(ENUMS.EncounterStatus.GRID_POS , posArray);
            console.log("SET POS:", posArray);
            dynamicEncounter.status.call.setStatus(ENUMS.EncounterStatus.GRID_ID , event['grid_id']);
            console.log("SET GRID ID:", event['grid_id']);
            dynamicEncounter.status.call.setStatus(ENUMS.EncounterStatus.ACTIVATION_STATE , ENUMS.ActivationState.ACTIVATING);
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

    activateByRemote(encounter) {
        dynamicEncounter = encounter;
        GameAPI.registerGameUpdateCallback(encounterStatusProcessor.processEncounterStatus)
        encounterStatusProcessor.call.setEncounter(dynamicEncounter);
        encounterUiSystem.setActiveEncounter(dynamicEncounter);

        activeEncounterGrid = new EncounterGrid();
        let gridId = dynamicEncounter.status.call.getStatus(ENUMS.EncounterStatus.GRID_ID);
        let pos = MATH.vec3FromArray(activeEncounterGrid.center, dynamicEncounter.status.call.getStatus(ENUMS.EncounterStatus.GRID_POS));

        console.log("GET POS:", pos);
        console.log("GET GRID ID:", gridId);

        let gridReady = function(grid) {
            GameAPI.getGamePieceSystem().selectedActor.setStatusKey(ENUMS.ActorStatus.TRAVEL_MODE, ENUMS.TravelMode.TRAVEL_MODE_BATTLE);
            notifyCameraStatus(ENUMS.CameraStatus.CAMERA_MODE, ENUMS.CameraControls.CAM_AUTO, false);
            GuiAPI.getWorldInteractionUi().closeWorldInteractUi();
            GameAPI.worldModels.deactivateEncounters();
            dynamicEncounter.setEncounterGrid(grid);
        }

        activeEncounterGrid.initEncounterGrid(gridId, pos, gridReady )

        console.log("Activate Enc from Remote", dynamicEncounter)
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
        GameAPI.unregisterGameUpdateCallback(encounterStatusProcessor.processEncounterStatus)
        GameAPI.call.spawnWorldEncounters();
    }

}

export { GameEncounterSystem }