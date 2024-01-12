import {ENUMS} from "../../../client/js/application/ENUMS.js";
import {MATH} from "../../../client/js/application/MATH.js";
import {endEncounterTurn, getStatusPosition, startEncounterTurn} from "../actor/ActorStatusFunctions.js";

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
    let activeId = serverEncounter.getStatus(ENUMS.EncounterStatus.HAS_TURN_ACTOR);
    let priorActor;
    if (activeId === '') {
        priorActor = null;
    } else {
        priorActor = serverEncounter.getServerActorById(activeId);
        console.log("pass turn to",  actor.id, "from", priorActor.id)
        endEncounterTurn(serverEncounter, priorActor);
    }

    startEncounterTurn(serverEncounter, actor);

    if (actor.getStatus(ENUMS.ActorStatus.DEAD)) {
        console.log("dead actor, drop turn",  actor.id)
        encounterSequencer.call.actorTurnEnded();
    }
    
}

function checkActorTurnDone(encounterSequencer, actor) {

    let serverEncounter = encounterSequencer.serverEncounter;
    let turnIndex = serverEncounter.getStatus(ENUMS.EncounterStatus.TURN_INDEX);
    let activeId = serverEncounter.getStatus(ENUMS.EncounterStatus.HAS_TURN_ACTOR);

    if (activeId === actor.id) {
        let turnState = actor.getStatus(ENUMS.ActorStatus.TURN_STATE);

        if (turnState === ENUMS.TurnState.TURN_CLOSE) {
            actor.setStatusKey(ENUMS.ActorStatus.TURN_DONE, turnIndex)
        }

        let turnDone = actor.getStatus(ENUMS.ActorStatus.TURN_DONE);
        if (turnDone === turnIndex) {
            console.log("turnDone", turnIndex, turnState, activeId)
            return true
        }
    } else {
        console.log("Id Missmatch for check on active actor turn done")
    }

    return false;

}


let actorList = [];

function selectActorEncounterTarget(serverEncounter, actor) {
    MATH.emptyArray(actorList);
    serverEncounter.call.getOpposingActors(actor, actorList);
    let target = MATH.getRandomArrayEntry(actorList);
    return target;
}



export {
    sequencerTurnActiveActor,
    getNextActorInTurnSequence,
    passSequencerTurnToActor,
    checkActorTurnDone,
    selectActorEncounterTarget
}