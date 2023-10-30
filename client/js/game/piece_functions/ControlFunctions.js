

class ControlFunctions {
    constructor() {
    }
    CONTROL_PITCH(value, actor) {
        let tpf = GameAPI.getFrame().tpf;
       let pitch = actor.getStatus(ENUMS.ActorStatus.STATUS_PITCH) * (1.0-tpf*5);
        actor.actorObj3d.rotateX(pitch)
        actor.setStatusKey(ENUMS.ActorStatus.STATUS_PITCH, pitch + value*tpf)
    }
    CONTROL_ROLL(value, actor) {
        let tpf = GameAPI.getFrame().tpf;
        let roll = actor.getStatus(ENUMS.ActorStatus.STATUS_ROLL) * (1.0-tpf*5);
        actor.actorObj3d.rotateZ(roll)
        actor.setStatusKey(ENUMS.ActorStatus.STATUS_ROLL, roll + value*tpf)
    }

    CONTROL_YAW(value, actor) {
        let tpf = GameAPI.getFrame().tpf;
        let yaw = actor.getStatus(ENUMS.ActorStatus.STATUS_YAW) * (1.0-tpf*5);
        actor.actorObj3d.rotateY(yaw)
        actor.setStatusKey(ENUMS.ActorStatus.STATUS_YAW, yaw + value*tpf)
    }

    CONTROL_THROTTLE(value, actor) {

        let tpf = GameAPI.getFrame().tpf;
        let forward = actor.getStatus(ENUMS.ActorStatus.STATUS_FORWARD) * (1.0-tpf*0.1);
        actor.setStatusKey(ENUMS.ActorStatus.STATUS_FORWARD, MATH.clamp(forward + value*tpf, -1.0, 1.0))

        let forwardVec = actor.getForward();
        forwardVec.multiplyScalar(forward);
        actor.setVelocity(forwardVec)
    }
}



export {
    ControlFunctions
}
