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
    if (hasTurnId !== hasTurnActorId) {

        let actor = GameAPI.getActorById(hasTurnId);

        if (!actor) {
            return;
        }

        hasTurnActorId = hasTurnId;

        if (actor.isPlayerActor()) {
            GuiAPI.screenText("Your Turn", ENUMS.Message.HINT)
        } else if (actor.getStatus(ENUMS.ActorStatus.ALIGNMENT) === 'FRIENDLY') {
            GuiAPI.screenText("Other Payer Turn", ENUMS.Message.HINT)
            return;
        } else {
            GuiAPI.screenText("Enemy Turn", ENUMS.Message.HINT)
        //    actor.getActorTurnSequencer().startActorTurn(this.call.turnEnded, this.turnIndex);
        }

        let hasTurn = actor.getStatus(ENUMS.ActorStatus.HAS_TURN);
        if (!hasTurn) {
            actor.startPlayerTurn(actor.call.turnEnded, activeEncounter.status.call.getStatus(ENUMS.EncounterStatus.TURN_INDEX))
        }

    }

}

class EncounterStatusProcessor {
    constructor() {
        this.call = {
            setEncounter:setEncounter,
            getEncounter:getEncounter
        }
    }

    processEncounterStatus() {
        if (activeEncounter) {
            processEncStatus()
        }
    }

}

export { EncounterStatusProcessor }