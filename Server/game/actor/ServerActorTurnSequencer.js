import {ENUMS} from "../../../client/js/application/ENUMS.js";
import {MATH} from "../../../client/js/application/MATH.js";
import {
    turnClose,
    turnInit,
    turnMove,
    cancelTurnProcess,
    turnTileSelect,
    turnTargetSelect,
    turnEvaluateTarget,
    turnSelectAttack,
    turnApplyAttack,
    turnClosed
} from "./TurnStateUtils.js";
import {Object3D} from "../../../client/libs/three/core/Object3D.js";

let turnStateKeys = {
    turn_init:'turn_init',
    turn_tile_select:'turn_tile_select',
    turn_move:'turn_move',
    turn_target_select:'turn_target_select',
    turn_evaluate_target:'turn_attack_target',
    turn_select_attack:'turn_select_attack',
    turn_apply_attack:'turn_apply_attack',
    turn_close:'turn_close',
    turn_closed:'turn_closed'
}

let turnStateMap = {}
turnStateMap[turnStateKeys.turn_init] = {enter: turnInit, exitTo:turnStateKeys.turn_tile_select};
turnStateMap[turnStateKeys.turn_tile_select] = {enter: turnTileSelect, exitTo:turnStateKeys.turn_move};

turnStateMap[turnStateKeys.turn_move] = {enter: turnMove, exitTo:turnStateKeys.turn_target_select};

turnStateMap[turnStateKeys.turn_target_select] = {enter: turnTargetSelect, exitTo:turnStateKeys.turn_evaluate_target};

turnStateMap[turnStateKeys.turn_evaluate_target] = {enter: turnEvaluateTarget, exitTo:turnStateKeys.turn_select_attack};
turnStateMap[turnStateKeys.turn_select_attack] = {enter: turnSelectAttack, exitTo:turnStateKeys.turn_apply_attack};
turnStateMap[turnStateKeys.turn_apply_attack] = {enter: turnApplyAttack, exitTo:turnStateKeys.turn_close};

turnStateMap[turnStateKeys.turn_close] = {enter: turnClose, exitTo:turnStateKeys.turn_closed};
turnStateMap[turnStateKeys.turn_closed] = {enter: turnClosed, exitTo:null};

let activateStateTransition = function(sequencer) {
    sequencer.stepProgress = 0;
    let turnStateKey = sequencer.exitTo;
    let enter = turnStateMap[turnStateKey].enter;
    sequencer.exitTo  = turnStateMap[turnStateKey].exitTo;
    enter(sequencer.actor, sequencer.turnIndex)
}

class ServerActorTurnSequencer {
    constructor() {

        this.actor = null;
        this.selectedAttack = null;
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
        actor.setStatusKey(ENUMS.ActorStatus.HAS_TURN, false)
        actor.setStatusKey(ENUMS.ActorStatus.TURN_DONE, -1)
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
        this.actor.setStatusKey(ENUMS.ActorStatus.TURN_DONE, this.turnIndex)
        this.exitTo = turnStateKeys.turn_init
        activateStateTransition(this)
    }

    advanceSequenceProgress(timeProgress) {
        this.stepProgress += timeProgress;
    }

    getSequenceProgress() {
        return this.stepProgress;
    }

    exitSequence() {
        MATH.emptyArray(this.turnEncBallbacks);
        cancelTurnProcess()
    }

}

export { ServerActorTurnSequencer }