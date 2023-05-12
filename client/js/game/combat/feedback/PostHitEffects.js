import * as CombatFxUtils from "./CombatFxUtils.js";
import * as CombatFxOptions from "./CombatFxOptions.js";

function catchOnFire(gamePiece) {

    let effectCb = function(efct) {
        efct.activateEffectFromConfigId()
        let options = CombatFxOptions.setupOptsBoneLingering(efct, gamePiece);
        efct.setEffectSpriteXY(3, 4);
        efct.setEffectColorRGBA(CombatFxUtils.setRgba(0.8, 0.7, 0.4, 0.8))

        efct.activateSpatialTransition(options)
    }

    for (let i = 0; i < 5; i++) {
        EffectAPI.buildEffectClassByConfigId('additive_particles_8x8', 'particle_additive_pool',  effectCb)
    }
}

function residualMagic(gamePiece) {

    let effectCb = function(efct) {
        efct.activateEffectFromConfigId()
        let options = CombatFxOptions.setupOptsBoneLingering(efct, gamePiece);
        efct.activateSpatialTransition(options)
    }

    for (let i = 0; i < 3; i++) {
        EffectAPI.buildEffectClassByConfigId('additive_particles_8x8', 'residual_magic_damage_effect',  effectCb)
    }
}

function residualHeal(gamePiece) {

    let effectCb = function(efct) {
        efct.activateEffectFromConfigId()
        let options = CombatFxOptions.setupOptsBoneLingering(efct, gamePiece);
        efct.setEffectSpriteXY(2, 7);
        efct.setEffectColorRGBA(CombatFxUtils.setRgba(-0.2, 0.7, -0.2, 0.4))
        efct.activateSpatialTransition(options)
    }

    for (let i = 0; i < 5; i++) {
        EffectAPI.buildEffectClassByConfigId('additive_particles_8x8', 'particle_additive_pool',  effectCb)
    }
}
function residualFrost(gamePiece) {

    let effectCb = function(efct) {
        efct.activateEffectFromConfigId()
        let options = CombatFxOptions.setupOptsBoneLingering(efct, gamePiece);
        efct.setEffectSpriteXY(5, 2);
        efct.setEffectColorRGBA(CombatFxUtils.setRgba(0.5, 0.5, 0.99, 0.99))
        efct.activateSpatialTransition(options)
    }

    for (let i = 0; i < 12; i++) {
        EffectAPI.buildEffectClassByConfigId('additive_particles_8x8', 'particle_additive_pool',  effectCb)
    }

}

export {
    catchOnFire,
    residualMagic,
    residualHeal,
    residualFrost
}