import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {poolFetch} from "../../../application/utils/PoolUtils.js";
import {Object3D} from "../../../../libs/three/core/Object3D.js";
import {colorMapFx} from "../Colors.js";
import {physicalAlignYGoundTest} from "../../../application/utils/PhysicsUtils.js";

let tempVec = new Vector3();
let normalStore = new Vector3()
let tempObj = new Object3D();

class VisualDestinationPointer {
    constructor() {

        this.from = new Vector3();
        this.to = new Vector3()

        this.maxDistance = 40;

        this.fxPoints = [];

        this.rgba = colorMapFx['GLITTER_FX']

        this.recalcPoints = true;

        let update = function() {
        //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:this.from, to:this.to, color:'YELLOW'});

            if (this.recalcPoints === true) {

                while (this.fxPoints.length) {
                    let pointFX = this.fxPoints.pop();
                    pointFX.recoverPointFx();
                }
                this.recalcPoints = false;
                tempVec.copy(this.to);
                tempVec.y = this.from.y;
            //    console.log("recalcPoints Points",  this.from, this.to, tempVec)
                let distance = MATH.distanceBetween(this.from, tempVec);

            //    for (let i = 0; i < 2; i++) {
                    let pointFX = poolFetch('VisualPointFX')
                    pointFX.setupPointFX(5, 3, 1, true);
                    this.fxPoints.push(pointFX);
            //    }
                    pointFX = poolFetch('VisualPointFX')
                    pointFX.setupPointFX(5, 6, 1, true);
                    this.fxPoints.push(pointFX);

                tempObj.position.copy(this.from);
                tempObj.lookAt(tempVec);
                tempObj.rotateX(-1.57)
                tempVec.sub(this.from);
                let dstFactor = MATH.curveSqrt((distance + 1)/ this.maxDistance) + 0.1;
                tempVec.normalize();
                tempObj.position.x += tempVec.x *0.6;
                tempObj.position.z += tempVec.z *0.6;
                let rgba = this.rgba;

                let y = this.from.y + 0.15;

                //    console.log("Draw Points",  this.fxPoints.length)
                for (let i = 0; i < this.fxPoints.length; i++) {
                    let scale = 0.3;
                    if (i === 1) {
                        scale = 0.25/dstFactor;
                    //    y += 0.1;
                    }
                    let pointFX = this.fxPoints[i];
                    let fits = physicalAlignYGoundTest(tempObj.position, tempObj.position, 1.5)
                    if (fits === false) {
                        tempObj.position.y = y;
                        pointFX.updatePointFX(tempObj.position, tempObj.quaternion, colorMapFx['DAMAGE_FX'], scale)
                    } else {
                        tempObj.position.y = y; // Math.max(tempObj.position.y, 0.1);
                        pointFX.updatePointFX(tempObj.position, tempObj.quaternion, rgba, scale)
                    }
                //

                //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:tempObj.position, to:this.to, color:'YELLOW'});
                    tempVec.multiplyScalar(dstFactor*0.5);
                    tempObj.position.add(tempVec);
                }

            }


        }.bind(this)

        this.call = {
            update:update
        }

    }

    setRGBA(rgba) {
        this.rgba = rgba;
    }

    setFrom(x, z) {
        if (x !== this.from.x || z !== this.from.z) {
            this.from.set(x, 0, z);
            this.from.y = ThreeAPI.terrainAt(this.from);
            this.recalcPoints = true;
        }
    }

    setTo(x, z) {
        if (x !== this.to.x || z !== this.to.z) {
            this.to.set(x, 0, z);
            this.to.y = ThreeAPI.terrainAt(this.to);
            this.recalcPoints = true;
        }
    }

    on() {
        this.recalcPoints = true;
        ThreeAPI.addPrerenderCallback(this.call.update);
    }


    off() {
        while (this.fxPoints.length) {
            let pointFX = this.fxPoints.pop();
            pointFX.recoverPointFx();
        }
        ThreeAPI.unregisterPrerenderCallback(this.call.update);
    }

}

export {VisualDestinationPointer}