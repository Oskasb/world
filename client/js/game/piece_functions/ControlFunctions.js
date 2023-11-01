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
    CONTROL_PITCH(value, actor) {
        let tpf = GameAPI.getFrame().tpf;
        let pitchAngle = MATH.horizonAttitudeFromQuaternion(actor.actorObj3d.quaternion)
        let pitch = actor.getStatus(ENUMS.ActorStatus.STATUS_PITCH) * (1.0-tpf*1.8);
        actor.actorObj3d.rotateX(MATH.curveQuad(pitch)*0.14)

        actor.setStatusKey(ENUMS.ActorStatus.STATUS_ANGLE_PITCH, pitchAngle)
        actor.setStatusKey(ENUMS.ActorStatus.STATUS_PITCH, pitch + value*tpf)
    }
    CONTROL_ROLL(value, actor) {
        let tpf = GameAPI.getFrame().tpf;

        let rollAngle = MATH.rollAttitudeFromQuaternion(actor.actorObj3d.quaternion);
        let roll = actor.getStatus(ENUMS.ActorStatus.STATUS_ROLL) * (1.0-tpf*1.2) * (1.0 );
        actor.actorObj3d.rotateZ(MATH.curveQuad(roll)*0.25)

        actor.setStatusKey(ENUMS.ActorStatus.STATUS_ANGLE_ROLL, rollAngle)
        actor.setStatusKey(ENUMS.ActorStatus.STATUS_ROLL, roll + value*tpf)
    }

    CONTROL_YAW(value, actor) {
        let tpf = GameAPI.getFrame().tpf;
        let forwardVec = actor.getForward();
        let yawAngle = MATH.vectorXZToAngleAxisY(forwardVec)
        yawAngle = MATH.eulerFromQuaternion(actor.actorObj3d.quaternion).y;
        let yaw = actor.getStatus(ENUMS.ActorStatus.STATUS_YAW) * (1.0-tpf*2);
        actor.actorObj3d.rotateY(MATH.curveQuad(yaw)*0.12)
        actor.setStatusKey(ENUMS.ActorStatus.STATUS_ANGLE_YAW, yawAngle)

        let compassHeading = yawAngle

        actor.setStatusKey(ENUMS.ActorStatus.STATUS_ANGLE_NORTH, MATH.angleInsideCircle(compassHeading -Math.PI))
        actor.setStatusKey(ENUMS.ActorStatus.STATUS_ANGLE_EAST, MATH.angleInsideCircle(compassHeading - MATH.HALF_PI))
        actor.setStatusKey(ENUMS.ActorStatus.STATUS_ANGLE_SOUTH, MATH.angleInsideCircle(compassHeading))
        actor.setStatusKey(ENUMS.ActorStatus.STATUS_ANGLE_WEST, MATH.angleInsideCircle(compassHeading + MATH.HALF_PI))

        actor.setStatusKey(ENUMS.ActorStatus.STATUS_YAW, yaw + value*tpf)
    }

    CONTROL_THROTTLE(value, actor) {

        let tpf = GameAPI.getFrame().tpf;
        let forward = actor.getStatus(ENUMS.ActorStatus.STATUS_FORWARD) * (1.0-tpf*0.02);
        actor.setStatusKey(ENUMS.ActorStatus.STATUS_FORWARD, MATH.clamp(forward + value*tpf, -1.0, 1.0))
        actor.setStatusKey(ENUMS.ActorStatus.STATUS_SPEED, forward)
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
}



export {
    ControlFunctions
}
