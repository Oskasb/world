import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {Object3D} from "../../../../libs/three/core/Object3D.js";
import {poolFetch, poolReturn} from "../../../application/utils/PoolUtils.js";
import {transitionEffectOn, transitionEffectOff} from "./VisualTriggerFx.js";
import {colorMapFx} from "../Colors.js";
import {getStatusPosition} from "../../../../../Server/game/actor/ActorStatusFunctions.js";

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
        toVec.y += Math.cos(fraction * Math.PI) * (MATH.curveSqrt(distance*30) * 0.032 +0.1);
        drawPathPoint(fromVec, toVec, rgba, pathPoints[i])
        fromVec.copy(toVec)
    }

}

class VisualEngagementIndicator {
    constructor() {
        this.pathPointsFX = []
        this.actor = null;
        this.statusKey = null;
        this.effectData = null;
        this.lastDestination = new Vector3();

        let engagementArcs = [];

        let update = function() {

            let engagements = this.actor.getStatus(ENUMS.ActorStatus.ENGAGED_TARGETS);
            let origin = getStatusPosition(this.actor)


            tempVec2.y += 0.1;

            for (let i = 0; i < engagements.length; i++) {
                if (!engagementArcs[i]) {
                    engagementArcs[i] = poolFetch('VisualEngagementArc')
                    engagementArcs[i].on(this.statusKey, this.actor, this.effectData)
                }
                let target = GameAPI.getActorById(engagements[i]);
                let tPos = getStatusPosition(target);
                tempVec2.copy(tPos);
                tempVec2.sub(origin);
                tempVec2.y = 0;
                let dist = tempVec2.length();
                tempVec2.normalize();
                tempObj.lookAt(tempVec2);
                tempVec2.multiplyScalar(0.5*dist)
                tempObj.rotateY(0.4);
                tempVec.set(0.03, 0, 0.35*dist)
                tempVec.applyQuaternion(tempObj.quaternion);

            //    tempVec2.add(origin);
            //    tempVec2.y = origin.y;
                engagementArcs[i].from.copy(origin);
                engagementArcs[i].from.add(tempVec);
                engagementArcs[i].to.copy(engagementArcs[i].from);
                engagementArcs[i].to.add(tempVec2);
                engagementArcs[i].to.y = tPos.y;

                engagementArcs[i].call.update();
            }

            while (engagementArcs.length > engagements.length) {
                let arc = engagementArcs.pop()
                arc.off();
                poolReturn(arc);
            }

        }.bind(this)


        let close = function() {
            while (engagementArcs.length) {
                let arc = engagementArcs.pop()
                arc.off();
                poolReturn(arc);
            }
        }

        this.call = {
            update:update,
            close:close
        }

    }
    on(statusKey, actor, effectData) {
    //    GuiAPI.screenText("LEAP ON", ENUMS.Message.HINT, 2)
        this.lastDestination.set(0, -999, 0)
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
        this.call.close();
    }

}

export {VisualEngagementIndicator}