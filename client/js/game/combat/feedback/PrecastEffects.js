import * as CombatFxUtils from "./CombatFxUtils.js";
import * as CombatFxOptions from "./CombatFxOptions.js";

function handsOnFire(gamePiece, obj3d) {
    let size = gamePiece.getStatusByKey('size');
    let particleFxCb = function(efct) {
        efct.activateEffectFromConfigId()
        let options = CombatFxOptions.setupOptsPowerHands(efct, obj3d, size);
        efct.setEffectSpriteXY(3, 4);
        efct.setEffectColorRGBA(CombatFxUtils.setRgba(0.6, 0.5, 0.4, 0.3))
        efct.activateSpatialTransition(options)
    }

        EffectAPI.buildEffectClassByConfigId('additive_particles_8x8', 'particle_additive_pool',  particleFxCb)

    let powerCoreCB = function(efct) {
        efct.activateEffectFromConfigId()
        let options = CombatFxOptions.setupOptsPowerCore(efct, obj3d, size);
        efct.setEffectSpriteXY(0, 0);
        efct.setEffectColorRGBA(CombatFxUtils.setRgba(0.82, 0.67, 0.31, 0.2))
        efct.activateSpatialTransition(options)
    }

    EffectAPI.buildEffectClassByConfigId('additive_particles_8x8', 'particle_additive_pool',  powerCoreCB)

}

function handsOfFrost(gamePiece, obj3d) {
    let size = gamePiece.getStatusByKey('size');
    let particleFxCb = function(efct) {
        efct.activateEffectFromConfigId()
        let options = CombatFxOptions.setupOptsPowerHands(efct, obj3d, size);
        efct.setEffectSpriteXY(5, 2);
        efct.setEffectColorRGBA(CombatFxUtils.setRgba(0.2, 0.2, 0.99, 0.99))
        efct.activateSpatialTransition(options)
    }

    EffectAPI.buildEffectClassByConfigId('additive_particles_8x8', 'particle_additive_pool',  particleFxCb)

    let powerCoreCB = function(efct) {
        efct.activateEffectFromConfigId()
        let options = CombatFxOptions.setupOptsPowerCore(efct, obj3d, size);
        efct.setEffectSpriteXY(2, 0);
        efct.setEffectColorRGBA(CombatFxUtils.setRgba(0.2, 0.2, 0.99, 0.99))
        efct.activateSpatialTransition(options)
    }

    EffectAPI.buildEffectClassByConfigId('additive_particles_8x8', 'particle_additive_pool',  powerCoreCB)

}

function magicPowerHands(gamePiece, obj3d) {
    let size = gamePiece.getStatusByKey('size');
    let effectCb = function(efct) {
        efct.activateEffectFromConfigId()
        let options = CombatFxOptions.setupOptsPowerHands(efct, obj3d, size);

        efct.setEffectSpriteXY(3, 3);
        efct.setEffectColorRGBA(CombatFxUtils.setRgba(0.6, 0.5, 0.9, 0.9))
        efct.activateSpatialTransition(options)
    }

    EffectAPI.buildEffectClassByConfigId('additive_particles_8x8', 'particle_additive_pool',  effectCb)

    let shockwaveCb = function(efct) {
        efct.activateEffectFromConfigId()

        let options = CombatFxOptions.setupOptsPowerCore(efct, obj3d, size);
        efct.setEffectSpriteXY(4, 0);
        efct.setEffectColorRGBA(CombatFxUtils.setRgba(0.32, 0.77, 0.99, 0.99))
        efct.activateSpatialTransition(options)
    }

    EffectAPI.buildEffectClassByConfigId('additive_particles_8x8', 'stamp_additive_pool',  shockwaveCb)
}

function healPowerHands(gamePiece, obj3d) {
    let size = gamePiece.getStatusByKey('size');
    let effectCb = function(efct) {
        efct.activateEffectFromConfigId()
        let options = CombatFxOptions.setupOptsFriendlyHands(efct, obj3d, size);
        efct.setEffectSpriteXY(1, 5);
        efct.setEffectColorRGBA(CombatFxUtils.setRgba(-0.12, 0.37, -0.19, 0.59))
        efct.activateSpatialTransition(options)
    }

    EffectAPI.buildEffectClassByConfigId('additive_particles_8x8', 'particle_additive_pool',  effectCb)

    let shockwaveCb = function(efct) {
        efct.activateEffectFromConfigId()
        let options = CombatFxOptions.setupOptsFriendlyCore(efct, obj3d, size);

        efct.setEffectSpriteXY(3, 2);
        efct.setEffectColorRGBA(CombatFxUtils.setRgba(-0.12, 0.77, -0.19, 0.69))
        efct.activateSpatialTransition(options)
    }

    EffectAPI.buildEffectClassByConfigId('additive_particles_8x8', 'stamp_additive_pool',  shockwaveCb)
}

export {
    handsOfFrost,
    handsOnFire,
    magicPowerHands,
    healPowerHands
}