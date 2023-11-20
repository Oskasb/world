import {Vector3} from "../../../libs/three/math/Vector3.js";
import {Object3D} from "../../../libs/three/core/Object3D.js";

class ControlFunctions {
    constructor() {}

    SAMPLE_STATUS(actor) {
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


        let actorSpeed = actor.getStatus(ENUMS.ActorStatus.ACTOR_SPEED);
        let forward = actor.getStatus(ENUMS.ActorStatus.STATUS_FORWARD);
        let frameSpeed = actorSpeed * forward * tpf;

        actor.setStatusKey(ENUMS.ActorStatus.STATUS_SPEED, frameSpeed / tpf);
        let forwardVec = actor.getForward();
    //    actor.lookDirection.copy(forwardVec);
        forwardVec.multiplyScalar(frameSpeed);
        actor.setVelocity(forwardVec)

        let elevation = actor.getPos().y;
        let range = 50;
        actor.setStatusKey(ENUMS.ActorStatus.STATUS_CLIMB_0, MATH.wrapValue(range, elevation+range*0.5)/range)
        actor.setStatusKey(ENUMS.ActorStatus.STATUS_CLIMB_1, MATH.wrapValue(range, elevation+range*0.3)/range)
        actor.setStatusKey(ENUMS.ActorStatus.STATUS_CLIMB_2, MATH.wrapValue(range, elevation+range*0.1)/range)
        actor.setStatusKey(ENUMS.ActorStatus.STATUS_CLIMB_3, MATH.wrapValue(range, elevation-range*0.1)/range)
        actor.setStatusKey(ENUMS.ActorStatus.STATUS_CLIMB_4, MATH.wrapValue(range, elevation-range*0.3)/range)
        actor.setStatusKey(ENUMS.ActorStatus.STATUS_CLIMB_RATE, forwardVec.y);
        actor.setStatusKey(ENUMS.ActorStatus.STATUS_ELEVATION, elevation);

    }
    CONTROL_PITCH(value, actor) {
        let tpf = GameAPI.getFrame().avgTpf;
        let pitch = actor.getStatus(ENUMS.ActorStatus.STATUS_PITCH) * (1.0-tpf*1.8);
        let pitchAxis = actor.getStatus(ENUMS.ActorStatus.STATUS_ANGLE_PITCH);
        actor.actorObj3d.rotateX(MATH.curveQuad(pitch)*0.14)
        let neutralize = 0;
        if (!value) {
            neutralize = (0.5*pitchAxis*tpf)
        }
        actor.setStatusKey(ENUMS.ActorStatus.STATUS_PITCH, pitch + value*tpf - neutralize)
    }

    CONTROL_ROLL(value, actor) {
        let tpf = GameAPI.getFrame().avgTpf;
        let roll = actor.getStatus(ENUMS.ActorStatus.STATUS_ROLL) * (1.0-tpf*1.2) * (1.0 );
        let rollAxis = actor.getStatus(ENUMS.ActorStatus.STATUS_ANGLE_ROLL);
        actor.actorObj3d.rotateZ(MATH.curveQuad(roll)*0.25)
        let neutralize = 0;
        if (!value) {
            neutralize = (0.5*rollAxis*tpf)
        }
        actor.setStatusKey(ENUMS.ActorStatus.STATUS_ROLL, roll + value*tpf - neutralize)
    }

    CONTROL_YAW(value, actor) {
        let tpf = GameAPI.getFrame().avgTpf;
        let yaw = actor.getStatus(ENUMS.ActorStatus.STATUS_YAW) * (1.0-tpf*2);
        let yawRate = actor.getStatus(ENUMS.ActorStatus.ACTOR_YAW_RATE);
        actor.actorObj3d.rotateY(MATH.curveQuad(yaw) * tpf * yawRate)
        actor.setStatusKey(ENUMS.ActorStatus.STATUS_YAW, yaw + value*tpf)
    }

    CONTROL_SPEED(value, actor) {
        let tpf = GameAPI.getFrame().avgTpf;
        let forward = actor.getStatus(ENUMS.ActorStatus.STATUS_FORWARD);
        actor.setStatusKey(ENUMS.ActorStatus.STATUS_FORWARD, MATH.clamp(forward + value*tpf, -1.0, 1.0))
    }

    CONTROL_TILE_X(value, actor) {
        if (value !== 0) {
            if (actor.getStatus(ENUMS.ActorStatus.SELECTING_DESTINATION)) {
                let walkGrid = actor.getGameWalkGrid();
                let tileSelector = walkGrid.gridTileSelector;
                tileSelector.moveAlongX(value*actor.getStatus(ENUMS.ActorStatus.MOVEMENT_SPEED));
            }
        }
    }

    CONTROL_TILE_Z(value, actor) {
        if (value !== 0) {
            if (actor.getStatus(ENUMS.ActorStatus.SELECTING_DESTINATION)) {
                let walkGrid = actor.getGameWalkGrid();
                let tileSelector = walkGrid.gridTileSelector;
                tileSelector.moveAlongZ(value*actor.getStatus(ENUMS.ActorStatus.MOVEMENT_SPEED));
            }
        }
    }

    CONTROL_MOVE_ACTION(value, actor) {
        if (value === 1) {
            actor.actorMovement.tileSelectionActive(actor);
        } else if (value === 2){
            actor.actorMovement.tileSelectionCompleted(actor);
        }
    }

    CONTROL_LEAP_ACTION(value, actor) {
        if (value === 1) {
            actor.actorMovement.leapSelectionActive(actor);
        } else if (value === 2){
            actor.actorMovement.leapSelectionCompleted(actor);
        }
    }

}



export {
    ControlFunctions
}
