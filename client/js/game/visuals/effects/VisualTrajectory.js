import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {Object3D} from "../../../../libs/three/core/Object3D.js";
import {poolFetch, poolReturn} from "../../../application/utils/PoolUtils.js";
import {transitionEffectOn, transitionEffectOff} from "./VisualTriggerFx.js";
import {colorMapFx} from "../Colors.js";

let fromVec = new Vector3();
let toVec = new Vector3();

let tempVec = new Vector3();
let deltaVec = new Vector3();
let tempVec2 = new Vector3();
let tempObj = new Object3D();

function drawPathPoint(from, to, rgba, pointFx) {
    //    console.log("Draw Points", from, to, index)
    tempObj.position.copy(from);
    //    tempObj.position.y = to.y;
    tempObj.lookAt(to);
    tempVec.set(0, 0, MATH.distanceBetween(from, to) * 0.5);

    tempVec.applyQuaternion(tempObj.quaternion);
    tempObj.rotateX(-MATH.HALF_PI)
    tempVec.add(from)
    pointFx.updatePointFX(tempVec, tempObj.quaternion, rgba);
}

function drawPathPoints(from, to, distance, pathPoints) {
    fromVec.copy(from);

    let points = Math.floor(distance*1.5)

    while (pathPoints.length > points) {
        let pointFX = pathPoints.pop();
        pointFX.recoverPointFx();
        poolReturn(pointFX);
    }

    while (pathPoints.length < points) {
        let pointFx = poolFetch('VisualPointFX')
        pointFx.setupPointFX();
        pathPoints.push(pointFx);
    }

    let rgba = colorMapFx['PATH_POINT']

    deltaVec.copy(to);
    deltaVec.sub(from);
    deltaVec.multiplyScalar(1 / points);
    toVec.copy(from);

    for (let i = 0; i < pathPoints.length; i++) {
        let fraction = MATH.calcFraction(0, points+1, i+0.5)
        toVec.add(deltaVec);
        toVec.y += Math.cos(fraction * Math.PI) * (MATH.curveSqrt(distance*50) * 0.012 +0.1);
        drawPathPoint(fromVec, toVec, rgba, pathPoints[i])
        fromVec.copy(toVec)
    }

}

class VisualTrajectory {
    constructor() {
        this.pathPointsFX = []
        this.actor = null;
        this.statusKey = null;
        this.effectData = null;
        this.lastDestination = new Vector3();

        let update = function() {

            this.actor.getDestination(tempVec);
            let distance = MATH.distanceBetween(tempVec, this.actor.getSpatialPosition(ThreeAPI.tempVec3c))
            let velocity = this.actor.getSpatialVelocity();
            if (distance > 0.9 && velocity.lengthSq() === 0) {
                let moveDist = MATH.distanceBetween(this.lastDestination, tempVec);
                if (moveDist > 0.9) {
                    transitionEffectOn(tempVec, this.effectData)
                    drawPathPoints(this.actor.getSpatialPosition(ThreeAPI.tempVec3c), tempVec, distance, this.pathPointsFX);
                    this.lastDestination.copy(tempVec);
                }
            } else {
                while (this.pathPointsFX.length) {
                    let pointFX = this.pathPointsFX.pop();
                    pointFX.recoverPointFx();
                    poolReturn(pointFX);
                }
            }


        }.bind(this)


        this.call = {
            update:update
        }

    }
    on(statusKey, actor, effectData) {
    //    GuiAPI.screenText("LEAP ON", ENUMS.Message.HINT, 2)
        this.actor = actor;
        this.statusKey = statusKey;
        this.effectData = effectData;
        transitionEffectOn(actor.getSpatialPosition(), effectData);
        ThreeAPI.addPostrenderCallback(this.call.update);
    }

    off() {
    //    GuiAPI.screenText("LEAP OFF", ENUMS.Message.HINT, 2)
        transitionEffectOff(this.actor.getSpatialPosition(), this.effectData);
        while (this.pathPointsFX.length) {
            let pointFX = this.pathPointsFX.pop();
            pointFX.recoverPointFx();
            poolReturn(pointFX);
        }
        ThreeAPI.unregisterPostrenderCallback(this.call.update)
    }

}

export {VisualTrajectory}