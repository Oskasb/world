import * as CombatFxUtils from "./CombatFxUtils.js";
import * as CombatFxOptions from "./CombatFxOptions.js";
import { Vector3 } from "../../../../libs/three/math/Vector3.js";
import { Object3D } from "../../../../libs/three/core/Object3D.js";
import {setupOptsShockwave} from "./CombatFxOptions.js";

let tempVec3 = new Vector3();
let tempObj3D = new Object3D();


function fireBall(gamePiece) {

    let effectCb = function(efct) {
        efct.activateEffectFromConfigId()
        let options = CombatFxOptions.setupOptsFireBallHit(efct, gamePiece)
        efct.setEffectColorRGBA(CombatFxUtils.setRgba(0.6, 0.5, 0.4, 0.3))
        efct.setEffectSpriteXY(3, 4);
        efct.activateSpatialTransition(options)
    }

    for (let i = 0; i < 8; i++) {
        EffectAPI.buildEffectClassByConfigId('additive_particles_8x8', 'particle_additive_pool',  effectCb)
    }

    let shockwaveCb = function(efct) {
        efct.activateEffectFromConfigId()
        let options = CombatFxOptions.setupOptsShockwave(efct, gamePiece.getCenterMass(), 0.1, 14, 0.3)
        efct.setEffectSpriteXY(0, 0);
        efct.setEffectColorRGBA(CombatFxUtils.setRgba(0.82, 0.67, 0.31, 0.4))
        efct.activateSpatialTransition(options)
    }

    EffectAPI.buildEffectClassByConfigId('additive_stamps_8x8', 'stamp_additive_pool',  shockwaveCb)

    let implosionCb = function(efct) {
        efct.activateEffectFromConfigId()
        let options = CombatFxOptions.setupOptsShockwave(efct, gamePiece.getCenterMass(), 8, 4, 0.22)
        efct.setEffectSpriteXY(1, 1);
        efct.setEffectColorRGBA(CombatFxUtils.setRgba(0.42, -0.17, 0.981, 0.99))
        efct.activateSpatialTransition(options)
    }

    EffectAPI.buildEffectClassByConfigId('additive_stamps_8x8', 'stamp_additive_pool',  implosionCb)
}

function magicHit(gamePiece) {

    let effectCb = function(efct) {
        efct.activateEffectFromConfigId()
        let options = CombatFxOptions.setupOptsMagicHit(efct, gamePiece)
        efct.setEffectColorRGBA(CombatFxUtils.setRgba(0.4, 0.7, 0.9, 0.9))
        efct.setEffectSpriteXY(4, 3);
        efct.activateSpatialTransition(options)
    }

    for (let i = 0; i < 12; i++) {
        EffectAPI.buildEffectClassByConfigId('additive_particles_8x8', 'particle_additive_pool',  effectCb)
    }




}

function freezeHit(gamePiece) {

    let effectCb = function(efct) {
        efct.activateEffectFromConfigId()
        let options = CombatFxOptions.setupOptsMagicHit(efct, gamePiece)
        efct.setEffectSpriteXY(5, 2);
        efct.setEffectColorRGBA(CombatFxUtils.setRgba(0.2, 0.2, 0.99, 0.99))
        efct.activateSpatialTransition(options)
    }

    for (let i = 0; i < 12; i++) {
        EffectAPI.buildEffectClassByConfigId('additive_particles_8x8', 'particle_additive_pool',  effectCb)
    }

    let shockwaveCb = function(efct) {
        efct.activateEffectFromConfigId()
        let options = CombatFxOptions.setupOptsShockwave(efct, gamePiece.getCenterMass(), 0.1, 12, 0.3)
        efct.setEffectSpriteXY(0, 0);
        efct.setEffectColorRGBA(CombatFxUtils.setRgba(0.22, 0.22, 0.99, 0.9))
        efct.activateSpatialTransition(options)
    }

    EffectAPI.buildEffectClassByConfigId('additive_stamps_8x8', 'stamp_additive_pool',  shockwaveCb)


}
function healHit(gamePiece) {

    let effectCb = function(efct) {
        efct.activateEffectFromConfigId()
        let options = CombatFxOptions.setupOptsMagicHit(efct, gamePiece)
        efct.setEffectColorRGBA(CombatFxUtils.setRgba(-0.3, 0.9, -0.3, 0.5))
        efct.setEffectSpriteXY(4, 3);
        efct.activateSpatialTransition(options)
    }

    for (let i = 0; i < 3; i++) {
        EffectAPI.buildEffectClassByConfigId('additive_particles_8x8', 'particle_additive_pool',  effectCb)
    }

    let shockwaveCb = function(efct) {
        efct.activateEffectFromConfigId()
        let options = CombatFxOptions.setupOptsShockwave(efct, gamePiece.getCenterMass(), 4, 0, 0.22)
        efct.setEffectSpriteXY(0, 0);
        efct.setEffectColorRGBA(CombatFxUtils.setRgba(-0.12, 0.57, -0.181, 0.39))
        efct.activateSpatialTransition(options)
    }

    EffectAPI.buildEffectClassByConfigId('additive_stamps_8x8', 'stamp_additive_pool',  shockwaveCb)
}

export {
    fireBall,
    magicHit,
    healHit,
    freezeHit
}