import * as CombatFxOptions from "../combat/feedback/CombatFxOptions.js";
import * as CombatFxUtils from "../combat/feedback/CombatFxUtils.js";

let spawnEffect = function(event) {
    console.log("Spawn Effect", event);
    let shockwaveCb = function(efct) {
        efct.activateEffectFromConfigId()
        let options = CombatFxOptions.setupOptsShockwave(efct, event.pos, event.fromSize, event.toSize, event.duration)
        efct.setEffectSpriteXY(event.sprite[0], event.sprite[1]);
        efct.setEffectColorRGBA(event.rgba);
        efct.activateSpatialTransition(options)
    }

    EffectAPI.buildEffectClassByConfigId('additive_stamps_8x8', event.effectName,  shockwaveCb)
}

class VisualEffectSystem {
    constructor() {


        evt.on(ENUMS.Event.SPAWN_EFFECT, spawnEffect)

    }

}

export { VisualEffectSystem }