import {Vector3} from "../../../libs/three/math/Vector3.js";
import {poolFetch} from "../../application/utils/PoolUtils.js";
import {Object3D} from "../../../libs/three/core/Object3D.js";
import {colorMapFx} from "./Colors.js";

let tempVec = new Vector3();
let normalStore = new Vector3()
let tempObj = new Object3D();

class VisualEdgeCircle {
    constructor() {

        this.from = new Vector3();
        this.to = new Vector3()

        this.radius = 5;
        this.centerPos = new Vector3();
        let radiiVec3 = new Vector3()
        let rgba;
        this.fxPoints = [];

        this.recalcPoints = true;

        let update = function() {
            let time = GameAPI.getGameTime();


            if (this.recalcPoints === true) {

                while (this.fxPoints.length) {
                    let pointFX = this.fxPoints.pop();
                    pointFX.recoverPointFx();
                }
                this.recalcPoints = false;
            //    console.log("recalcPoints Points",  this.from, this.to, tempVec)
                let distance = this.radius * 6;

                for (let i = 0; i < distance; i++) {
                    let pointFX = poolFetch('VisualPointFX')
                    pointFX.setupPointFX();
                    this.fxPoints.push(pointFX);
                }
            }


            //    console.log("Draw Points",  this.fxPoints.length)
            for (let i = 0; i < this.fxPoints.length; i++) {

                let circleFrac = MATH.angleInsideCircle(time+MATH.calcFraction(0, this.fxPoints.length, i) * MATH.TWO_PI);
                tempObj.position.copy(this.centerPos);

                radiiVec3.set(Math.sin(circleFrac) * this.radius, 0, Math.cos(circleFrac) *this.radius)
                tempObj.position.add(radiiVec3);
                tempObj.quaternion.set(0, 0, 0, 1);
                tempObj.rotateX(-1.575);
                tempObj.rotateZ(circleFrac+1.575);

                let pointFX = this.fxPoints[i];
                tempObj.position.y = ThreeAPI.terrainAt(tempObj.position)
                rgba = colorMapFx['GLITTER_FX']
                pointFX.updatePointFX(tempObj.position, tempObj.quaternion, rgba)
                evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:tempVec, to: tempObj.position, color:'YELLOW'});
                tempVec.copy(tempObj.position);
            }


        }.bind(this)

        this.call = {
            update:update
        }

    }

    setPosition(pos) {
        if (this.centerPos.distanceToSquared(pos) > 0.1) {
            this.centerPos.copy(pos);
            this.recalcPoints = true;
        }


    }

    setRadius(r) {
        if (Math.abs(r-this.radius) > 0.1) {
            this.radius = r;
            this.recalcPoints = true;
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

export {VisualEdgeCircle}