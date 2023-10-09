
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

    function turnMove(actor, turnIndex, onCompletedCB) {

        actor.activateWalkGrid();
        let targetPos;

        if (turnIndex === 0) {
            targetPos = actor.getGameWalkGrid().getTargetPosition()
        } else {
            targetPos = actor.getActorGridMovementTargetPosition()
        }

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
        GameAPI.unregisterGameUpdateCallback(updateActorClose)
        initTime = 0;
        initActor = null;
        initCompletedCB = null;
    }

export {
    turnInit,
    turnMove,
    turnClose,
    cancelTurnProcess
}