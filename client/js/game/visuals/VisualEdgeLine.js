import {Vector3} from "../../../libs/three/math/Vector3.js";
import {poolFetch} from "../../application/utils/PoolUtils.js";
import {Object3D} from "../../../libs/three/core/Object3D.js";
import {colorMapFx} from "./Colors.js";

let tempVec = new Vector3();
let normalStore = new Vector3()
let tempObj = new Object3D();

class VisualEdgeLine {
    constructor() {

        this.from = new Vector3();
        this.to = new Vector3()

        this.fxPoints = [];

        this.recalcPoints = true;

        let update = function() {
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:this.from, to:this.to, color:'YELLOW'});

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

                for (let i = 0; i < distance; i++) {
                    let pointFX = poolFetch('VisualPointFX')
                    pointFX.setupPointFX();
                    this.fxPoints.push(pointFX);
                }

                tempObj.position.copy(this.from);
                tempObj.lookAt(tempVec);
                tempObj.rotateX(-1.57)
                tempVec.sub(this.from);
                tempVec.normalize();
                tempObj.position.x += tempVec.x *0.5;
                tempObj.position.z += tempVec.z *0.5;
                let rgba = colorMapFx['GLITTER_FX']
                //    console.log("Draw Points",  this.fxPoints.length)
                for (let i = 0; i < this.fxPoints.length; i++) {
                    let pointFX = this.fxPoints[i];

                    tempObj.position.y = Math.max(ThreeAPI.terrainAt(tempObj.position, normalStore), 0.1);


                    pointFX.updatePointFX(tempObj.position, tempObj.quaternion, rgba)

                    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:tempObj.position, to:this.to, color:'YELLOW'});
                    tempObj.position.add(tempVec);
                }

            }


        }.bind(this)

        this.call = {
            update:update
        }

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

export {VisualEdgeLine}