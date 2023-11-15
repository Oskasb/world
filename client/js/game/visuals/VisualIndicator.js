import { Object3D } from "../../../libs/three/core/Object3D.js";
import { Vector3 } from "../../../libs/three/math/Vector3.js";

let tempVec3 = new Vector3();
let tempObj = new Object3D()

let defaults = {
    spin : 0,
    scale : 1,
    pulsate : 0,
    rate : 2,
    alignment: 'NEUTRAL'
}

let colorMap = {};
colorMap['FRIENDLY']       = {r:0.05,   g:1,   b:0.1, a:0.5};
colorMap['NEUTRAL']    = {r:1,   g:0.6, b:-0.4, a:0.5};
colorMap['HOSTILE']       = {r:1,   g:-0.6,   b:-0.6,   a:0.8};
colorMap['ITEM']       = {r:-0.3,   g:0.4, b:1,   a:0.8};

class VisualIndicator {
    constructor() {

        this.spin = 0;
        this.scale = 1;
        this.pulsate = 0;
        this.rate = 2;

        this.indicators = [];



        let updateIndicator = function(tpf, time) {
            this.indicateSelectedTargetPiece(tpf, time, this.spin, this.scale, this.pulsate, this.rate)
        }.bind(this)

        this.call = {
            updateIndicator:updateIndicator
        }
    }

    addPointerPieceCameraModifiers(posVec) {
        tempVec3.copy(posVec);
        tempVec3.sub(GameAPI.getMainCharPiece().getPos())
        tempVec3.multiplyScalar(0.15);
        GameAPI.getGameCamera().addLookAtModifierVec3(tempVec3);
        tempVec3.multiplyScalar(0.55);
        GameAPI.getGameCamera().addPositionModifierVec3(tempVec3);
    }

    indicateActor(actor, alignment, spriteX, spriteY, spin, scale, pulsate, rate) {

        this.actor = actor;
        this.spin = spin || defaults.spin;
        this.scale = scale || defaults.scale;
        this.pulsate = pulsate || defaults.pulsate;
        this.rate = rate || defaults.rate;
        this.alignment = alignment || defaults.alignment;

        let effectCb = function(efct) {
            this.indicators.push(efct);
            efct.activateEffectFromConfigId()
            tempObj.quaternion.set(0, 0, 0, 1);
            tempObj.lookAt(0, 1, 0);
            efct.setEffectQuaternion(tempObj.quaternion);
            ThreeAPI.tempVec3.copy(actor.getPos());
            ThreeAPI.tempVec3.y+=0.03;
            efct.setEffectPosition(ThreeAPI.tempVec3)
            tempObj.lookAt(0, 1, 0);
            efct.setEffectQuaternion(tempObj.quaternion);

            if (typeof (spriteX) === 'number' && typeof(spriteY) === 'number') {
                efct.setEffectSpriteXY(spriteX, spriteY);
            }

            GameAPI.registerGameUpdateCallback(this.call.updateIndicator)
        }.bind(this);

        EffectAPI.buildEffectClassByConfigId('additive_stamps_8x8', 'effect_character_indicator',  effectCb)
    }

    indicateSelectedTargetPiece(tpf, time, spinSpeed, scale, pulsate, rate) {
    //    this.addPointerPieceCameraModifiers(actor.getCenterMass())
        let actor = this.actor;
        for (let i = 0; i < this.indicators.length; i++) {
            let efct = this.indicators[i];
            efct.setEffectColorRGBA(colorMap[this.alignment]);
            let size = actor.getStatus(ENUMS.ActorStatus.SIZE) || 0.5;
            if (scale) size*=scale;
            efct.scaleEffectSize(  size + pulsate*(Math.sin(time*rate)));
            ThreeAPI.tempVec3.copy(actor.getPos());
            ThreeAPI.tempVec3.y+=0.03;
            efct.setEffectPosition(ThreeAPI.tempVec3)

            if (spinSpeed) {
                tempObj.lookAt(0, 1, 0);
                tempObj.rotateZ(time*spinSpeed);
                efct.setEffectQuaternion(tempObj.quaternion);
            }
        }
    }

    removeIndicatorFx() {
        GameAPI.unregisterGameUpdateCallback(this.call.updateIndicator)
        while (this.indicators.length) {
            let efct = this.indicators.pop();
            efct.scaleEffectSize(0);
            efct.recoverEffectOfClass();
        }
    }

}

export {VisualIndicator}