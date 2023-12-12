import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {colorMapFx} from "../Colors.js";

let effectEvent = {
    pos:new Vector3(),
    dir:new Vector3(),
    rgba:{r:0.1, g:0.4, b:0.1, a:0.5},
    fromSize:0.2,
    toSize:1.8,
    duration:0.25,
    sprite:[0, 1],
    effectName:'stamp_additive_pool'
}

let defaults = {
    pos:new Vector3(),
    dir:new Vector3(),
    rgba:{r:0.1, g:0.4, b:0.1, a:0.5},
    fromSize:0.2,
    toSize:1.8,
    duration:0.25,
    sprite:[0, 1],
    effectName:'stamp_additive_pool'
}

function copyDefaults(defaults, target) {
    for (let key in defaults) {
        target[key] = defaults[key];
    }
}

let rgba = {};
function transitionEffectOn(pos, effectData) {
    copyDefaults(defaults, effectEvent)
    let color = 'DEFAULT_FX'
    if (typeof (effectData.color) === 'string') {
        color = effectData.color;
    }

    effectEvent.rgba = MATH.copyRGBA(colorMapFx[color], rgba);
    effectEvent.pos.copy(pos);
    effectEvent.dir.set(0, 1, 0);
    if (effectData['effect']) {
        for (let key in effectData.effect) {
            effectEvent[key] = effectData.effect[key]
        }
    }

    evt.dispatch(ENUMS.Event.SPAWN_EFFECT, effectEvent)
}

function transitionEffectOff(pos, effectData) {
    copyDefaults(defaults, effectEvent)
    let color = 'DEFAULT_FX'
    if (typeof (effectData.color) === 'string') {
        color = effectData.color;
    }

    effectEvent.rgba = MATH.copyRGBA(colorMapFx[color], rgba);
    effectEvent.pos.copy(pos);
    effectEvent.dir.set(0, 1, 0);
    if (effectData['effect']) {
        for (let key in effectData.effect) {
            effectEvent[key] = effectData.effect[key]
        }
    }

    evt.dispatch(ENUMS.Event.SPAWN_EFFECT, effectEvent)
}

export {
    transitionEffectOn,
    transitionEffectOff
}