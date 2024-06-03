import {clearTargetSelection, getActorBySelectedTarget, hasHostileTarget} from "../../application/utils/StatusUtils.js";
import {buildEffectEvent, defaultEffectValues} from "../visuals/effects/EffectEventDefaults.js";

let playerCount = 0;
let playersEngaged = 0;
let playersDead = 0;
let opponentCount = 0;
let opponentsEngaged = 0;
let opponentsDead = 0;

let encounterClosing = false;

let activeEncounter = null;

let lastStatus = {};
let hasTurnActorId = null;

let setEncounter = function(enc) {
    encounterClosing = false;
    activeEncounter = enc;
}
let getEncounter = function(enc) {
    return activeEncounter;
}

function getStatus(key) {
    return activeEncounter.status.call.getStatus(ENUMS.EncounterStatus[key]);
}

function processVictory() {
    console.log("Victory", activeEncounter);
    activeEncounter.status.call.setStatus(ENUMS.EncounterStatus.PLAYER_VICTORY, true);
    GuiAPI.screenText("VICTORY", ENUMS.Message.HINT, 5)
    let playerParty = GameAPI.getGamePieceSystem().playerParty;
    let victoryCall = function() {
        playerParty.call.partyVictorious(getStatus(ENUMS.EncounterStatus.WORLD_ENCOUNTER_ID), activeEncounter)
    }

    setTimeout(victoryCall, 2000)
}

function processDefeat() {
    console.log("Defeat", activeEncounter);
    GuiAPI.screenText("DEFEAT", ENUMS.Message.HINT, 5)
    let playerParty = GameAPI.getGamePieceSystem().playerParty;

    setTimeout(playerParty.call.partyDefeated, 2000)
}


let standingOnTile = null;
function processEncounterTurnStartTileMechanics(actor) {
    actor.actorText.say("My Turn Start")

    console.log("Turn Start ", actor)

    if (!hasHostileTarget(actor)) {
        clearTargetSelection(actor)
    }

    let encounterGrid = GameAPI.getActiveEncounterGrid();
    let encounterTile = encounterGrid.getTileAtPosition(actor.getSpatialPosition());
    standingOnTile = encounterTile;
    if (actor.isPlayerActor()) {
        if (encounterTile.isExit) {
            GuiAPI.screenText("Leave Grid to Retreat")
            actor.setStatusKey(ENUMS.ActorStatus.EXIT_ENCOUNTER, activeEncounter.id);
        } else {
            actor.setStatusKey(ENUMS.ActorStatus.EXIT_ENCOUNTER, '');
        }
    }

}

function processEncounterTileUpdateMechanics(actor) {
    let encounterGrid = GameAPI.getActiveEncounterGrid();
    let encounterTile = encounterGrid.getTileAtPosition(actor.getSpatialPosition());
    if (standingOnTile !== encounterTile) {
        standingOnTile = encounterTile;

        if (actor.isPlayerActor()) {
            if (encounterTile.isExit) {
                GuiAPI.screenText("May exit from here next turn")
                actor.setStatusKey(ENUMS.ActorStatus.RETREATING, activeEncounter.id);
            } else {
                actor.setStatusKey(ENUMS.ActorStatus.RETREATING, '');
                actor.setStatusKey(ENUMS.ActorStatus.EXIT_ENCOUNTER, '');
            }
        }

    } else {

    }

}

function processEncounterDeactivation(actor) {
    console.log("DEACTIVATE ENC", activeEncounter)

    let victory = getStatus(ENUMS.EncounterStatus.PLAYER_VICTORY)

    if (encounterClosing === false) {
        if (victory) {
            //    positionOutside = false;
            //    GameAPI.call.getGameEncounterSystem().deactivateActiveEncounter(positionOutside, victory);
            //    activeEncounter = null;
            processVictory()
        } else {
            processDefeat()
        }
    }

    activeEncounter.setStatusKey(ENUMS.EncounterStatus.ACTIVATION_STATE, ENUMS.ActivationState.DEACTIVATED);
    encounterClosing = true;
}


class EncounterStatusProcessor {
    constructor() {
        this.actorTurnStart = null;
        this.call = {
            setEncounter:setEncounter,
            getEncounter:getEncounter
        }
    }

    processEncounterStatus() {
        if (activeEncounter) {

            let activationState = activeEncounter.getStatus(ENUMS.EncounterStatus.ACTIVATION_STATE);
            if (activationState === ENUMS.ActivationState.ACTIVATING) {
            //    console.log("Encounter Activating")
                return;
            }

            if (activationState === ENUMS.ActivationState.DEACTIVATED) {
            //    console.log("Encounter DEACTIVATED")
                return;
            }

            if (getStatus(ENUMS.EncounterStatus.ACTIVATION_STATE) === ENUMS.ActivationState.DEACTIVATING) {
                processEncounterDeactivation();
                return;
            }

            let hasTurnId = activeEncounter.status.call.getStatus(ENUMS.EncounterStatus.HAS_TURN_ACTOR);
            if (hasTurnId) {
                let actor = GameAPI.getActorById(hasTurnId)
                if (!actor) {
                    this.actorTurnStart = null
                    return;
                }

                if (actor.getStatus(ENUMS.ActorStatus.DEACTIVATING_ENCOUNTER) !== '') {
                    console.log("Deactivate: ", actor.getStatus(ENUMS.ActorStatus.DEACTIVATING_ENCOUNTER), activeEncounter.status.call.getStatus(ENUMS.EncounterStatus.WORLD_ENCOUNTER_ID))
                    return;
                }

                if (this.actorTurnStart !== hasTurnId) {
                //    processEncounterTurnStartTileMechanics(actor)
                    this.actorTurnStart = hasTurnId
                } else {
                    if (actor.getStatus(ENUMS.ActorStatus.DEAD) === false) {
                //        processEncounterTileUpdateMechanics(actor)
                    }
                }

            } else {
                this.actorTurnStart = null
            }

        }
    }

}

export { EncounterStatusProcessor }