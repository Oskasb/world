import { EncounterGrid } from "./encounter/EncounterGrid.js";
import { DynamicEncounter } from "./encounter/DynamicEncounter.js";
import {EncounterTurnSequencer} from "./encounter/EncounterTurnSequencer.js";
import {EncounterUiSystem} from "../application/ui/gui/systems/EncounterUiSystem.js";
import {EncounterStatusProcessor} from "./encounter/EncounterStatusProcessor.js";
import {notifyCameraStatus} from "../3d/camera/CameraFunctions.js";
import {clearActorEncounterStatus} from "../application/utils/StatusUtils.js";

let encounterUiSystem;
let encounterTurnSequencer = null;
let activeEncounterGrid = null;
let dynamicEncounter = null;
let encounterStatusProcessor = new EncounterStatusProcessor();
let encounterIsClosing = false;


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
    encounterIsClosing = false;
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
                console.log("Is outside enc...")
                selectedActor.setStatusKey(ENUMS.ActorStatus.DEACTIVATING_ENCOUNTER, selectedActor.getStatus(ENUMS.ActorStatus.ACTIVATED_ENCOUNTER));
                clearActorEncounterStatus(selectedActor);
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

        GuiAPI.screenText("ENCOUNTER",  ENUMS.Message.HINT, 1.5)

        if (event.encounterId) {
            if (!dynamicEncounter) {
            //    console.log("INIT DYN ENC:", event);
                initEncounter(event.encounterId, event.worldEncounterId)
                activeEncounterGrid = new EncounterGrid();
            }
            if (dynamicEncounter.id !== event.encounterId) {
                console.log("Wrong Encounter ID")
                return;
            } else {
            //    console.log("Dynamic Encounter Matches message data")
            }
        } else {
            console.log("Encounter Id expected from server", event);
            return;
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
                }

                // encounterUiSystem.setEncounterSequencer(encounterTurnSequencer)
            //    dynamicEncounter.setStatusKey(ENUMS.EncounterStatus.ACTIVATION_STATE, ENUMS.ActivationState.ACTIVATING);
            //    dynamicEncounter.setStatusKey(ENUMS.EncounterStatus.CLIENT_STAMP, client.getStamp());

        }

        let gridReady = function(grid) {

            encounterUiSystem.setActiveEncounter(dynamicEncounter);
            GameAPI.registerGameUpdateCallback(updateCB)
            GameAPI.registerGameUpdateCallback(encounterStatusProcessor.processEncounterStatus)
            encounterStatusProcessor.call.setEncounter(dynamicEncounter);

            dynamicEncounter.setEncounterGrid(grid);
            let posArray = dynamicEncounter.status.call.getStatus(ENUMS.EncounterStatus.GRID_POS);
            MATH.vec3ToArray(activeEncounterGrid.center, posArray)
            dynamicEncounter.status.call.setStatus(ENUMS.EncounterStatus.GRID_POS , posArray);
            dynamicEncounter.status.call.setStatus(ENUMS.EncounterStatus.GRID_ID , event['grid_id']);
            dynamicEncounter.status.call.setStatus(ENUMS.EncounterStatus.ACTIVATION_STATE , ENUMS.ActivationState.ACTIVATING);

            evt.dispatch(ENUMS.Event.SEND_SOCKET_MESSAGE, {
                request:ENUMS.ClientRequests.ENCOUNTER_PLAY,
                status:dynamicEncounter.getStatus(),
                tiles:grid.buildGridDataForMessage(),
                encounterId:event.encounterId,
                actorId:GameAPI.getGamePieceSystem().selectedActor.getStatus(ENUMS.ActorStatus.ACTOR_ID)
            })

        }

        if (event.grid_id) {
            activeEncounterGrid.initEncounterGrid(event['grid_id'], event.pos, gridReady )
        }
    }

    activateByRemote(encounter) {
        encounterIsClosing = false;
        dynamicEncounter = encounter;
        GameAPI.registerGameUpdateCallback(encounterStatusProcessor.processEncounterStatus)
        encounterStatusProcessor.call.setEncounter(dynamicEncounter);
        encounterUiSystem.setActiveEncounter(dynamicEncounter);

        activeEncounterGrid = new EncounterGrid();
        let gridId = dynamicEncounter.status.call.getStatus(ENUMS.EncounterStatus.GRID_ID);
        let pos = MATH.vec3FromArray(activeEncounterGrid.center, dynamicEncounter.status.call.getStatus(ENUMS.EncounterStatus.GRID_POS));

    //    console.log("GET POS:", pos);
    //    console.log("GET GRID ID:", gridId);

        let gridReady = function(grid) {
            let selectedActor = GameAPI.getGamePieceSystem().selectedActor
            selectedActor.setStatusKey(ENUMS.ActorStatus.TRAVEL_MODE, ENUMS.TravelMode.TRAVEL_MODE_BATTLE);
            selectedActor.setStatusKey(ENUMS.ActorStatus.SELECTED_TARGET, '');
            selectedActor.setStatusKey(ENUMS.ActorStatus.SELECTED_ENCOUNTER, '');
            notifyCameraStatus(ENUMS.CameraStatus.CAMERA_MODE, ENUMS.CameraControls.CAM_AUTO, false);

            dynamicEncounter.setEncounterGrid(grid);
        }

        activeEncounterGrid.initEncounterGrid(gridId, pos, gridReady )

    //    console.log("Activate Enc from Remote", dynamicEncounter)
    }

    deactivateActiveEncounter(positionOutside, victory) {

        if (encounterIsClosing === true) {
            console.log("Encounter Already closing")
            return
        }
        encounterIsClosing = true;

    //    console.log("DEACTIVATE ENC", positionOutside, victory, dynamicEncounter)
        let actor = GameAPI.getGamePieceSystem().selectedActor;

        if (dynamicEncounter) {
            if (dynamicEncounter.getStatus(ENUMS.EncounterStatus.ACTIVATION_STATE) === ENUMS.ActivationState.DEACTIVATING) {
             //   console.log("Deactivate already set")
            } else {
                dynamicEncounter.setStatusKey(ENUMS.EncounterStatus.ACTIVATION_STATE, ENUMS.ActivationState.DEACTIVATING);
            }
        }

        if (activeEncounterGrid) {


            if (positionOutside) {
                actor.transitionTo(activeEncounterGrid.getPosOutsideTrigger(), 1.0);
            }

            activeEncounterGrid.removeEncounterGrid()
            activeEncounterGrid = null;
        }

        encounterTurnSequencer.closeTurnSequencer();
        encounterUiSystem.closeEncounterUi()
        GameAPI.unregisterGameUpdateCallback(this.call.updateEncounterSystem)
        GameAPI.unregisterGameUpdateCallback(encounterStatusProcessor.processEncounterStatus)

        setTimeout(function() {
            if (dynamicEncounter) {
                dynamicEncounter.closeDynamicEncounter()
                dynamicEncounter = null;
                encounterUiSystem = new EncounterUiSystem()
            }

            actor.setStatusKey(ENUMS.ActorStatus.DEACTIVATING_ENCOUNTER, '');
            clearActorEncounterStatus(actor);
            if (!victory) {
            //    GameAPI.getGamePieceSystem().playerParty.clearPartyMemebers()
            }
        },1000)

        setTimeout(function() {
            GameAPI.call.spawnWorldEncounters();
        }, 3000)

    }

}

export { GameEncounterSystem }