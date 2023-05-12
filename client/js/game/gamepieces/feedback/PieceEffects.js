import * as CombatFxUtils from "../../combat/feedback/CombatFxUtils.js";
import * as CombatFxOptions from "../../combat/feedback/CombatFxOptions.js";

function damageEffect(gamePiece, dmg) {

    let effectCb = function(efct) {
        efct.activateEffectFromConfigId()
        let options = CombatFxOptions.setupOptsBoneToGround(efct, gamePiece)
        efct.setEffectSpriteXY(1+Math.floor(Math.random()*3), 6);
        efct.activateSpatialTransition(options)
    }

    for (let i = 0; i < dmg; i++) {
        EffectAPI.buildEffectClassByConfigId('additive_stamps_8x8', 'effect_damage_taken',  effectCb)
    }
}

function healEffect(gamePiece, hp, healer) {

    let applies = 0;
    let effectCb = function(efct) {
        efct.activateEffectFromConfigId()
        let options = CombatFxOptions.setupOptsSprayUpwards(efct, gamePiece, applies)
        efct.setEffectSpriteXY(1+Math.floor(Math.random()*3), 7);
        efct.activateSpatialTransition(options)
        applies ++;
    };

    for (let i = 0; i < hp; i++) {
        EffectAPI.buildEffectClassByConfigId('additive_stamps_8x8', 'effect_health_recovered',  effectCb)
    }
}

function deathEffect(gamePiece) {
    let size = gamePiece.getStatusByKey('size');
    let effectCb = function(efct) {
        efct.activateEffectFromConfigId()
        let options = CombatFxOptions.setupOptsSproutFromGround(efct, gamePiece.getPos(), size)
        efct.setEffectColorRGBA(CombatFxUtils.setRgba(0.7, 0.7, 0.7, 0.5))
        efct.setEffectSpriteXY(2, 5);
        efct.activateSpatialTransition(options)
    }

    EffectAPI.buildEffectClassByConfigId('additive_stamps_8x8', 'effect_damage_taken',  effectCb)

}

export {
    damageEffect,
    healEffect,
    deathEffect
}