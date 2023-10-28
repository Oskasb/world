

class ControlFunctions {
    constructor() {
    }
    CONTROL_PITCH(value, actor) {
        actor.actorObj3d.rotateX(value)
    }
    CONTROL_ROLL(value, actor) {
        actor.actorObj3d.rotateZ(value)
    }

    CONTROL_YAW(value, actor) {
        actor.actorObj3d.rotateY(value)
    }

    CONTROL_THROTTLE(value, actor) {

    }
}



export {
    ControlFunctions
}
