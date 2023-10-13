
import {
    updateActorInit,
    updateActorTileSelect,
    updateActorTargetSelect,
    updateActorEvaluateTarget,
    updateActorSelectAttack,
    updateActorApplyAttack,
    updateActorClose,
    setSequencer
} from "./TurnStateUpdateFunctions.js";

let nullTurn = -1

function turnInit(actor, turnIndex) {
    let sequencer = actor.actorTurnSequencer
    setSequencer(sequencer)
    GameAPI.registerGameUpdateCallback(updateActorInit)
}

function turnTargetSelect(actor, turnIndex) {
    let sequencer = actor.actorTurnSequencer
    if (turnIndex === nullTurn) {
        sequencer.call.stateTransition()
        return;
    }
    GameAPI.registerGameUpdateCallback(updateActorTargetSelect)

}

function turnEvaluateTarget(actor, turnIndex) {
    let sequencer = actor.actorTurnSequencer

    if (turnIndex === nullTurn) {
        sequencer.call.stateTransition()
        return;
    }
    GameAPI.registerGameUpdateCallback(updateActorEvaluateTarget)
}

function turnSelectAttack(actor, turnIndex) {
    let sequencer = actor.actorTurnSequencer

    if (turnIndex === nullTurn) {
        sequencer.call.stateTransition()
        return;
    }
    GameAPI.registerGameUpdateCallback(updateActorSelectAttack)
}

function turnApplyAttack(actor, turnIndex) {

    let sequencer = actor.actorTurnSequencer

    if (turnIndex === nullTurn) {
        sequencer.call.stateTransition()
        return;
    }

    GameAPI.registerGameUpdateCallback(updateActorApplyAttack)

}


function turnTileSelect(actor, turnIndex) {
    let sequencer = actor.actorTurnSequencer
    actor.activateWalkGrid();
    if (turnIndex === nullTurn) {
        //    targetPos = actor.getGameWalkGrid().getTargetPosition()
    } else {
        let targetPos = actor.getActorGridMovementTargetPosition()
        actor.getGameWalkGrid().setTargetPosition(targetPos)
    }
    GameAPI.registerGameUpdateCallback(updateActorTileSelect)
}

function turnMove(actor, turnIndex) {
    let sequencer = actor.actorTurnSequencer
    let targetPos = actor.getGameWalkGrid().getTargetPosition()
    actor.moveActorOnGridTo(targetPos, sequencer.call.stateTransition)
}

function turnClose(actor, turnIndex) {
   // let sequencer = actor.actorTurnSequencer
    GameAPI.registerGameUpdateCallback(updateActorClose)
}

function cancelTurnProcess() {
    GameAPI.unregisterGameUpdateCallback(updateActorInit)
    GameAPI.unregisterGameUpdateCallback(updateActorTargetSelect)
    GameAPI.unregisterGameUpdateCallback(updateActorTileSelect)
    GameAPI.unregisterGameUpdateCallback(updateActorClose)
}

function turnClosed(actor, turnIndex, onCompletedCB) {
    let sequencer = actor.actorTurnSequencer
    setSequencer(sequencer)
    MATH.callAndClearAll(sequencer.turnEncBallbacks, actor);
}

export {
    turnInit,
    turnTargetSelect,
    turnEvaluateTarget,
    turnSelectAttack,
    turnApplyAttack,
    turnTileSelect,
    turnMove,
    turnClose,
    turnClosed,
    cancelTurnProcess
}