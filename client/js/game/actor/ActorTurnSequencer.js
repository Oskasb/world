import {turnClose, turnInit, turnMove, cancelTurnProcess, turnTileSelect} from "./TurnStateUtils.js";


let turnStateKeys = {
    turn_init:'turn_init',
    turn_tile_select:'turn_tile_select',
    turn_move:'turn_move',
    turn_close:'turn_close'
}

let turnStateMap = {}
turnStateMap[turnStateKeys.turn_init] = turnInit;
turnStateMap[turnStateKeys.turn_tile_select] = turnTileSelect;
turnStateMap[turnStateKeys.turn_move] = turnMove;
turnStateMap[turnStateKeys.turn_close] = turnClose;


class ActorTurnSequencer {
    constructor() {

        this.actor = null;
        this.turnTime = 0;
        this.turnIndex = 0;
        this.turnEncBallbacks = [];
        this.currentTurnStateKey = null;

        let turnInitEnded = function() {
            this.currentTurnStateKey = turnStateKeys.turn_tile_select
            turnStateMap[this.currentTurnStateKey](this.actor, this.turnIndex, this.call.tileSelectEnded)
        }.bind(this)

        let tileSelectEnded = function() {
            this.currentTurnStateKey = turnStateKeys.turn_move
            turnStateMap[this.currentTurnStateKey](this.actor, this.turnIndex, this.call.movementEnded)
        }.bind(this)

        let movementEnded = function() {
            this.currentTurnStateKey = turnStateKeys.turn_close
            turnStateMap[this.currentTurnStateKey](this.actor, this.turnIndex, this.call.turnCloseEnded)
        }.bind(this)

        let turnCloseEnded = function() {
            MATH.callAndClearAll(this.turnEncBallbacks, this.actor);
        }.bind(this)


        this.call = {
            turnInitEnded:turnInitEnded,
            tileSelectEnded:tileSelectEnded,
            movementEnded:movementEnded,
            turnCloseEnded:turnCloseEnded
        }

    }

    setGameActor(actor) {
        this.actor = actor;
        MATH.emptyArray(this.turnEncBallbacks);
    }

    startActorTurn(turnEndCallback, turnIndex) {
        this.turnEncBallbacks.push(turnEndCallback);
        this.turnTime = 0;
        this.turnIndex = turnIndex;
        this.currentTurnStateKey = turnStateKeys.turn_init;
        let camHome = GameAPI.call.getActiveEncounter().getEncounterCameraHomePosition()
        evt.dispatch(ENUMS.Event.SET_CAMERA_MODE, {mode:'actor_turn_movement', obj3d:this.actor.getObj3d(), camPos:camHome})
        turnStateMap[this.currentTurnStateKey](this.actor, this.turnIndex, this.call.turnInitEnded)
    }

    exitSequence() {
        MATH.emptyArray(this.turnEncBallbacks);
        cancelTurnProcess()
    }

}

export { ActorTurnSequencer }