import {Object3D} from "../../../libs/three/core/Object3D.js";
import {Vector3} from "../../../libs/three/math/Vector3.js";
import * as CombatFxUtils from "../combat/feedback/CombatFxUtils.js";

let pathPoints = []
let tempObj = new Object3D();
let tempVec = new Vector3();
class VisualPath {
    constructor() {
        this.defaultSprite = [7, 4]
        this.leapSprite = [1, 1];
        this.defaultSize = 0.2
        this.rgba = {
            r : 0,
            g : 1,
            b : 0,
            a : 1
        }
    }

    addVisualPathPoint(from, to, segment, tile, segmentFraction) {

        let effectCb = function(efct) {

        //    let isOdd = MATH.isOddNumber(segment);

            efct.activateEffectFromConfigId(true)

            tempObj.position.copy(from);
            tempObj.position.y = to.y;
            tempObj.lookAt(to);

            tempVec.set(0, 0, 0.1);
            /*
            if (isOdd) {
                tempVec.x+=MATH.randomBetween(0.02, 0.11);
            } else {
                tempVec.x-=MATH.randomBetween(0.02, 0.11);
            }
                         */



            let size = this.defaultSize
            if (tile.requiresLeap) {
                efct.setEffectSpriteXY(this.leapSprite[0], this.leapSprite[1]);
                size *= 0.2 + Math.sin(segmentFraction*Math.PI)*2
            } else {
                efct.setEffectSpriteXY(this.defaultSprite[0], this.defaultSprite[1]);
                tempVec.x+=Math.sin(segment*1.4)*0.07
            }

            tempVec.applyQuaternion(tempObj.quaternion);
            tempObj.rotateX(-MATH.HALF_PI)
            efct.setEffectQuaternion(tempObj.quaternion);

            efct.scaleEffectSize( size)
            tempVec.add(from)
            efct.setEffectColorRGBA(tile.rgba)
            efct.setEffectPosition(tempVec)
            pathPoints.push(efct);
        }.bind(this);

        EffectAPI.buildEffectClassByConfigId('additive_stamps_8x8', 'effect_character_indicator',  effectCb)

    }

    clearVisualPath() {
        while (pathPoints.length) {
            pathPoints.pop().recoverEffectOfClass();
        }
    }


}

export { VisualPath }