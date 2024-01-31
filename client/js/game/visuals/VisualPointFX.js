import {poolReturn} from "../../application/utils/PoolUtils.js";

class VisualPointFX {
    constructor() {
        this.fx = []
    }

    setupPointFX(sX, sY, scale) {

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

        EffectAPI.buildEffectClassByConfigId('additive_stamps_8x8', 'stamp_additive_pool',  effectCb)
        EffectAPI.buildEffectClassByConfigId('overlay_stamps_8x8', 'stamp_overlay_pool',  effectCb)
    }

    updatePointFX(pos, quat, rgba) {
        for (let i = 0; i < this.fx.length; i++) {
            let fx = this.fx[i];
            fx.setEffectPosition(pos);
            fx.setEffectQuaternion(quat);
            fx.setEffectColorRGBA(rgba)
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