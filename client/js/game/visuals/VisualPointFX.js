import {poolReturn} from "../../application/utils/PoolUtils.js";

class VisualPointFX {
    constructor() {
        this.fx = []
        this.rgba = null;
        this.scale = 1;
    }

    setupPointFX(sX, sY, scale, normalBlend) {

        let spriteX = sX || 0;
        let spriteY = sY || 3;

        let effectCb = function(efct) {
            efct.activateEffectFromConfigId(true)
        //    if (typeof (spriteX) === 'number' && typeof(spriteY) === 'number') {
                efct.setEffectSpriteXY(spriteX, spriteY);
                efct.scaleEffectSize( scale || 1.0)
        //    }
            this.fx.push(efct);

        }.bind(this);

        if (normalBlend === true) {
            EffectAPI.buildEffectClassByConfigId('normal_stamps_8x8', 'stamp_normal_pool',  effectCb)
        } else {
            EffectAPI.buildEffectClassByConfigId('additive_stamps_8x8', 'stamp_additive_pool',  effectCb)
        }

        EffectAPI.buildEffectClassByConfigId('overlay_stamps_8x8', 'stamp_overlay_pool',  effectCb)

    }

    updatePointFX(pos, quat, rgba, scale) {
        for (let i = 0; i < this.fx.length; i++) {
            let fx = this.fx[i];
            fx.setEffectPosition(pos);
            fx.setEffectQuaternion(quat);
            fx.setEffectColorRGBA(rgba)

            if (typeof (scale) === 'number') {
                fx.scaleEffectSize( scale)
            }

        }
    }

    recoverPointFx() {
        while (this.fx.length) {
            this.fx.pop().recoverEffectOfClass();
        }
        poolReturn(this);
    }

}

export { VisualPointFX }