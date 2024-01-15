import {ENUMS} from "../../../client/js/application/ENUMS.js";
import {MATH} from "../../../client/js/application/MATH.js";
import {startActorTurn} from "../actor/ActorStatusFunctions.js";

function startEncounterTurn(serverEncounter) {

    let turnIndex = serverEncounter.getStatus(ENUMS.EncounterStatus.TURN_INDEX)+1;
 //   console.log("startEncounterTurn", turnIndex)
    serverEncounter.setStatusKey(ENUMS.EncounterStatus.TURN_INDEX, turnIndex++);
    turnIndex = serverEncounter.getStatus(ENUMS.EncounterStatus.TURN_INDEX);
    console.log("updatedTurnIndex", turnIndex)
    serverEncounter.setStatusKey(ENUMS.EncounterStatus.TURN_STATE, ENUMS.TurnState.TURN_INIT);
}

function endEncounterTurn(serverEncounter) {
    console.log("endEncounterTurn")
    serverEncounter.setStatusKey(ENUMS.EncounterStatus.TURN_STATE, ENUMS.TurnState.TURN_CLOSE);
}

function getNextActorInTurnSequence(encounterSequencer) {
    let serverEncounter = encounterSequencer.serverEncounter;
    let turnIndex = serverEncounter.getStatus(ENUMS.EncounterStatus.TURN_INDEX);
    let actors = serverEncounter.combatants;

    let lowestInitiative = MATH.bigSafeValue();
    let nextActor;
    for (let i = 0; i < actors.length; i++) {
        let actor = actors[i];
        let turnIndexDone = actor.getStatus(ENUMS.ActorStatus.TURN_DONE);
        console.log(turnIndex, turnIndexDone, actor)
        if (turnIndexDone < turnIndex) {
            let initiative = actor.getStatus(ENUMS.ActorStatus.SEQUENCER_INITIATIVE)
            if (initiative < lowestInitiative) {
                nextActor = actor;
                lowestInitiative = initiative;
            }
        }
    }

    return nextActor;
}



function passSequencerTurnToActor(encounterSequencer, actor) {

    let serverEncounter = encounterSequencer.serverEncounter;
    serverEncounter.setStatusKey(ENUMS.EncounterStatus.TURN_STATE, ENUMS.TurnState.TURN_MOVE);
    serverEncounter.setStatusKey(ENUMS.EncounterStatus.HAS_TURN_ACTOR, actor.getStatus(ENUMS.ActorStatus.ACTOR_ID));
    serverEncounter.setStatusKey(ENUMS.EncounterStatus.TURN_ACTOR_INITIATIVE, actor.getStatus(ENUMS.ActorStatus.SEQUENCER_INITIATIVE))
    console.log("pass turn to", actor.id)

    startActorTurn(serverEncounter, actor);

    if (actor.getStatus(ENUMS.ActorStatus.DEAD)) {
        console.log("dead actor, drop turn",  actor.id)
        encounterSequencer.call.actorTurnEnded();
    }
    
}

function getHasTurnActor(serverEncounter) {
    let turnIndex = serverEncounter.getStatus(ENUMS.EncounterStatus.TURN_INDEX);
    let activeId = serverEncounter.getStatus(ENUMS.EncounterStatus.HAS_TURN_ACTOR);
    let actor = serverEncounter.getEncounterCombatantById(activeId);
    return actor;
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
    startEncounterTurn,
    endEncounterTurn,
    getHasTurnActor,
    getNextActorInTurnSequence,
    passSequencerTurnToActor,
    checkActorTurnDone,
    selectActorEncounterTarget
}