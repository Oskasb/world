import {indicateTurnClose, indicateTurnInit} from "./TurnStateFeedback.js";
import {Vector3} from "../../../libs/three/math/Vector3.js";
import {TargetSelector} from "./TargetSelector.js";
import {viewTargetSelection, viewPrecastAction, viewTileSelect} from "../../3d/camera/CameraFunctions.js";
import {ActionSelector} from "./ActionSelector.js";


let targetSelector = new TargetSelector();
let attackSelector = new ActionSelector();

let tempVec = new Vector3();
let tempVec2 = new Vector3();
let actorTurnSequencer = null;
function setSequencer(sequencer) {
    actorTurnSequencer = sequencer;
}

function getSequencer() {
    return actorTurnSequencer;
}

function updateActorInit(tpf) {
    let actor = getSequencer().getGameActor()
    let seqTime = getSequencer().getSequenceProgress()
    indicateTurnInit(actor, seqTime)

    if (seqTime > 1) {
        GameAPI.unregisterGameUpdateCallback(updateActorInit)
        getSequencer().call.stateTransition()
        tpf = 0;
    }
    getSequencer().advanceSequenceProgress(tpf*2);
}

let say = function(actor, message) {
    actor.actorText.say(message)
}

function updateActorTargetSelect(tpf) {

    let actor = getSequencer().getGameActor()
    let seqTime = getSequencer().getSequenceProgress()
    let candidates = targetSelector.getActorEncounterTargetCandidates(actor)

    viewTargetSelection(getSequencer(), candidates)

    if (seqTime === 0) {
        MATH.forAll(candidates, say, "maybe me")
    }

    if (seqTime > 1) {
        let targetActor = targetSelector.selectActorEncounterTarget(actor, candidates)
        actor.setStatusKey(ENUMS.ActorStatus.SELECTED_TARGET, targetActor.index)
        getSequencer().setTargetActor(targetActor);
        targetActor.actorText.yell('I am target')
        GameAPI.unregisterGameUpdateCallback(updateActorTargetSelect)
        getSequencer().call.stateTransition()
        tpf = 0;
    }
    getSequencer().advanceSequenceProgress(tpf*0.7);
}


function updateActorEvaluateTarget(tpf) {

    let actor = getSequencer().getGameActor()
    let seqTime = getSequencer().getSequenceProgress()
    actor.turnTowardsPos(getSequencer().getTargetActor().getSpatialPosition(), tpf)

    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:actor.getSpatialPosition(), to:getSequencer().getTargetActor().getSpatialPosition(), color:'WHITE'});
    let target = getSequencer().getTargetActor();
    viewPrecastAction(getSequencer(), target)
    if (seqTime > 1) {
        GameAPI.unregisterGameUpdateCallback(updateActorEvaluateTarget)
        getSequencer().call.stateTransition()
        tpf = 0;
    }

    getSequencer().advanceSequenceProgress(tpf * 0.75);
}

let availableActions = ["ACTION_FIREBALL", "ACTION_MAGIC_MISSILE", "ACTION_FREEZE_BOLT", "ACTION_HEAL_BOLT"]

function updateActorSelectAttack(tpf) {

    let actor = getSequencer().getGameActor()
    let seqTime = getSequencer().getSequenceProgress()

    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:actor.getSpatialPosition(), to:getSequencer().getTargetActor().getSpatialPosition(), color:'RED'});

    if (seqTime === 0) {

        getSequencer().selectedAttack = attackSelector.selectActorAction(actor)
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

    getSequencer().advanceSequenceProgress(tpf);
}


function updateActorApplyAttack(tpf) {

    let actor = getSequencer().getGameActor()
    let target = getSequencer().getTargetActor();
    let seqTime = getSequencer().getSequenceProgress()

    indicateTurnInit(actor, seqTime)

    let attack = getSequencer().selectedAttack;
    let holdTime = attack.getStepDuration('precast')



    if (seqTime > holdTime) {

        GameAPI.unregisterGameUpdateCallback(updateActorApplyAttack)

        attack.activateAttack(target, getSequencer().call.stateTransition)
        tpf = 0;
    }

    getSequencer().advanceSequenceProgress(tpf * 1.5);

}

function updateActorTileSelect(tpf) {
//    indicateTurnClose(initActor, initTime)
    let actor = getSequencer().getGameActor()
    let seqTime = getSequencer().getSequenceProgress()
    viewTileSelect(getSequencer(), actor);

    if (seqTime > 1) {
        GameAPI.unregisterGameUpdateCallback(updateActorTileSelect)
        getSequencer().call.stateTransition()
        tpf = 0;
    }
    getSequencer().advanceSequenceProgress(tpf);
}

function updateActorClose(tpf) {
    let actor = getSequencer().getGameActor()
    let seqTime = getSequencer().getSequenceProgress()
    indicateTurnClose(actor, seqTime)

    if (actor.isPlayerActor()) {
        
    } else {
        actor.setStatusKey(ENUMS.ActorStatus.SELECTED_TARGET, null)
    }

    if (seqTime > 1) {
        GameAPI.unregisterGameUpdateCallback(updateActorClose)
        getSequencer().call.stateTransition()
        tpf = 0;
    }

    getSequencer().advanceSequenceProgress(tpf*1.2);
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