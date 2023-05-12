import * as CombatFxUtils from "./CombatFxUtils.js";
import * as CombatFxOptions from "./CombatFxOptions.js";

function magicMissile(fromPos, gamePiece, index, onArriveCB, getPosFunc) {

    let effectCb = function(efct) {
        efct.activateEffectFromConfigId()
        let options = CombatFxOptions.setupOptsMagicMissile(efct, fromPos, gamePiece, index, onArriveCB, getPosFunc)
        efct.activateSpatialTransition(options)
    }

    EffectAPI.buildEffectClassByConfigId('additive_stamps_8x8', 'magic_missile_projectile_effect',  effectCb)

}

function fireMissile(fromPos, gamePiece, index, onArriveCB, getPosFunc) {

    let effectCb = function(efct) {
        efct.activateEffectFromConfigId()
        let options = CombatFxOptions.setupOptsFireMissile(efct, fromPos, gamePiece, index, onArriveCB, getPosFunc)
        efct.activateSpatialTransition(options)
    }
    EffectAPI.buildEffectClassByConfigId('additive_particles_8x8', 'fire_missile_particle_additive_pool',  effectCb)
}

function healingMissile(fromPos, gamePiece, index, onArriveCB, getPosFunc) {

    let effectCb = function(efct) {

        efct.activateEffectFromConfigId()
        let options = CombatFxOptions.setupOptsFriendlyMissile(efct, fromPos, gamePiece, index, onArriveCB, getPosFunc)
        efct.setEffectSpriteXY(2, 7);
        efct.setEffectColorRGBA(CombatFxUtils.setRgba(-0.39, 0.99, -0.21, 0.99))

        efct.activateSpatialTransition(options)
    }

    EffectAPI.buildEffectClassByConfigId('additive_particles_8x8', 'particle_additive_pool',  effectCb)
}

function frostMissile(fromPos, gamePiece, index, onArriveCB, getPosFunc) {

    let effectCb = function(efct) {
        efct.activateEffectFromConfigId()
        let options = CombatFxOptions.setupOptsDirectMissile(efct, fromPos, gamePiece, index, onArriveCB, getPosFunc)
        efct.setEffectSpriteXY(5, 2);
        efct.setEffectColorRGBA(CombatFxUtils.setRgba(0.2, 0.2, 0.99, 0.99))
        efct.activateSpatialTransition(options)
    }

    EffectAPI.buildEffectClassByConfigId('additive_stamps_8x8', 'magic_missile_projectile_effect',  effectCb)

}

export {
    magicMissile,
    fireMissile,
    healingMissile,
    frostMissile
}