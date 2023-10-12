import {indicateTurnClose, indicateTurnInit} from "./TurnStateFeedback.js";
import {Vector3} from "../../../libs/three/math/Vector3.js";
import {TargetSelector} from "./TargetSelector.js";
import {viewTargetSelection, viewPrecastAction} from "../../3d/camera/CameraFunctions.js";
import {ActionSelector} from "./ActionSelector.js";


let targetSelector = new TargetSelector();
let attackSelector = new ActionSelector();

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

    viewTargetSelection(getSequencer(), candidates)

    if (seqTime > 1) {
        let targetActor = targetSelector.selectActorEncounterTarget(actor, candidates)
        getSequencer().setTargetActor(targetActor);
        getSequencer().focusAtObj3d.position.copy(targetActor.getPos());
        GameAPI.unregisterGameUpdateCallback(updateActorTargetSelect)
        getSequencer().call.stateTransition()
        tpf = 0;
    }
    getSequencer().advanceSequenceTime(tpf*0.7);
}


function updateActorEvaluateTarget(tpf) {

    let actor = getSequencer().getGameActor()
    let seqTime = getSequencer().getSequenceTime()

    actor.turnTowardsPos(getSequencer().getTargetActor().getPos())

    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:actor.getPos(), to:getSequencer().getTargetActor().getPos(), color:'WHITE'});

    if (seqTime > 1) {
        GameAPI.unregisterGameUpdateCallback(updateActorEvaluateTarget)
        getSequencer().call.stateTransition()
        tpf = 0;
    }

    getSequencer().advanceSequenceTime(tpf * 0.75);
}

let availableActions = ["ACTION_FIREBALL", "ACTION_MAGIC_MISSILE", "ACTION_FREEZE_BOLT", "ACTION_HEAL_BOLT"]

function updateActorSelectAttack(tpf) {

    let actor = getSequencer().getGameActor()
    let seqTime = getSequencer().getSequenceTime()

    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:actor.getPos(), to:getSequencer().getTargetActor().getPos(), color:'RED'});

    if (seqTime === 0) {
        getSequencer().selectedAttack = attackSelector.selectActorAction(actor, availableActions)
    }



    let attack = getSequencer().selectedAttack;
    let holdTime = attack.getStepDuration('selected')

    let target = getSequencer().getTargetActor();
    viewPrecastAction(getSequencer(), target)

    if (seqTime > holdTime) {

        attack.call.advanceState();
        GameAPI.unregisterGameUpdateCallback(updateActorSelectAttack)
        getSequencer().call.stateTransition()
        tpf = 0;
    }

    getSequencer().advanceSequenceTime(tpf);
}


function updateActorApplyAttack(tpf) {

    let actor = getSequencer().getGameActor()
    let target = getSequencer().getTargetActor();
    let seqTime = getSequencer().getSequenceTime()

    indicateTurnInit(actor, seqTime)

    let attack = getSequencer().selectedAttack;
    let holdTime = attack.getStepDuration('precast')



    if (seqTime > holdTime) {

        GameAPI.unregisterGameUpdateCallback(updateActorApplyAttack)

        attack.activateAttack(target, getSequencer().call.stateTransition)
        tpf = 0;
    }

    getSequencer().advanceSequenceTime(tpf * 1.5);

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

    getSequencer().advanceSequenceTime(tpf*1.2);
}

export {
    setSequencer,
    updateActorInit,
    updateActorTargetSelect,
    updateActorEvaluateTarget,
    updateActorSelectAttack,
    updateActorApplyAttack,
    updateActorTileSelect,
    updateActorClose
}