
let radiusEvent = {}
let green =  [0.2, 0.5, 0.2, 1]
let red =  [0.5, 0.2, 0.2, 1]

let indicateTurnInit = function(actor, timeProgress) {
    let radius = 0.15 + MATH.curveQuad(timeProgress)*0.65
    radiusEvent.heads = 1;
    radiusEvent.speed = 0.8 * MATH.curveQuad(timeProgress) + 0.25;
    radiusEvent.radius = radius;
    radiusEvent.pos = actor.getSpatialPosition()

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
    radiusEvent.pos = actor.getSpatialPosition()

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

export {
    indicateTurnInit,
    indicateTurnClose
}