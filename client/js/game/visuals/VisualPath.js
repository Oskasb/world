import {Object3D} from "../../../libs/three/core/Object3D.js";
import {Vector3} from "../../../libs/three/math/Vector3.js";
import * as CombatFxUtils from "../combat/feedback/CombatFxUtils.js";

let tempObj = new Object3D();
let tempVec = new Vector3();
let tempVec2 = new Vector3();
class VisualPath {
    constructor() {
        this.pathPoints = [];
        this.lineStepFromVec = new Vector3();
        this.defaultSprite = [7, 4]
        this.leapSprite = [0, 1];
        this.defaultSize = 0.4
        this.rgba = {
            r : 0,
            g : 1,
            b : 0,
            a : 1
        }
        this.lineEvent = {
            from:new Vector3(),
            to: new Vector3(),
            color:'CYAN'
        }
    }

    addVisualPathPoint(from, to, segment, rgba, requiresLeap, segmentFraction) {

        let effectCb = function(efct) {

            efct.activateEffectFromConfigId(true)

            tempObj.position.copy(from);
        //    tempObj.position.y = to.y;
            tempObj.lookAt(to);

            tempVec.set(0, 0, 0.1);

            let size = this.defaultSize
            if (requiresLeap) {
                efct.setEffectSpriteXY(this.leapSprite[0], this.leapSprite[1]);
                size *= 0.3 + Math.sin(segmentFraction*Math.PI)*2
            } else {
                efct.setEffectSpriteXY(this.defaultSprite[0], this.defaultSprite[1]);
                tempVec.x+=Math.sin(segment*1.4)*0.07
            }

            tempVec.applyQuaternion(tempObj.quaternion);
            tempObj.rotateX(-MATH.HALF_PI)
            efct.setEffectQuaternion(tempObj.quaternion);

            efct.scaleEffectSize( size)
            tempVec.add(from)

            this.rgba = {
                r : rgba.r,
                g : rgba.g,
                b : rgba.b,
                a : 1
            }

            efct.setEffectColorRGBA(this.rgba)
            efct.setEffectPosition(tempVec)
            this.pathPoints.push(efct);
        }.bind(this);

        EffectAPI.buildEffectClassByConfigId('additive_stamps_8x8', 'effect_character_indicator',  effectCb)

    }

        drawLineSegment(from, to, segment, segments, color, rgba, requiresLeap) {
            tempVec2.copy(to);
            tempVec2.sub(from);
        let frac = MATH.calcFraction(0, segments, segment);



        if (requiresLeap) {
            let distance = MATH.distanceBetween(from, to);
            tempVec2.y *= frac
            tempVec2.y += Math.sin(frac*Math.PI)*distance*0.3;
        } else {
            let heightFrac = MATH.curveSigmoid(frac);
            tempVec2.y *= MATH.curveQuad(heightFrac)
        }


        let travelFrac = frac // MATH.valueFromCurve(frac, MATH.curves["edgeStep"])
            tempVec2.x *= travelFrac;
            tempVec2.z *= travelFrac;

            tempVec2.add(from);
        // tempVec2.x = to.x;
        // tempVec2.z = to.z;
        this.lineEvent.from.copy(this.lineStepFromVec)
        this.lineEvent.to.copy(tempVec2);
        this.lineEvent.color = color || 'CYAN';
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, this.lineEvent);
        if (segment) {
            this.addVisualPathPoint(this.lineStepFromVec, tempVec2, segment, rgba, requiresLeap, frac);
        }
        this.lineStepFromVec.copy(tempVec2)

    }

    drawVisualPath(from, to, segments, color, rgba, requiresLeap) {
        this.lineStepFromVec.copy(from)
        for (let i = 0; i < segments+1; i++) {
            this.drawLineSegment(from, to, i, segments, color, rgba, requiresLeap)
        }
    }

    clearVisualPath() {
        while (this.pathPoints.length) {
            this.pathPoints.pop().recoverEffectOfClass();
        }
    }


}

export { VisualPath }