import {ENUMS} from "../../../client/js/application/ENUMS.js";
import {MATH} from "../../../client/js/application/MATH.js";
import {getStatusPosition} from "../actor/ActorStatusFunctions.js";

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
    let priorActor;
    if (activeId === '') {
        priorActor = null;
    } else {
        priorActor = serverEncounter.getServerActorById(activeId);
    }


    if (priorActor === actor) {
        console.log("Pass Turn back to prior", encounterSequencer, actor);
    //    actor.setStatusKey(ENUMS.ActorStatus.TURN_DONE, turnIndex)
    //    encounterSequencer.activeActor = null;
        // encounterSequencer.call.actorTurnEnded();
        return;
    }

    if (priorActor) {
        priorActor.setStatusKey(ENUMS.ActorStatus.HAS_TURN, false);
        priorActor.setStatusKey(ENUMS.ActorStatus.TURN_DONE, turnIndex);
        priorActor.setStatusKey(ENUMS.ActorStatus.TURN_STATE, ENUMS.TurnState.NO_TURN);
        serverEncounter.sendActorStatusUpdate(priorActor);
        console.log("pass turn to",  actor.id, "from", priorActor.id)
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


    if (actor.getStatus(ENUMS.ActorStatus.DEAD)) {
        console.log("dead actor, drop turn",  actor.id)
        encounterSequencer.call.actorTurnEnded();
        return;
    }

    let actorIsPlayer = serverEncounter.actorIsPlayer(actor)

    if (actorIsPlayer) {
        console.log("Start player actor turn", actor)
        serverEncounter.setStatusKey(ENUMS.EncounterStatus.ACTIVE_TURN_SIDE, "PARTY PLAYER");

        actor.setStatusKey(ENUMS.ActorStatus.HAS_TURN, true);
        actor.setStatusKey(ENUMS.ActorStatus.PARTY_SELECTED, true);
        actor.setStatusKey(ENUMS.ActorStatus.HAS_TURN_INDEX, turnIndex)
        actor.setStatusKey(ENUMS.ActorStatus.TURN_STATE, ENUMS.TurnState.TURN_INIT);
    } else {
        serverEncounter.setStatusKey(ENUMS.EncounterStatus.ACTIVE_TURN_SIDE, "OPPONENTS");
        actor.turnSequencer.startActorTurn(encounterSequencer.call.actorTurnEnded, turnIndex, serverEncounter);
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