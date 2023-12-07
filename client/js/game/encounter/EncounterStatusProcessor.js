let activeEncounter = null;

let lastStatus = {};
let hasTurnActorId = null;

let setEncounter = function(enc) {
    activeEncounter = enc;
}
let getEncounter = function(enc) {
    return activeEncounter;
}

let processEncStatus = function() {

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
            GuiAPI.screenText("Other Payer Turn", ENUMS.Message.HINT)
            return;
        } else {
            GuiAPI.screenText("Enemy Turn", ENUMS.Message.HINT)
        //    actor.getActorTurnSequencer().startActorTurn(this.call.turnEnded, this.turnIndex);
            return
        }
    }
}


let standingOnTile = null;
function processEncounterTurnStartTileMechanics(actor) {
    actor.actorText.say("My Turn Start")
    actor.setStatusKey(ENUMS.ActorStatus.SELECTED_TARGET, '');
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

function processEncounterActorStatus(actor) {

    let deactivate = actor.getStatus(ENUMS.ActorStatus.DEACTIVATING_ENCOUNTER);

    if (deactivate) {
        GameAPI.call.getGameEncounterSystem().deactivateActiveEncounter(false);
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
                if (this.actorTurnStart !== hasTurnId) {
                    processEncounterTurnStartTileMechanics(actor)
                    this.actorTurnStart = hasTurnId
                } else {
                    processEncounterTileUpdateMechanics(actor)
                }
                processEncounterActorStatus(actor);
            } else {
                this.actorTurnStart = null
            }

        }
    }

}

export { EncounterStatusProcessor }