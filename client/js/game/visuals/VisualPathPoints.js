import {Vector3} from "../../../libs/three/math/Vector3.js";
import {Object3D} from "../../../libs/three/core/Object3D.js";
import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";
import {colorMapFx} from "./Colors.js";

let fromVec = new Vector3();
let toVec = new Vector3();

let tempVec = new Vector3();
let tempVec2 = new Vector3();
let tempObj = new Object3D();
class VisualPathPoints {
    constructor() {
        this.pathPointsFX = []
    }


    drawPathPoint(from, to, rgba, index) {
        let pointFx = this.pathPointsFX[index];
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


    updatePathPoints(actor, pathPoints) {

        while (this.pathPointsFX.length > pathPoints.length) {
            let pointFX = this.pathPointsFX.pop();
            pointFX.recoverPointFx();
            poolReturn(pointFX);
        }

        while (this.pathPointsFX.length < pathPoints.length) {
            let pointFx = poolFetch('VisualPointFX')
            pointFx.setupPointFX();
            this.pathPointsFX.push(pointFx);
        }

        // let rgba = colorMapFx[actor.getStatus(ENUMS.ActorStatus.ALIGNMENT)]

        let rgba = colorMapFx['PATH_POINT']

        for (let i = 1; i < pathPoints.length; i++) {
            let pointFrom = pathPoints[i-1]
            fromVec.x = pointFrom[0];
            fromVec.y = pointFrom[1] +0.2;
            fromVec.z = pointFrom[2];

            let point = pathPoints[i]
            toVec.x = point[0];
            toVec.y = point[1] +0.2;
            toVec.z = point[2];
            this.drawPathPoint(fromVec, toVec, rgba, i)

        }
    //    console.log("Draw Points", pathPoints)

    }





}

export {VisualPathPoints}