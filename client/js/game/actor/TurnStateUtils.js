import {Vector3} from "../../../libs/three/math/Vector3.js";
import {Object3D} from "../../../libs/three/core/Object3D.js";

let tempObj3d = new Object3D();
let tempVec = new Vector3();
let radiusEvent = {}
let green =  [0.2, 0.5, 0.2, 1]
let red =  [0.5, 0.2, 0.2, 1]

let indicateTurnInit = function(actor, timeProgress) {
    let radius = 0.15 + MATH.curveQuad(timeProgress)*0.65
    radiusEvent.heads = 1;
    radiusEvent.speed = 0.8 * MATH.curveQuad(timeProgress) + 0.25;
    radiusEvent.radius = radius;
    radiusEvent.pos = actor.getPos()

    if (actor === GameAPI.getGamePieceSystem().getSelectedGameActor()) {
        radiusEvent.rgba = green;
    } else {
        radiusEvent.rgba = red;
    }

    radiusEvent.elevation = 1 - timeProgress * 1;
    evt.dispatch(ENUMS.Event.INDICATE_RADIUS, radiusEvent)
    radiusEvent.elevation = 0;
    evt.dispatch(ENUMS.Event.INDICATE_RADIUS, radiusEvent)
}

let indicateTurnClose = function(actor, timeProgress) {
    let radius = 0.15 + MATH.curveQuad(1 - timeProgress)*0.65
    radiusEvent.heads = 1;
    radiusEvent.speed = 0.8 * MATH.curveQuad(1 - timeProgress) + 0.25;
    radiusEvent.radius = radius;
    radiusEvent.pos = actor.getPos()

    if (actor === GameAPI.getGamePieceSystem().getSelectedGameActor()) {
        radiusEvent.rgba = green;
    } else {
        radiusEvent.rgba = red;
    }

    radiusEvent.elevation = timeProgress * 1;
    evt.dispatch(ENUMS.Event.INDICATE_RADIUS, radiusEvent)
    radiusEvent.elevation = 0;
    evt.dispatch(ENUMS.Event.INDICATE_RADIUS, radiusEvent)
}

let initTime = 0;
let initActor = null;
let initCompletedCB = null;
function updateActorInit(tpf) {
    indicateTurnInit(initActor, initTime)
    initTime += tpf;

    if (initTime > 1) {
        GameAPI.unregisterGameUpdateCallback(updateActorInit)
        initCompletedCB()
    }
}

function updateActorTileSelect(tpf) {
//    indicateTurnClose(initActor, initTime)
    tempVec.subVectors(initActor.getGameWalkGrid().getTargetPosition() , initActor.getPos() )
    initTime += tpf;
    tempVec.multiplyScalar(initTime);
    tempVec.add(initActor.getPos())

    initActor.prepareTilePath(tempVec)
    tempObj3d.position.copy(tempVec)
    if (initTime > 1) {
        GameAPI.unregisterGameUpdateCallback(updateActorTileSelect)
        initCompletedCB()
    }
}

function updateActorClose(tpf) {
    indicateTurnClose(initActor, initTime)
    initTime += tpf;

    if (initTime > 1) {
        GameAPI.unregisterGameUpdateCallback(updateActorClose)
        initCompletedCB()
    }
}



    function turnInit(actor, turnIndex, onCompletedCB) {

        initTime = 0;
        initActor = actor;
        initCompletedCB = onCompletedCB;

        GameAPI.registerGameUpdateCallback(updateActorInit)

    }

    function turnTileSelect(actor, turnIndex, onCompletedCB) {
        initTime = 0;
        actor.activateWalkGrid();
        initCompletedCB = onCompletedCB;
        let camHome = GameAPI.call.getActiveEncounter().getEncounterCameraHomePosition()
        tempObj3d.position.copy(actor.getObj3d().position)
        evt.dispatch(ENUMS.Event.SET_CAMERA_MODE, {mode:'actor_turn_movement', obj3d:tempObj3d, camPos:camHome})
        if (turnIndex === 0) {
        //    targetPos = actor.getGameWalkGrid().getTargetPosition()
        } else {
            let targetPos = actor.getActorGridMovementTargetPosition()
            actor.getGameWalkGrid().setTargetPosition(targetPos)
        }
        GameAPI.registerGameUpdateCallback(updateActorTileSelect)
    }

    function turnMove(actor, turnIndex, onCompletedCB) {
        let camHome = GameAPI.call.getActiveEncounter().getEncounterCameraHomePosition()
    //    evt.dispatch(ENUMS.Event.SET_CAMERA_MODE, {mode:'actor_turn_movement', obj3d:actor.getObj3d(), camPos:camHome})
        let targetPos = actor.getGameWalkGrid().getTargetPosition()
        actor.moveActorOnGridTo(targetPos, onCompletedCB)

    }

    function turnClose(actor, turnIndex, onCompletedCB) {
        initTime = 0;
        initActor = actor;
        initCompletedCB = onCompletedCB;

        GameAPI.registerGameUpdateCallback(updateActorClose)
    }

    function cancelTurnProcess() {
        GameAPI.unregisterGameUpdateCallback(updateActorInit)
        GameAPI.unregisterGameUpdateCallback(updateActorTileSelect)
        GameAPI.unregisterGameUpdateCallback(updateActorClose)
        initTime = 0;
        initActor = null;
        initCompletedCB = null;
    }

export {
    turnInit,
    turnTileSelect,
    turnMove,
    turnClose,
    cancelTurnProcess
}