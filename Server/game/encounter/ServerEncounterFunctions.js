import {ENUMS} from "../../../client/js/application/ENUMS.js";
import {MATH} from "../../../client/js/application/MATH.js";

function getNextActorInTurnSequence(encounterSequencer) {
    let serverEncounter = encounterSequencer.serverEncounter;
    let turnIndex = serverEncounter.getStatus(ENUMS.EncounterStatus.TURN_INDEX);
    let actors = encounterSequencer.actors;

    let lowestInitiative = MATH.bigSafeValue();
    let nextActor;
    for (let i = 0; i < actors.length; i++) {
        let actor = actors[i];
        let turnIndexDone = actor.getStatus(ENUMS.ActorStatus.TURN_DONE);
        if (turnIndexDone < turnIndex) {
            let initiative = actor.getStatus(ENUMS.ActorStatus.SEQUENCER_INITIATIVE)
            if (initiative < lowestInitiative) {
                nextActor = actor;
                lowestInitiative = initiative;
            }
        }
    }

    if (!nextActor) {
        console.log("All actor turns consumed, adding turn")
        encounterSequencer.call.sequencerTurnEnded();
    }

    return nextActor;
}

function sequencerTurnActiveActor(encounterSequencer) {
    let serverEncounter = encounterSequencer.serverEncounter;

    let turnIndex = serverEncounter.getStatus(ENUMS.EncounterStatus.TURN_INDEX);
    let activeId = serverEncounter.getStatus(ENUMS.EncounterStatus.HAS_TURN_ACTOR);
    let actor;
    if (!activeId) {
        console.log("No turn actor ID")
        actor = getNextActorInTurnSequence(encounterSequencer);
    } else {
        actor = serverEncounter.getServerActorById(activeId);
        let turnIndexDone = actor.getStatus(ENUMS.ActorStatus.TURN_DONE);
        if (turnIndexDone === turnIndex) {
            actor = getNextActorInTurnSequence(encounterSequencer);
        }
    }

    return actor;
}

function passSequencerTurnToActor(encounterSequencer, actor) {
    let serverEncounter = encounterSequencer.serverEncounter;
    let turnIndex = serverEncounter.getStatus(ENUMS.EncounterStatus.TURN_INDEX);
    let activeId = serverEncounter.getStatus(ENUMS.EncounterStatus.HAS_TURN_ACTOR);
    let priorActor = serverEncounter.getServerActorById(activeId);

    if (priorActor) {
        priorActor.setStatusKey(ENUMS.ActorStatus.HAS_TURN, false);
        priorActor.setStatusKey(ENUMS.ActorStatus.TURN_DONE, turnIndex);
        actor.setStatusKey(ENUMS.ActorStatus.TURN_STATE, ENUMS.TurnState.NO_TURN);
    } else {

        if (turnIndex === 0) {
            console.log("No Actor first turn, assuming new encounter started")
            let setupDone = serverEncounter.encounterPrepareFirstTurn()
            if (setupDone === false) {
                return;
            }
        } else {
            console.log("No prior Actor, assuming new turn started")
        }
    }

    encounterSequencer.activeActor = actor;
    serverEncounter.setStatusKey(ENUMS.EncounterStatus.HAS_TURN_ACTOR, actor.id);
    actor.setStatusKey(ENUMS.ActorStatus.HAS_TURN, true);
    actor.setStatusKey(ENUMS.ActorStatus.TURN_STATE, ENUMS.TurnState.TURN_INIT);
    actor.setStatusKey(ENUMS.ActorStatus.HAS_TURN_INDEX, turnIndex);

    if (priorActor) {
        serverEncounter.sendActorStatusUpdate(priorActor);
        console.log("pass turn to",  actor.id, "from", priorActor)
    }



    if (actor.getStatus(ENUMS.ActorStatus.DEAD)) {
        console.log("dead actor, drop turn",  actor.id)
        encounterSequencer.call.actorTurnEnded();
        return;
    }

    let actorIsPlayer = serverEncounter.actorIsPlayer(actor)

    if (actorIsPlayer) {
        serverEncounter.setStatusKey(ENUMS.EncounterStatus.ACTIVE_TURN_SIDE, "PARTY PLAYER");

        actor.setStatusKey(ENUMS.ActorStatus.HAS_TURN, true);
        actor.setStatusKey(ENUMS.ActorStatus.PARTY_SELECTED, true);
        actor.setStatusKey(ENUMS.ActorStatus.HAS_TURN_INDEX, turnIndex)
        actor.setStatusKey(ENUMS.ActorStatus.TURN_STATE, ENUMS.TurnState.TURN_INIT);
    } else {
        serverEncounter.setStatusKey(ENUMS.EncounterStatus.ACTIVE_TURN_SIDE, "OPPONENTS");
        actor.turnSequencer.startActorTurn(encounterSequencer.call.actorTurnEnded, turnIndex);
    }

}

function checkActorTurnDone(encounterSequencer, actor) {

    let serverEncounter = encounterSequencer.serverEncounter;
    let turnIndex = serverEncounter.getStatus(ENUMS.EncounterStatus.TURN_INDEX);
    let activeId = serverEncounter.getStatus(ENUMS.EncounterStatus.HAS_TURN_ACTOR);

    if (activeId === actor.id) {
        let turnState = actor.getStatus(ENUMS.ActorStatus.TURN_STATE);
        console.log("hasTurn", turnIndex, turnState, activeId)
        let turnDone = actor.getStatus(ENUMS.ActorStatus.TURN_DONE);
        if (turnDone === turnIndex) {
            return true
        }
    } else {
        console.log("Id Missmatch for check on active actor turn done")
    }

    return false;

}

export {
    sequencerTurnActiveActor,
    getNextActorInTurnSequence,
    passSequencerTurnToActor,
    checkActorTurnDone
}