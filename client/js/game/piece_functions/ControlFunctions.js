import {Vector3} from "../../../libs/three/math/Vector3.js";
import {Object3D} from "../../../libs/three/core/Object3D.js";

let calcVec = new Vector3()
let calcVec2 = new Vector3()
let worldForward = new Vector3(0, 0, 1);
let worldUp = new Vector3(0, 1, 0);
let worldLeft = new Vector3(1, 0, 0);
let tempObj = new Object3D();

class ControlFunctions {
    constructor() {
    }

    SAMPLE_STATUS(value, actor) {
        let tpf = GameAPI.getFrame().avgTpf;
        let pitchAngle = MATH.horizonAttitudeFromQuaternion(actor.actorObj3d.quaternion)
        actor.setStatusKey(ENUMS.ActorStatus.STATUS_ANGLE_PITCH, pitchAngle)

        let rollAngle = MATH.rollAttitudeFromQuaternion(actor.actorObj3d.quaternion);
        actor.setStatusKey(ENUMS.ActorStatus.STATUS_ANGLE_ROLL, rollAngle)

        let yawAngle = MATH.eulerFromQuaternion(actor.actorObj3d.quaternion).y;
        actor.setStatusKey(ENUMS.ActorStatus.STATUS_ANGLE_YAW, yawAngle)

        let compassHeading = yawAngle

        actor.setStatusKey(ENUMS.ActorStatus.STATUS_ANGLE_NORTH, MATH.angleInsideCircle(compassHeading -Math.PI))
        actor.setStatusKey(ENUMS.ActorStatus.STATUS_ANGLE_EAST, MATH.angleInsideCircle(compassHeading - MATH.HALF_PI))
        actor.setStatusKey(ENUMS.ActorStatus.STATUS_ANGLE_SOUTH, MATH.angleInsideCircle(compassHeading))
        actor.setStatusKey(ENUMS.ActorStatus.STATUS_ANGLE_WEST, MATH.angleInsideCircle(compassHeading + MATH.HALF_PI))

        let forward = actor.getStatus(ENUMS.ActorStatus.STATUS_FORWARD);
        actor.setStatusKey(ENUMS.ActorStatus.STATUS_SPEED, forward / tpf);
        let forwardVec = actor.getForward();
        forwardVec.multiplyScalar(forward);
        actor.setVelocity(forwardVec)

        let elevation = actor.getPos().y;
        let range = 40;
        actor.setStatusKey(ENUMS.ActorStatus.STATUS_CLIMB_0, MATH.wrapValue(range, elevation+range*0.4)/range)
        actor.setStatusKey(ENUMS.ActorStatus.STATUS_CLIMB_1, MATH.wrapValue(range, elevation+range*0.2)/range)
        actor.setStatusKey(ENUMS.ActorStatus.STATUS_CLIMB_2, MATH.wrapValue(range,       elevation)/range)
        actor.setStatusKey(ENUMS.ActorStatus.STATUS_CLIMB_3, MATH.wrapValue(range, elevation-range*0.2)/range)
        actor.setStatusKey(ENUMS.ActorStatus.STATUS_CLIMB_4, MATH.wrapValue(range, elevation-range*0.4)/range)
        actor.setStatusKey(ENUMS.ActorStatus.STATUS_CLIMB_RATE, forwardVec.y);
        actor.setStatusKey(ENUMS.ActorStatus.STATUS_ELEVATION, elevation);

    }
    CONTROL_PITCH(value, actor) {
        let tpf = GameAPI.getFrame().avgTpf;
        let pitch = actor.getStatus(ENUMS.ActorStatus.STATUS_PITCH) * (1.0-tpf*1.8);
        let pitchAxis = actor.getStatus(ENUMS.ActorStatus.STATUS_ANGLE_PITCH);
        actor.actorObj3d.rotateX(MATH.curveQuad(pitch)*0.14)
        actor.setStatusKey(ENUMS.ActorStatus.STATUS_PITCH, pitch + value*tpf - (0.25*pitchAxis*tpf*(1-Math.abs(value))))
    }

    CONTROL_ROLL(value, actor) {
        let tpf = GameAPI.getFrame().avgTpf;
        let roll = actor.getStatus(ENUMS.ActorStatus.STATUS_ROLL) * (1.0-tpf*1.2) * (1.0 );
        let rollAxis = actor.getStatus(ENUMS.ActorStatus.STATUS_ANGLE_ROLL);
        actor.actorObj3d.rotateZ(MATH.curveQuad(roll)*0.25)
        actor.setStatusKey(ENUMS.ActorStatus.STATUS_ROLL, roll + value*tpf - (0.25*rollAxis*tpf*(1-Math.abs(value))))
    }

    CONTROL_YAW(value, actor) {
        let tpf = GameAPI.getFrame().avgTpf;
        let yaw = actor.getStatus(ENUMS.ActorStatus.STATUS_YAW) * (1.0-tpf*2);
        actor.actorObj3d.rotateY(MATH.curveQuad(yaw)*0.12)
        actor.setStatusKey(ENUMS.ActorStatus.STATUS_YAW, yaw + value*tpf)
    }


    CONTROL_SPEED(value, actor) {
        let tpf = GameAPI.getFrame().avgTpf;
        let forward = actor.getStatus(ENUMS.ActorStatus.STATUS_FORWARD);
        actor.setStatusKey(ENUMS.ActorStatus.STATUS_FORWARD, MATH.clamp(forward + value*tpf, -1.0, 1.0))
    }

}



export {
    ControlFunctions
}
