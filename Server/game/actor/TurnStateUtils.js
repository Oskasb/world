
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
import {
    registerGameServerUpdateCallback,
    unregisterGameServerUpdateCallback
} from "../utils/GameServerFunctions.js";

let nullTurn = -1

function turnInit(actor, turnIndex) {
    console.log("turnInit", turnIndex)
    actor.setStatusKey(ENUMS.ActorStatus.HAS_TURN, true)
    let sequencer = actor.actorTurnSequencer
    setSequencer(sequencer)
    registerGameServerUpdateCallback(updateActorInit)
}

function turnTargetSelect(actor, turnIndex) {
    console.log("turnTargetSelect", turnIndex)
    let sequencer = actor.actorTurnSequencer
    if (turnIndex === nullTurn) {
        sequencer.call.stateTransition()
        return;
    }
    actor.actorText.say('Selecting target')
    registerGameServerUpdateCallback(updateActorTargetSelect)

}

function turnEvaluateTarget(actor, turnIndex) {
    console.log("turnEvaluateTarget", turnIndex)
    let sequencer = actor.actorTurnSequencer

    if (turnIndex === nullTurn) {
        sequencer.call.stateTransition()
        return;
    }
    actor.actorText.say('Evaluate target')
    registerGameServerUpdateCallback(updateActorEvaluateTarget)
}

function turnSelectAttack(actor, turnIndex) {
    console.log("turnSelectAttack", turnIndex)
    let sequencer = actor.actorTurnSequencer

    if (turnIndex === nullTurn) {
        sequencer.call.stateTransition()
        return;
    }
//    actor.actorText.say('Selecting action')
    registerGameServerUpdateCallback(updateActorSelectAttack)
}

function turnApplyAttack(actor, turnIndex) {
    console.log("turnApplyAttack", turnIndex)
    let sequencer = actor.actorTurnSequencer

    if (turnIndex === nullTurn) {
        sequencer.call.stateTransition()
        return;
    }
 //   actor.actorText.say('Apply action')
    registerGameServerUpdateCallback(updateActorApplyAttack)

}


function turnTileSelect(actor, turnIndex) {
    console.log("turnTileSelect", turnIndex)
    let sequencer = actor.actorTurnSequencer
    actor.activateWalkGrid();
    if (turnIndex === nullTurn) {
        //    targetPos = actor.getGameWalkGrid().getTargetPosition()
    } else {
        let targetPos = actor.getActorGridMovementTargetPosition()
        actor.getGameWalkGrid().setTargetPosition(targetPos)
    }
 //   actor.actorText.say('Select tile')
    registerGameServerUpdateCallback(updateActorTileSelect)
}

function turnMove(actor, turnIndex) {
    console.log("turnMove", turnIndex)
    let sequencer = actor.actorTurnSequencer
    let targetPos = actor.getGameWalkGrid().getTargetPosition()
  //  actor.actorText.say('Moving '+Math.round(targetPos.x)+' '+Math.round(targetPos.z))

  //  let walkGrid = actor.getGameWalkGrid();
   // actor.prepareTilePath(targetPos);
    //    walkGrid.applySelectedPath(null, sequencer.call.stateTransition)

   actor.moveActorOnGridTo(targetPos, sequencer.call.stateTransition)
}

function turnClose(actor, turnIndex) {
    console.log("turnClose", turnIndex)
   // let sequencer = actor.actorTurnSequencer
 //   actor.actorText.say('Turn completed')
    registerGameServerUpdateCallback(updateActorClose)
}

function cancelTurnProcess() {
    unregisterGameServerUpdateCallback(updateActorInit)
    unregisterGameServerUpdateCallback(updateActorTargetSelect)
    unregisterGameServerUpdateCallback(updateActorTileSelect)
    unregisterGameServerUpdateCallback(updateActorClose)
}

function turnClosed(actor, turnIndex, onCompletedCB) {
 //   actor.actorText.say('Turn closed '+turnIndex)
    actor.setStatusKey(ENUMS.ActorStatus.HAS_TURN, false)
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