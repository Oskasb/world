
import {
    updateActorClose,
    updateActorInit,
    updateActorTargetSelect,
    updateActorAttackTarget,
    updateActorTileSelect,
    setSequencer
} from "./TurnStateUpdateFunctions.js";

function turnInit(actor, turnIndex) {
    let sequencer = actor.actorTurnSequencer
    setSequencer(sequencer)
    GameAPI.registerGameUpdateCallback(updateActorInit)
}

function turnTargetSelect(actor, turnIndex) {
    let sequencer = actor.actorTurnSequencer
    if (turnIndex === 0) {
        sequencer.call.stateTransition()
        return;
    }
        setSequencer(sequencer)
        GameAPI.registerGameUpdateCallback(updateActorTargetSelect)

}

function turnAttackTarget(actor, turnIndex) {
    let sequencer = actor.actorTurnSequencer

    if (turnIndex === 0) {
        sequencer.call.stateTransition()
        return;
    }

    setSequencer(sequencer)
    GameAPI.registerGameUpdateCallback(updateActorAttackTarget)
}

function turnTileSelect(actor, turnIndex) {
    let sequencer = actor.actorTurnSequencer
    setSequencer(sequencer)
    actor.activateWalkGrid();
    let camHome = GameAPI.call.getActiveEncounter().getEncounterCameraHomePosition()
    sequencer.focusAtObj3d.position.copy(actor.getObj3d().position)
    evt.dispatch(ENUMS.Event.SET_CAMERA_MODE, {mode:'actor_turn_movement', obj3d:sequencer.focusAtObj3d, camPos:camHome})
    if (turnIndex === 0) {
        //    targetPos = actor.getGameWalkGrid().getTargetPosition()
    } else {
        let targetPos = actor.getActorGridMovementTargetPosition()
        actor.getGameWalkGrid().setTargetPosition(targetPos)
    }
    GameAPI.registerGameUpdateCallback(updateActorTileSelect)
}

function turnMove(actor, turnIndex) {
    let sequencer = actor.actorTurnSequencer
    setSequencer(sequencer)
    let camHome = GameAPI.call.getActiveEncounter().getEncounterCameraHomePosition()
    //    evt.dispatch(ENUMS.Event.SET_CAMERA_MODE, {mode:'actor_turn_movement', obj3d:actor.getObj3d(), camPos:camHome})
    let targetPos = actor.getGameWalkGrid().getTargetPosition()
    actor.moveActorOnGridTo(targetPos, sequencer.call.stateTransition)
}

function turnClose(actor, turnIndex) {
    let sequencer = actor.actorTurnSequencer
    setSequencer(sequencer)
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
    turnAttackTarget,
    turnTileSelect,
    turnMove,
    turnClose,
    turnClosed,
    cancelTurnProcess
}