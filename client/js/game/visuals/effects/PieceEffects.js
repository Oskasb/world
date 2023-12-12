import * as CombatFxUtils from "../../combat/feedback/CombatFxUtils.js";
import * as CombatFxOptions from "../../combat/feedback/CombatFxOptions.js";

function damageEffect(actor, dmg, tpf) {

    let effectCb = function(efct) {
        efct.activateEffectFromConfigId()
        let options = CombatFxOptions.setupOptsBoneToGround(efct, actor)
        efct.setEffectSpriteXY(1+Math.floor(Math.random()*3), 6);
        efct.activateSpatialTransition(options)
    }

    let count = Math.ceil(dmg * tpf * 10);

    for (let i = 0; i < count; i++) {
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

function deathEffect(actor, value) {
    let size = actor.getStatus(ENUMS.ActorStatus.SIZE);
    console.log("Death FX")
    let effectCb = function(efct) {
        efct.activateEffectFromConfigId()
        let options = CombatFxOptions.setupOptsSproutFromGround(efct, actor.getSpatialPosition(), size)
        efct.setEffectColorRGBA(CombatFxUtils.setRgba(0.8, 0.7, 0.9, 0.75))
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