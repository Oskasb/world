import {unregisterGameServerUpdateCallback} from "../utils/GameServerFunctions.js";


let actorTurnSequencer = null;
function setSequencer(sequencer) {
    actorTurnSequencer = sequencer;
}

function getSequencer() {
    return actorTurnSequencer;
}

function updateActorInit(tpf) {
    let seqTime = getSequencer().getSequenceProgress()

    if (seqTime > 1) {
        unregisterGameServerUpdateCallback(updateActorInit)
        getSequencer().call.stateTransition()
        tpf = 0;
    }
    getSequencer().advanceSequenceProgress(tpf*2);
}

function updateActorTargetSelect(tpf) {

    let seqTime = getSequencer().getSequenceProgress()
    if (seqTime > 1) {

        unregisterGameServerUpdateCallback(updateActorTargetSelect)
        getSequencer().call.stateTransition()
        tpf = 0;
    }
    getSequencer().advanceSequenceProgress(tpf*0.7);
}


function updateActorEvaluateTarget(tpf) {

    let seqTime = getSequencer().getSequenceProgress()

    if (seqTime > 1) {
        unregisterGameServerUpdateCallback(updateActorEvaluateTarget)
        getSequencer().call.stateTransition()
        tpf = 0;
    }

    getSequencer().advanceSequenceProgress(tpf * 0.75);
}

function updateActorSelectAttack(tpf) {

 //   let actor = getSequencer().getGameActor()
    let seqTime = getSequencer().getSequenceProgress()

 //   evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:actor.getSpatialPosition(), to:getSequencer().getTargetActor().getSpatialPosition(), color:'RED'});

    if (seqTime === 0) {
 //       getSequencer().selectedAttack = attackSelector.selectActorAction(actor)
    }


 //   let attack = getSequencer().selectedAttack;
    let holdTime = attack.getStepDuration('selected')

 //   let target = getSequencer().getTargetActor();
 //   attack.setActionTargetId(target.id);
 //   viewPrecastAction(getSequencer(), target)

    if (seqTime > holdTime) {
        unregisterGameServerUpdateCallback(updateActorSelectAttack)
        getSequencer().call.stateTransition()
        tpf = 0;
    }

    getSequencer().advanceSequenceProgress(tpf);
}


function updateActorApplyAttack(tpf) {

    let actor = getSequencer().getGameActor()
    let target = getSequencer().getTargetActor();
    let seqTime = getSequencer().getSequenceProgress()

    let attack = getSequencer().selectedAttack;

    if (seqTime === 0) {

        unregisterGameServerUpdateCallback(updateActorApplyAttack)

        attack.activateAttack(getSequencer().call.stateTransition)
        tpf = 0;
    }

    getSequencer().advanceSequenceProgress(tpf * 1.5);

}

function updateActorTileSelect(tpf) {

    let seqTime = getSequencer().getSequenceProgress()

    if (seqTime > 1) {
        unregisterGameServerUpdateCallback(updateActorTileSelect)
        getSequencer().call.stateTransition()
        tpf = 0;
    }
    getSequencer().advanceSequenceProgress(tpf);
}

function updateActorClose(tpf) {
    let seqTime = getSequencer().getSequenceProgress()

    if (seqTime > 1) {
        unregisterGameServerUpdateCallback(updateActorClose)
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