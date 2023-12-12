import * as CombatFxUtils from "../../combat/feedback/CombatFxUtils.js";
import * as CombatFxOptions from "../../combat/feedback/CombatFxOptions.js";
import {setupOptsFlames} from "../../combat/feedback/CombatFxOptions.js";

function statusFrozen(gamePiece) {

    let effectCb = function(efct) {
        efct.activateEffectFromConfigId()
        let options = CombatFxOptions.setupOptsBoneToGround(efct, gamePiece)
        options.toSize*=0.5;
        efct.setEffectSpriteXY(5, 2);
        efct.setEffectColorRGBA(CombatFxUtils.setRgba(0.2, 0.2, 0.99, 0.99))
        efct.activateSpatialTransition(options)
    }

    if (Math.random() < 0.2) {
        EffectAPI.buildEffectClassByConfigId('additive_stamps_8x8', 'stamp_additive_pool',  effectCb)
    }

    let lingerCb = function(efct) {
        efct.activateEffectFromConfigId()
        let options = CombatFxOptions.setupOptsBoneLingering(efct, gamePiece)
        options.toSize*=0.5;
        efct.setEffectSpriteXY(5, 2);
        efct.setEffectColorRGBA(CombatFxUtils.setRgba(0.2, 0.2, 0.99, 0.99))
        efct.activateSpatialTransition(options)
    }
    if (Math.random() < 0.2) {
        EffectAPI.buildEffectClassByConfigId('additive_stamps_8x8', 'stamp_additive_pool', lingerCb)
    }

}


function statusBurning(gamePiece) {

    let effectCb = function(efct) {
        efct.activateEffectFromConfigId()
        let options = CombatFxOptions.setupOptsBoneLingering(efct, gamePiece)
        options.toSize*=0.75;
        options.spread =MATH.randomBetween(-0.3, 0.3);
        options.bounce *= MATH.randomBetween(-0.2, 0.2);
        efct.setEffectSpriteXY(3, 4);
        efct.setEffectColorRGBA(CombatFxUtils.setRgba(0.6, 0.53, 0.1, 0.4))
        efct.activateSpatialTransition(options)
    }

    if (Math.random() < 0.2) {
        EffectAPI.buildEffectClassByConfigId('additive_stamps_8x8', 'stamp_additive_pool',  effectCb)
    }

    let sprayCb = function(efct) {
        efct.activateEffectFromConfigId()
        let options = CombatFxOptions.setupOptsFlames(efct, gamePiece, Math.floor(MATH.randomBetween(0, 10)))
        efct.setEffectSpriteXY(3, 4);
        efct.setEffectColorRGBA(CombatFxUtils.setRgba(0.5, 0.4, 0.2, 0.3))
        efct.activateSpatialTransition(options)
    }
    if (Math.random() < 0.2) {
        EffectAPI.buildEffectClassByConfigId('additive_stamps_8x8', 'stamp_additive_pool', sprayCb)
    }

}


let fxMap = {
    status_frozen:statusFrozen,
    status_burning:statusBurning,
    status_stunned:statusFrozen,
    status_hasted:statusFrozen,
    status_empowered:statusFrozen,
    status_hardened:statusFrozen,
    status_vampiric:statusFrozen,
    status_hidden:statusFrozen,
    status_poisoned:statusFrozen
}

function processPieceStatusFx(status) {
    for (let key in fxMap) {
        if (status[key] > 0) {
            fxMap[key](status.gamePiece)
        }
    }
}

export {
    processPieceStatusFx
}