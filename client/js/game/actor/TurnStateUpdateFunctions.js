import {indicateTurnClose, indicateTurnInit} from "./TurnStateFeedback.js";
import {Vector3} from "../../../libs/three/math/Vector3.js";
import {TargetSelector} from "./TargetSelector.js";

let targetSelector = new TargetSelector();
let tempVec = new Vector3();
let tempVec2 = new Vector3();
let camTargetPos = new Vector3();
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

    tempVec2.set(0, 0, 0)
    for (let i = 0; i < candidates.length; i++) {
        tempVec.copy(candidates[i].getPos())
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:actor.getPos(), to:tempVec, color:'YELLOW'});
        tempVec.sub(actor.getPos());
        tempVec2.add(tempVec);
    }
    tempVec2.multiplyScalar((seqTime*0.95+0.05) / candidates.length);
    tempVec.copy(tempVec2);
    tempVec2.add(actor.getPos());

    actor.turnTowardsPos(tempVec2)

    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:actor.getPos(), to:tempVec2, color:'WHITE'});
    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:tempVec2, color:'WHITE', size:0.25})
    getSequencer().focusAtObj3d.position.copy(tempVec2);
   // indicateTurnClose(actor, seqTime)


    camTargetPos.copy(tempVec);
    camTargetPos.y = 0;
    camTargetPos.normalize()
    camTargetPos.multiplyScalar(-5);

    let camHome = GameAPI.call.getActiveEncounter().getEncounterCameraHomePosition()
//    tempVec.copy(camHome);
//    tempVec.sub(actor.getPos());
//    tempVec.multiplyScalar(0.5);
    camTargetPos.y +=6;

    camTargetPos.add(actor.getPos())
    camTargetPos.y += Math.sin(seqTime * Math.PI)*3
    camTargetPos.lerp(camHome,1-MATH.curveSigmoid(seqTime));
    camTargetPos.y += Math.sin(seqTime * Math.PI)*2
    // camTargetPos.add(tempVec)

    if (seqTime === 0) {
        evt.dispatch(ENUMS.Event.SET_CAMERA_MODE, {mode:'actor_turn_movement', obj3d:getSequencer().focusAtObj3d, camPos:camTargetPos})
    }

    if (seqTime > 1) {
        camTargetPos.copy(tempVec);
        camTargetPos.normalize()
        camTargetPos.multiplyScalar(-4);
        camTargetPos.y +=6;
        camTargetPos.add(actor.getPos())

        camTargetPos.y -=2;
        let targetActor = targetSelector.selectActorEncounterTarget(actor, candidates)

        getSequencer().setTargetActor(targetActor);
        getSequencer().focusAtObj3d.position.copy(targetActor.getPos());
        GameAPI.unregisterGameUpdateCallback(updateActorTargetSelect)
        getSequencer().call.stateTransition()
        tpf = 0;
    }
    getSequencer().advanceSequenceTime(tpf*0.7);
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
    getSequencer().advanceSequenceTime(tpf**0.5);
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

    getSequencer().advanceSequenceTime(tpf*1);
}

export {
    setSequencer,
    updateActorInit,
    updateActorTargetSelect,
    updateActorAttackTarget,
    updateActorTileSelect,
    updateActorClose
}