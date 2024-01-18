import {ENUMS} from "../../../client/js/application/ENUMS.js";
import {MATH} from "../../../client/js/application/MATH.js";
import {Object3D} from "../../../client/libs/three/core/Object3D.js";
import {
    getRandomWalkableTiles,
    registerGameServerUpdateCallback,
    unregisterGameServerUpdateCallback
} from "../utils/GameServerFunctions.js";
import {faceTowardsPos, getDestination, getStatusPosition, setDestination} from "./ActorStatusFunctions.js";
import {selectActorEncounterTarget} from "../encounter/ServerEncounterFunctions.js";

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

        let actorTurnSequencer = null;
        let sequencer = this;

        function turnInit(actor, turnIndex) {
        //    console.log("turnInit", turnIndex)
            let serverEncounter = sequencer.serverEncounter;
            registerGameServerUpdateCallback(updateActorInit)
        }

        function turnTileSelect(actor, turnIndex) {
         //   console.log("turnTileSelect", turnIndex)
            actor.setStatusKey(ENUMS.ActorStatus.TURN_STATE, ENUMS.TurnState.TILE_SELECT)
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
        //    console.log("turnMove", turnIndex)
            actor.setStatusKey(ENUMS.ActorStatus.TURN_STATE, ENUMS.TurnState.TURN_MOVE)
            registerGameServerUpdateCallback(updateActorTurnMove)
        }

        function turnTargetSelect(actor, turnIndex) {
        //    console.log("turnTargetSelect", turnIndex)
            let serverEncounter = sequencer.serverEncounter;
            actor.setStatusKey(ENUMS.ActorStatus.TURN_STATE, ENUMS.TurnState.TARGET_SELECT)

            registerGameServerUpdateCallback(updateActorTargetSelect)

        }

        function turnEvaluateTarget(actor, turnIndex) {
        //    console.log("turnEvaluateTarget", turnIndex)
            actor.setStatusKey(ENUMS.ActorStatus.TURN_STATE, ENUMS.TurnState.TARGET_EVALUATE)
            let serverEncounter = sequencer.serverEncounter;

            registerGameServerUpdateCallback(updateActorEvaluateTarget)
        }

        function turnSelectAttack(actor, turnIndex) {
        //    console.log("turnSelectAttack", turnIndex)
            actor.setStatusKey(ENUMS.ActorStatus.TURN_STATE, ENUMS.TurnState.ACTION_SELECT)
            let serverEncounter = sequencer.serverEncounter;

            registerGameServerUpdateCallback(updateActorSelectAttack)
        }

        function turnApplyAttack(actor, turnIndex) {
        //    console.log("turnApplyAttack", turnIndex)
            actor.setStatusKey(ENUMS.ActorStatus.TURN_STATE, ENUMS.TurnState.ACTION_APPLY)
            let serverEncounter = sequencer.serverEncounter;

            registerGameServerUpdateCallback(updateActorApplyAttack)

        }

        function turnClose(actor, turnIndex) {
        //    console.log("turnClose", turnIndex)
            actor.setStatusKey(ENUMS.ActorStatus.TURN_STATE, ENUMS.TurnState.TURN_CLOSE)
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
            MATH.callAndClearAll(sequencer.turnEncBallbacks, actor);
            cancelTurnProcess()
        }



        function updateActorInit(tpf) {
            let stepProgress = sequencer.getSequenceProgress()

            if (stepProgress > 1) {
                unregisterGameServerUpdateCallback(updateActorInit)
                sequencer.call.stateTransition()
            } else {
                sequencer.advanceSequenceProgress(tpf*2);
            }

        }

        function updateActorTileSelect(tpf) {

            let stepProgress = sequencer.getSequenceProgress()

            if (stepProgress > 1) {
                unregisterGameServerUpdateCallback(updateActorTileSelect)
                sequencer.call.stateTransition()
            } else {
                let actor = sequencer.actor;
                let tilePath = actor.tilePath;
                let serverEncounter = sequencer.serverEncounter;
                let pathTiles = tilePath.pathTiles;
                let pathPoints = actor.getStatus(ENUMS.ActorStatus.PATH_POINTS);

                if (stepProgress === 0) {
                    let serverGrid = serverEncounter.serverGrid;
                    let gridTiles = serverGrid.gridTiles;
                    let destinationPos = getDestination(actor)
                    let destinationTile = serverGrid.getTileByPos(destinationPos);
                    let startTile = serverGrid.getTileByPos(getStatusPosition(actor));
                //    console.log("From To: ", startTile, destinationTile);
                    serverGrid.selectTilesBeneathPath(startTile, destinationTile, gridTiles, tilePath);
                    actor.serverActorPathWalker.setPathPoints(pathPoints);
                }


                let tileCount = pathTiles.length;



                while (pathPoints.length) {
                    pathPoints.pop()
                }

                let drawTiles = Math.ceil(tileCount * stepProgress);

                for (let i = 0; i < drawTiles; i++) {
                    let gridPoint = pathTiles[i].gridPoint;
                    pathPoints.push(gridPoint.point);
                }
                //    console.log("Set path points: ", pathPoints, tilePath);
                serverEncounter.sendActorStatusUpdate(actor);
                sequencer.advanceSequenceProgress(tpf);
            }

        }

        function updateActorTurnMove(tpf) {
            let actor = sequencer.actor;

            if (actor.serverActorPathWalker.pathCompletedCallbacks.length === 0) {

                let pathCompletedCB = function() {
                    sequencer.call.stateTransition()
                    unregisterGameServerUpdateCallback(updateActorTurnMove)
                }

                let tileCount = actor.tilePath.pathTiles.length;
                if (!tileCount) {
                    pathCompletedCB()
                } else {
                    actor.serverActorPathWalker.pathCompletedCallbacks.push(pathCompletedCB)
                }

            } else {
                actor.serverActorPathWalker.walkPath(actor, tpf, sequencer.serverEncounter);
            }

        }

        function updateActorTargetSelect(tpf) {
            let actor = sequencer.actor;
            let stepProgress = sequencer.getSequenceProgress()
            if (stepProgress > 1) {
                unregisterGameServerUpdateCallback(updateActorTargetSelect)
                sequencer.call.stateTransition()
            } else {
                //    console.log("Updat Target Select", stepProgress, tpf, sequencer);

                let candidate = selectActorEncounterTarget(sequencer.serverEncounter, actor)
                if (candidate) {
                    if (actor.getStatus(ENUMS.ActorStatus.SELECTED_TARGET) !== candidate.getStatus(ENUMS.ActorStatus.ACTOR_ID)) {
                        let targetPos = getStatusPosition(candidate);
                        faceTowardsPos(actor, targetPos);
                        actor.setStatusKey(ENUMS.ActorStatus.SELECTED_TARGET, candidate.getStatus(ENUMS.ActorStatus.ACTOR_ID));
                        actor.selectedTarget = candidate;
                        sequencer.serverEncounter.sendActorStatusUpdate(actor);
                    }
                }

                sequencer.advanceSequenceProgress(tpf*0.7);
            }

        }


        function updateActorEvaluateTarget(tpf) {

            let stepProgress = sequencer.getSequenceProgress()

            if (stepProgress > 1) {
                unregisterGameServerUpdateCallback(updateActorEvaluateTarget)
                sequencer.call.stateTransition()
                tpf = 0;
            } else {
                sequencer.advanceSequenceProgress(tpf * 0.75);
            }

        }

        function updateActorSelectAttack(tpf) {

            let actor = sequencer.getGameActor()
            let actionId = actor.call.selectServerActorActionId();
            actor.serverAction.activateServerActionId(actionId, actor, actor.selectedTarget, sequencer.serverEncounter);
            actor.serverAction.onCompletedCallbacks.push(sequencer.call.stateTransition)
            sequencer.serverEncounter.sendActionStatusUpdate(actor.serverAction);
            unregisterGameServerUpdateCallback(updateActorSelectAttack)

        }


        function updateActorApplyAttack(tpf) {

            //   let actor = getSequencer().getGameActor()
            //   let target = getSequencer().getTargetActor();
            let stepProgress = sequencer.getSequenceProgress()

            //   let attack = getSequencer().selectedAttack;

            if (stepProgress > 1) {
                unregisterGameServerUpdateCallback(updateActorApplyAttack)
                //      attack.activateAttack(sequencer.call.stateTransition)
                sequencer.call.stateTransition()
            } else {
                sequencer.advanceSequenceProgress(tpf * 1.5);
            }

        }


        function updateActorClose(tpf) {
            let stepProgress = sequencer.getSequenceProgress()

            if (stepProgress > 1) {
                unregisterGameServerUpdateCallback(updateActorClose)
                sequencer.call.stateTransition()
            } else {
                sequencer.advanceSequenceProgress(tpf*1.2);
            }

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

        let activateStateTransition = function() {
            sequencer.stepProgress = 0;
            let actor = sequencer.actor;
            let isDead = actor.getStatus(ENUMS.ActorStatus.DEAD);
            if (isDead) {
                console.log("Actor is Dead, closing sequencer")
                sequencer.exitTo = turnStateKeys.turn_closed;
            }

            let turnStateKey = sequencer.exitTo;
            if (!turnStateMap[turnStateKey]) {
                console.log("undefined turnState", turnStateKey, sequencer);
                turnStateKey = turnStateKeys.turn_init;
            }
            let enter = turnStateMap[turnStateKey].enter;
            sequencer.exitTo  = turnStateMap[turnStateKey].exitTo;
            let turnIndex = sequencer.serverEncounter.getStatus(ENUMS.EncounterStatus.TURN_INDEX)
            enter(sequencer.actor, turnIndex)
        }


        let stateTransition = function() {
            activateStateTransition()
        }.bind(this)

        this.call = {
            stateTransition:stateTransition,
            cancelTurnProcess:cancelTurnProcess
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

    startNpcActorTurn(turnEndCallback, serverEncounter) {
        this.serverEncounter = serverEncounter;
        this.turnEncBallbacks.push(turnEndCallback);
        this.turnTime = 0;
        this.exitTo = turnStateKeys.turn_init
        this.call.stateTransition()
    }

    advanceSequenceProgress(timeProgress) {
        this.stepProgress += timeProgress;
    }

    getSequenceProgress() {
        return this.stepProgress;
    }

    exitSequence() {
        MATH.emptyArray(this.turnEncBallbacks);
        this.call.cancelTurnProcess()
    }

}

export { ServerActorTurnSequencer }