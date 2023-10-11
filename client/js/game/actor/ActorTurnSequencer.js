import {turnClose, turnInit, turnMove, cancelTurnProcess, turnTileSelect, turnTargetSelect, turnAttackTarget, turnClosed} from "./TurnStateUtils.js";
import {Object3D} from "../../../libs/three/core/Object3D.js";

let turnStateKeys = {
    turn_init:'turn_init',
    turn_tile_select:'turn_tile_select',
    turn_move:'turn_move',
    turn_target_select:'turn_target_select',
    turn_attack_target:'turn_attack_target',
    turn_close:'turn_close',
    turn_closed:'turn_closed'
}

let turnStateMap = {}
turnStateMap[turnStateKeys.turn_init] = {enter: turnInit, exitTo:turnStateKeys.turn_tile_select};
turnStateMap[turnStateKeys.turn_tile_select] = {enter: turnTileSelect, exitTo:turnStateKeys.turn_move};

turnStateMap[turnStateKeys.turn_move] = {enter: turnMove, exitTo:turnStateKeys.turn_target_select};

turnStateMap[turnStateKeys.turn_target_select] = {enter: turnTargetSelect, exitTo:turnStateKeys.turn_attack_target};

turnStateMap[turnStateKeys.turn_attack_target] = {enter: turnAttackTarget, exitTo:turnStateKeys.turn_close};

turnStateMap[turnStateKeys.turn_close] = {enter: turnClose, exitTo:turnStateKeys.turn_closed};
turnStateMap[turnStateKeys.turn_closed] = {enter: turnClosed, exitTo:null};

let activateStateTransition = function(sequencer) {
    sequencer.stepProgress = 0;
    let turnStateKey = sequencer.exitTo;
    let enter = turnStateMap[turnStateKey].enter;
    sequencer.exitTo  = turnStateMap[turnStateKey].exitTo;
    enter(sequencer.actor, sequencer.turnIndex)
}

class ActorTurnSequencer {
    constructor() {

        this.actor = null;
        this.targetActor = null;
        this.turnTime = 0;
        this.turnIndex = 0;
        this.stepProgress = 0;
        this.exitTo = null;
        this.turnEncBallbacks = [];
        this.focusAtObj3d = new Object3D();

        let stateTransition = function() {
            activateStateTransition(this)
        }.bind(this)

        this.call = {
            stateTransition:stateTransition
        }

    }

    setGameActor(actor) {
        this.actor = actor;
        MATH.emptyArray(this.turnEncBallbacks);
    }

    getGameActor() {
        return this.actor;
    }

    setTargetActor(actor) {
        this.targetActor = actor;
    }

    getTargetActor() {
        return this.targetActor;
    }

    startActorTurn(turnEndCallback, turnIndex) {
        this.turnEncBallbacks.push(turnEndCallback);
        this.turnTime = 0;
        this.turnIndex = turnIndex;
        this.exitTo = turnStateKeys.turn_init
        let camHome = GameAPI.call.getActiveEncounter().getEncounterCameraHomePosition()
        evt.dispatch(ENUMS.Event.SET_CAMERA_MODE, {mode:'actor_turn_movement', obj3d:this.actor.getObj3d(), camPos:camHome})
        activateStateTransition(this)
    }

    advanceSequenceTime(timeProgress) {
        this.stepProgress += timeProgress;
    }

    getSequenceTime() {
        return this.stepProgress;
    }

    exitSequence() {
        MATH.emptyArray(this.turnEncBallbacks);
        cancelTurnProcess()
    }

}

export { ActorTurnSequencer }