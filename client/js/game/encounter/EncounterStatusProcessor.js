import {clearTargetSelection, getActorBySelectedTarget, hasHostileTarget} from "../../application/utils/StatusUtils.js";

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
        playerParty.call.partyVictorious(getStatus(ENUMS.EncounterStatus.WORLD_ENCOUNTER_ID))
    }

    setTimeout(victoryCall, 3000)
}

function processDefeat() {
    console.log("Defeat", activeEncounter);
    GuiAPI.screenText("DEFEAT", ENUMS.Message.HINT, 5)
    let playerParty = GameAPI.getGamePieceSystem().playerParty;

    setTimeout(playerParty.call.partyDefeated, 4000)
}

let processEncStatus = function() {

    if (encounterClosing === true) {

        let victory = getStatus(ENUMS.EncounterStatus.PLAYER_VICTORY);
        if (victory) {
            console.log("Update Post Victory")
        }

        return;
    }

    playerCount = getStatus(ENUMS.EncounterStatus.PLAYER_COUNT);
    playersEngaged = getStatus(ENUMS.EncounterStatus.PLAYERS_ENGAGED);
    playersDead = getStatus(ENUMS.EncounterStatus.PLAYERS_DEAD);
    opponentCount = getStatus(ENUMS.EncounterStatus.OPPONENT_COUNT);
    opponentsEngaged = getStatus(ENUMS.EncounterStatus.OPPONENTS_ENGAGED);
    opponentsDead = getStatus(ENUMS.EncounterStatus.OPPONENTS_DEAD);

    if (opponentsDead === opponentCount) {
        if (opponentCount !== 0) {
            encounterClosing = true;
            processVictory()
        }
        return;
    } else if (playersDead === playerCount) {
        encounterClosing = true;
        processDefeat()
        return;
    }

    encounterClosing = false;
    let hasTurnId = activeEncounter.status.call.getStatus(ENUMS.EncounterStatus.HAS_TURN_ACTOR);

    // let currentTurnActor = GameAPI.getActorById(hasTurnActorId);


    if (!hasTurnId) {

        hasTurnActorId = null;
        return;
    }
    if (hasTurnId !== hasTurnActorId) {

        let actor = GameAPI.getActorById(hasTurnId);

        if (!actor) {
            return;
        }

        hasTurnActorId = hasTurnId;

        if (actor.isPlayerActor()) {

            let hasTurn = actor.getStatus(ENUMS.ActorStatus.HAS_TURN);
            if (!hasTurn) {
                GuiAPI.screenText("Your Turn", ENUMS.Message.HINT)
                actor.startPlayerTurn(actor.call.turnEnded, activeEncounter.status.call.getStatus(ENUMS.EncounterStatus.TURN_INDEX))
            } else {
                // Hosting player starts turn from sequencer
            }
        } else if (actor.getStatus(ENUMS.ActorStatus.ALIGNMENT) === 'FRIENDLY') {
        //    GuiAPI.screenText("Other Payer Turn", ENUMS.Message.HINT)
            return;
        } else {
        //    GuiAPI.screenText("Enemy Turn", ENUMS.Message.HINT)
        //    actor.getActorTurnSequencer().startActorTurn(this.call.turnEnded, this.turnIndex);
            return
        }
    }
}


let standingOnTile = null;
function processEncounterTurnStartTileMechanics(actor) {
    actor.actorText.say("My Turn Start")

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
    let positionOutside = true;

    if (victory) {
        positionOutside = false;
        GameAPI.call.getGameEncounterSystem().deactivateActiveEncounter(positionOutside, victory);
        activeEncounter = null;
    }

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
            processEncStatus()

            let hasTurnId = activeEncounter.status.call.getStatus(ENUMS.EncounterStatus.HAS_TURN_ACTOR);
            if (hasTurnId) {
                let actor = GameAPI.getActorById(hasTurnId)
                if (!actor) {
                    this.actorTurnStart = null
                    return;
                }

                if (getStatus(ENUMS.EncounterStatus.ACTIVATION_STATE) === ENUMS.ActivationState.DEACTIVATING) {
                    processEncounterDeactivation(actor);
                    return;
                }

                if (actor.getStatus(ENUMS.ActorStatus.DEACTIVATING_ENCOUNTER) !== '') {
                    console.log("Deactivate: ", actor.getStatus(ENUMS.ActorStatus.DEACTIVATING_ENCOUNTER), activeEncounter.status.call.getStatus(ENUMS.EncounterStatus.WORLD_ENCOUNTER_ID))
                    return;
                }

                if (this.actorTurnStart !== hasTurnId) {
                    processEncounterTurnStartTileMechanics(actor)
                    this.actorTurnStart = hasTurnId
                } else {
                    if (actor.getStatus(ENUMS.ActorStatus.DEAD) === false) {
                        processEncounterTileUpdateMechanics(actor)
                    }

                }

            } else {
                this.actorTurnStart = null
            }

        }
    }

}

export { EncounterStatusProcessor }