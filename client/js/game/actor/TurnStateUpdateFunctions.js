import {indicateTurnClose, indicateTurnInit} from "./TurnStateFeedback.js";
import {Vector3} from "../../../libs/three/math/Vector3.js";
import {TargetSelector} from "./TargetSelector.js";

let targetSelector = new TargetSelector();
let tempVec = new Vector3();
let actorTurnSequencer = null;
function setSequencer(sequencer) {
    actorTurnSequencer = sequencer;
}

function getSequencer() {
    return actorTurnSequencer;
}

function updateActorInit(tpf) {
    let actor = getSequencer().getGameActor()
    let seqTime = getSequencer().getSequenceTime()
    indicateTurnInit(actor, seqTime)

    if (seqTime > 1) {
        GameAPI.unregisterGameUpdateCallback(updateActorInit)
        getSequencer().call.stateTransition()
        tpf = 0;
    }
    getSequencer().advanceSequenceTime(tpf*2);
}

function updateActorTargetSelect(tpf) {

    let actor = getSequencer().getGameActor()
    let seqTime = getSequencer().getSequenceTime()


    let candidates = targetSelector.getActorEncounterTargetCandidates(actor)

    for (let i = 0; i < candidates.length; i++) {
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:actor.getPos(), to:candidates[i].getPos(), color:'YELLOW'});
    }

   // indicateTurnClose(actor, seqTime)

    if (seqTime > 1) {

        let targetActor = targetSelector.selectActorEncounterTarget(actor, candidates)

        getSequencer().setTargetActor(targetActor);

        GameAPI.unregisterGameUpdateCallback(updateActorTargetSelect)
        getSequencer().call.stateTransition()
        tpf = 0;
    }
    getSequencer().advanceSequenceTime(tpf);
}


function updateActorAttackTarget(tpf) {

    let actor = getSequencer().getGameActor()
    let seqTime = getSequencer().getSequenceTime()


    indicateTurnInit(actor, seqTime)

    actor.turnTowardsPos(getSequencer().getTargetActor().getPos())

    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:actor.getPos(), to:getSequencer().getTargetActor().getPos(), color:'WHITE'});


    if (seqTime > 1) {
        GameAPI.unregisterGameUpdateCallback(updateActorAttackTarget)
        getSequencer().call.stateTransition()
        tpf = 0;
    }
    getSequencer().advanceSequenceTime(tpf*2);
}

function updateActorTileSelect(tpf) {
//    indicateTurnClose(initActor, initTime)
    let actor = getSequencer().getGameActor()
    let seqTime = getSequencer().getSequenceTime()

    tempVec.subVectors(actor.getGameWalkGrid().getTargetPosition() , actor.getPos() )

    tempVec.multiplyScalar(seqTime);
    tempVec.add(actor.getPos())

    actor.prepareTilePath(tempVec)
    getSequencer().focusAtObj3d.position.copy(tempVec)


    if (seqTime > 1) {
        GameAPI.unregisterGameUpdateCallback(updateActorTileSelect)
        getSequencer().call.stateTransition()
        tpf = 0;
    }
    getSequencer().advanceSequenceTime(tpf);
}

function updateActorClose(tpf) {
    let actor = getSequencer().getGameActor()
    let seqTime = getSequencer().getSequenceTime()
    indicateTurnClose(actor, seqTime)

    if (seqTime > 1) {
        GameAPI.unregisterGameUpdateCallback(updateActorClose)
        getSequencer().call.stateTransition()
        tpf = 0;
    }

    getSequencer().advanceSequenceTime(tpf*2);
}

export {
    setSequencer,
    updateActorInit,
    updateActorTargetSelect,
    updateActorAttackTarget,
    updateActorTileSelect,
    updateActorClose
}