
import {
    updateActorInit,
    updateActorTileSelect,
    updateActorTargetSelect,
    updateActorEvaluateTarget,
    updateActorSelectAttack,
    updateActorApplyAttack,
    updateActorClose,
    setSequencer,
    updateActorTurnMove
} from "./TurnStateUpdateFunctions.js";
import {
    getRandomWalkableTiles,
    registerGameServerUpdateCallback,
    unregisterGameServerUpdateCallback
} from "../utils/GameServerFunctions.js";

import {ENUMS} from "../../../client/js/application/ENUMS.js";
import {getStatusPosition, setDestination} from "./ActorStatusFunctions.js";

let nullTurn = -1

function turnInit(actor, turnIndex) {
    console.log("turnInit", turnIndex)
    actor.setStatusKey(ENUMS.ActorStatus.HAS_TURN, true)
    actor.setStatusKey(ENUMS.ActorStatus.TURN_STATE, ENUMS.TurnState.TURN_INIT)

    let sequencer = actor.turnSequencer
    let serverEncounter = sequencer.serverEncounter;
    setSequencer(sequencer)
    registerGameServerUpdateCallback(updateActorInit)
}

function turnTileSelect(actor, turnIndex) {
    console.log("turnTileSelect", turnIndex)
    actor.setStatusKey(ENUMS.ActorStatus.TURN_STATE, ENUMS.TurnState.TILE_SELECT)
    let sequencer = actor.turnSequencer
    let serverEncounter = sequencer.serverEncounter;
    let serverGrid = serverEncounter.serverGrid;
    let gridTiles = serverGrid.gridTiles;

    let tile = getRandomWalkableTiles(gridTiles, 1)[0];
    // console.log("Destination tile:", tile)
    let pos = tile.getPos();
    // console.log("Destination pos:", pos, "Actor Pos", getStatusPosition(actor))
    setDestination(actor, pos);

    registerGameServerUpdateCallback(updateActorTileSelect)
}

function turnMove(actor, turnIndex) {
    console.log("turnMove", turnIndex)
    actor.setStatusKey(ENUMS.ActorStatus.TURN_STATE, ENUMS.TurnState.TURN_MOVE)
    registerGameServerUpdateCallback(updateActorTurnMove)
}

function turnTargetSelect(actor, turnIndex) {
    console.log("turnTargetSelect", turnIndex)
    let sequencer = actor.turnSequencer
    let serverEncounter = sequencer.serverEncounter;
    actor.setStatusKey(ENUMS.ActorStatus.TURN_STATE, ENUMS.TurnState.TARGET_SELECT)
    if (turnIndex === nullTurn) {
        sequencer.call.stateTransition()
        return;
    }
    actor.actorText.say('Selecting target')
    registerGameServerUpdateCallback(updateActorTargetSelect)

}

function turnEvaluateTarget(actor, turnIndex) {
    console.log("turnEvaluateTarget", turnIndex)
    actor.setStatusKey(ENUMS.ActorStatus.TURN_STATE, ENUMS.TurnState.TARGET_EVALUATE)
    let sequencer = actor.turnSequencer
    let serverEncounter = sequencer.serverEncounter;
    if (turnIndex === nullTurn) {
        sequencer.call.stateTransition()
        return;
    }
    actor.actorText.say('Evaluate target')
    registerGameServerUpdateCallback(updateActorEvaluateTarget)
}

function turnSelectAttack(actor, turnIndex) {
    console.log("turnSelectAttack", turnIndex)
    actor.setStatusKey(ENUMS.ActorStatus.TURN_STATE, ENUMS.TurnState.ACTION_SELECT)
    let sequencer = actor.turnSequencer
    let serverEncounter = sequencer.serverEncounter;
    if (turnIndex === nullTurn) {
        sequencer.call.stateTransition()
        return;
    }
//    actor.actorText.say('Selecting action')
    registerGameServerUpdateCallback(updateActorSelectAttack)
}

function turnApplyAttack(actor, turnIndex) {
    console.log("turnApplyAttack", turnIndex)
    actor.setStatusKey(ENUMS.ActorStatus.TURN_STATE, ENUMS.TurnState.ACTION_APPLY)
    let sequencer = actor.turnSequencer
    let serverEncounter = sequencer.serverEncounter;
    if (turnIndex === nullTurn) {
        sequencer.call.stateTransition()
        return;
    }
 //   actor.actorText.say('Apply action')
    registerGameServerUpdateCallback(updateActorApplyAttack)

}



function turnClose(actor, turnIndex) {
    console.log("turnClose", turnIndex)
    actor.setStatusKey(ENUMS.ActorStatus.TURN_STATE, ENUMS.TurnState.TURN_CLOSE)
   // let sequencer = actor.actorTurnSequencer
 //   actor.actorText.say('Turn completed')
    registerGameServerUpdateCallback(updateActorClose)
}

function cancelTurnProcess() {
    unregisterGameServerUpdateCallback(updateActorInit)
    unregisterGameServerUpdateCallback(updateActorTileSelect)
    unregisterGameServerUpdateCallback(updateActorTurnMove)
    unregisterGameServerUpdateCallback(updateActorTargetSelect)
    unregisterGameServerUpdateCallback(updateActorSelectAttack)
    unregisterGameServerUpdateCallback(updateActorApplyAttack)
    unregisterGameServerUpdateCallback(updateActorClose)
}

function turnClosed(actor, turnIndex, onCompletedCB) {
 //   actor.actorText.say('Turn closed '+turnIndex)
    actor.setStatusKey(ENUMS.ActorStatus.HAS_TURN, false)
    let sequencer = actor.turnSequencer
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