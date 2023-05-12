import * as CombatFxOptions from "./CombatFxOptions.js";
import { Vector3 } from "../../../../libs/three/math/Vector3.js";
import { Object3D } from "../../../../libs/three/core/Object3D.js";

let tempVec3 = new Vector3();
let tempObj3D = new Object3D();

let opts = {};

let defaults = {
    fromPos:      new Vector3(),
    fromQuat:     new Object3D().quaternion,
    toPos:      new Vector3(),
    toQuat:      new Object3D().quaternion,
    fromSize:     1,
    toSize:     2,
    time:     1,
    callback:     endOnLanded,
    bounce:     0,
    spread:     0,
    getPosFunc: null
}
function optsDefault() {
    return defaults
}

function defaultOptions() {
    let defs = optsDefault()

    for (let key in defs) {
        opts[key] = defs[key];
    }

    return opts
}


let rgba = {
    r:1, g:1, b:1, a:1
}

function setRgba(r, g, b, a) {
    rgba.r = r;
    rgba.g = g;
    rgba.b = b;
    rgba.a = a;
    return rgba;
}

function endOnLanded(fx) {
    fx.endEffectOfClass()
}

function setupLifecycle(efct, fxDuration, onPaceFactor, decayFactor) {
    let start = client.getFrame().systemTime;
    let atk = onPaceFactor*fxDuration;
    let decay = decayFactor*fxDuration;
    let end = start+fxDuration;
    efct.setEffectLifecycle(start, atk, end, decay);
    return fxDuration+decay;
}

export {
    setupLifecycle,
    endOnLanded,
    setRgba,
}