

class ControlFunctions {
    constructor() {
    }
    CONTROL_PITCH(value, actor) {
        let tpf = GameAPI.getFrame().tpf;
        actor.actorObj3d.rotateX(value*tpf)
    }
    CONTROL_ROLL(value, actor) {
        let tpf = GameAPI.getFrame().tpf;
        actor.actorObj3d.rotateZ(value*tpf)
    }

    CONTROL_YAW(value, actor) {
        let tpf = GameAPI.getFrame().tpf;
        actor.actorObj3d.rotateY(value*tpf)
    }

    CONTROL_THROTTLE(value, actor) {
        let forward = actor.getForward();
        forward.multiplyScalar(value);
        actor.setVelocity(forward)
    }
}



export {
    ControlFunctions
}
