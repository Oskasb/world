
let radiusEvent = {}
let green =  [0, 0.5, 0.0, 1]
let red =  [0.5, 0.0, 0.0, 1]

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

class EncounterTurnSequencer {
    constructor() {
        this.turnActorIndex = 0;
        this.actors = [];
        this.activeActor = null;
        this.turnIndex = 0;

        this.turnTime = 0;

        let movementEnded = function(actorObj3d) {
            this.turnTime = 0;
            this.activeActor = null;
            this.turnActorIndex++

            if (this.turnActorIndex === this.actors.length) {
                this.turnActorIndex = 0;
                this.turnIndex++
            }
            console.log("movementEnded", this.turnActorIndex, this.turnIndex)
        }.bind(this)

        this.call = {
            movementEnded:movementEnded
        }

    }

    addEncounterActor(actor) {
        this.actors.push(actor);
    }

    activateActorTurn() {
        this.activeActor.moveActorOnGridTo(this.activeActor.getGameWalkGrid().getTargetPosition(), this.call.movementEnded)
    }


    updateTurnSequencer() {

        let tpf = GameAPI.getFrame().tpf;

        let actor = this.actors[this.turnActorIndex];

        if (this.turnTime < 1) {
            indicateTurnInit(actor, this.turnTime)

            if (this.turnTime === 0) {
                console.log("updateTurnSequencer new actor", actor)
                let camHome = GameAPI.call.getActiveEncounter().getEncounterCameraHomePosition()
                evt.dispatch(ENUMS.Event.SET_CAMERA_MODE, {mode:'actor_turn_movement', obj3d:actor.getObj3d(), camPos:camHome})
            }

        } else {

            if (this.activeActor !== actor) {

                this.activeActor = actor;
                actor.activateWalkGrid();
                let targetPos;

                if (this.turnIndex === 0) {
                    targetPos = this.activeActor.getGameWalkGrid().getTargetPosition()
                } else {
                    targetPos = actor.getActorGridMovementTargetPosition()
                }

                this.activeActor.moveActorOnGridTo(targetPos, this.call.movementEnded)
            }
        }

        this.turnTime += tpf;

    }



}

export { EncounterTurnSequencer }