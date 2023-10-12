import * as CombatFxUtils from "./CombatFxUtils.js";
import * as CombatFxOptions from "./CombatFxOptions.js";
import { Vector3 } from "../../../../libs/three/math/Vector3.js";
import { Object3D } from "../../../../libs/three/core/Object3D.js";
import {setupOptsShockwave} from "./CombatFxOptions.js";

let tempVec3 = new Vector3();
let tempObj3D = new Object3D();


function fireBall(actor) {

    let effectCb = function(efct) {
        efct.activateEffectFromConfigId()
        let options = CombatFxOptions.setupOptsFireBallHit(efct, actor)
        efct.setEffectColorRGBA(CombatFxUtils.setRgba(0.24, 0.13, 0.02, 0.1))
        efct.setEffectSpriteXY(3, 4);
        efct.activateSpatialTransition(options)
    }

    for (let i = 0; i < 4; i++) {
        EffectAPI.buildEffectClassByConfigId('additive_particles_8x8', 'particle_additive_pool',  effectCb)
    }

    let shockwaveCb = function(efct) {
        efct.activateEffectFromConfigId()
        let options = CombatFxOptions.setupOptsShockwave(efct, actor.getVisualGamePiece().getCenterMass(), 0.1, 6, 0.3)
        efct.setEffectSpriteXY(0, 0);
        efct.setEffectColorRGBA(CombatFxUtils.setRgba(0.24, 0.13, 0.02, 0.1))
        efct.activateSpatialTransition(options)
    }

    EffectAPI.buildEffectClassByConfigId('additive_stamps_8x8', 'stamp_additive_pool',  shockwaveCb)

    let implosionCb = function(efct) {
        efct.activateEffectFromConfigId()
        let options = CombatFxOptions.setupOptsShockwave(efct, actor.getVisualGamePiece().getCenterMass(), 5, 2, 0.22)
        efct.setEffectSpriteXY(1, 1);
        efct.setEffectColorRGBA(CombatFxUtils.setRgba(0.24, 0.13, 0.02, 0.1))
        efct.activateSpatialTransition(options)
    }

    EffectAPI.buildEffectClassByConfigId('additive_stamps_8x8', 'stamp_additive_pool',  implosionCb)
}

function magicHit(actor) {

    let effectCb = function(efct) {
        efct.activateEffectFromConfigId()
        let options = CombatFxOptions.setupOptsMagicHit(efct, actor)
        efct.setEffectColorRGBA(CombatFxUtils.setRgba(0.24, 0.37, 0.59, 0.59))
        efct.setEffectSpriteXY(4, 3);
        efct.activateSpatialTransition(options)
    }

    for (let i = 0; i < 4; i++) {
        EffectAPI.buildEffectClassByConfigId('additive_particles_8x8', 'particle_additive_pool',  effectCb)
    }




}

function freezeHit(actor) {

    let effectCb = function(efct) {
        efct.activateEffectFromConfigId()
        let options = CombatFxOptions.setupOptsMagicHit(efct, actor)
        efct.setEffectSpriteXY(5, 2);
        efct.setEffectColorRGBA(CombatFxUtils.setRgba(0.12, 0.12, 0.59, 0.29))
        efct.activateSpatialTransition(options)
    }

    for (let i = 0; i < 5; i++) {
        EffectAPI.buildEffectClassByConfigId('additive_particles_8x8', 'particle_additive_pool',  effectCb)
    }

    let shockwaveCb = function(efct) {
        efct.activateEffectFromConfigId()
        let options = CombatFxOptions.setupOptsShockwave(efct, actor.getVisualGamePiece().getCenterMass(), 0.1, 12, 0.3)
        efct.setEffectSpriteXY(0, 0);
        efct.setEffectColorRGBA(CombatFxUtils.setRgba(0.12, 0.12, 0.59, 0.13))
        efct.activateSpatialTransition(options)
    }

    EffectAPI.buildEffectClassByConfigId('additive_stamps_8x8', 'stamp_additive_pool',  shockwaveCb)


}
function healHit(actor) {

    let effectCb = function(efct) {
        efct.activateEffectFromConfigId()
        let options = CombatFxOptions.setupOptsMagicHit(efct, actor)
        efct.setEffectColorRGBA(CombatFxUtils.setRgba(-0.3, 0.9, -0.3, 0.25))
        efct.setEffectSpriteXY(4, 3);
        efct.activateSpatialTransition(options)
    }

    for (let i = 0; i < 3; i++) {
        EffectAPI.buildEffectClassByConfigId('additive_particles_8x8', 'particle_additive_pool',  effectCb)
    }

    let shockwaveCb = function(efct) {
        efct.activateEffectFromConfigId()
        let options = CombatFxOptions.setupOptsShockwave(efct, actor.getVisualGamePiece().getCenterMass(), 4, 0, 0.22)
        efct.setEffectSpriteXY(0, 0);
        efct.setEffectColorRGBA(CombatFxUtils.setRgba(-0.12, 0.57, -0.181, 0.29))
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