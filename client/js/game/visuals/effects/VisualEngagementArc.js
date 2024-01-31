import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {Object3D} from "../../../../libs/three/core/Object3D.js";
import {poolFetch, poolReturn} from "../../../application/utils/PoolUtils.js";
import {colorMapFx} from "../Colors.js";

let fromVec = new Vector3();
let toVec = new Vector3();

let offsetVec = new Vector3()
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

function drawPathPoints(from, to, pathPoints, gameTime, actor) {
    let distance = MATH.distanceBetween(from, to);
    fromVec.copy(from);
    let points = Math.floor(distance*14)

    while (pathPoints.length > points) {
        let pointFX = pathPoints.pop();
        pointFX.recoverPointFx();
        poolReturn(pointFX);
    }

    while (pathPoints.length < points) {
        let pointFx = poolFetch('VisualPointFX')
        pointFx.setupPointFX(5, 6, 0.2);
        pathPoints.push(pointFx);
    }

    let alignment = actor.getStatus(ENUMS.ActorStatus.ALIGNMENT);

    let rgba = colorMapFx[alignment]

    let remainder = MATH.remainder(gameTime*3);

    deltaVec.copy(to);
    deltaVec.sub(from);
    deltaVec.multiplyScalar(1 / points);

    offsetVec.copy(deltaVec);
    offsetVec.multiplyScalar(remainder);

 //   fromVec.addVectors(from, offsetVec);
 //   toVec.addVectors(from, offsetVec);

    fromVec.copy(from);
    toVec.copy(from);

    for (let i = 0; i < pathPoints.length; i++) {
        let fraction = MATH.calcFraction( 0, points+1, i+0.5)
        toVec.add(deltaVec);
        toVec.y += Math.cos(fraction * Math.PI) * 0.05 + Math.sin(gameTime*6+i*0.2)*Math.sin(fraction * 3.3) * 0.005;
        drawPathPoint(fromVec, toVec, rgba, pathPoints[i])
        fromVec.copy(toVec)
    }

}

class VisualEngagementArc {
    constructor() {
        this.pathPointsFX = []
        this.from = new Vector3();
        this.to = new Vector3()
        this.actor = null;
        this.statusKey = null;
        this.effectData = null;
        this.lastDestination = new Vector3();

        let update = function() {
            let gameTime = GameAPI.getGameTime();
            drawPathPoints(this.from, this.to, this.pathPointsFX, gameTime, this.actor)
        }.bind(this)


        this.call = {
            update:update
        }

    }

    on(statusKey, actor, effectData) {
    //    GuiAPI.screenText("LEAP ON", ENUMS.Message.HINT, 2)
        this.lastDestination.set(0, -999, 0)
        this.actor = actor;
        this.statusKey = statusKey;
        this.effectData = effectData;
        ThreeAPI.addPrerenderCallback(this.call.update);
    }

    off() {
        while (this.pathPointsFX.length) {
            let pointFX = this.pathPointsFX.pop();
            pointFX.recoverPointFx();
            poolReturn(pointFX);
        }
        poolReturn(this);
        ThreeAPI.unregisterPrerenderCallback(this.call.update);
    }

}

export {VisualEngagementArc}