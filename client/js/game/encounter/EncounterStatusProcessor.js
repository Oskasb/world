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
            GuiAPI.screenText("Your Turn", ENUMS.Message.HINT)
            let hasTurn = actor.getStatus(ENUMS.ActorStatus.HAS_TURN);
            if (!hasTurn) {
                actor.startPlayerTurn(actor.call.turnEnded, activeEncounter.status.call.getStatus(ENUMS.EncounterStatus.TURN_INDEX))
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