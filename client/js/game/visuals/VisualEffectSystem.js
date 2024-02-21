import {Vector3} from "../../../libs/three/math/Vector3.js";
import * as CombatFxOptions from "../combat/feedback/CombatFxOptions.js";
import * as CombatFxUtils from "../combat/feedback/CombatFxUtils.js";
import {physicalAlignYGoundTest} from "../../application/utils/PhysicsUtils.js";

let calcVec = new Vector3();
let calcVec2 = new Vector3();
let tempVec3 = new Vector3();

function endOnLanded(fx) {
    fx.endEffectOfClass()
}

function setupOptsSprayUpwards(efct, pos) {

    let tempObj = ThreeAPI.tempObj;
    tempObj.position.y += 0.5
    tempObj.position.copy(pos);
    let size = 4

    tempObj.lookAt(ThreeAPI.getCamera().position);

    efct.quat.copy(tempObj.quaternion);
    tempVec3.copy(pos);

    // tempVec3.y = tempObj.position.y - 0.1;

    ThreeAPI.tempVec3.set(0.1, 0.1, 0.1)
    MATH.spreadVector(tempVec3, ThreeAPI.tempVec3)

    let fromSize = size*0.3+Math.random()*0.4;
    let toSize = size*0.1+Math.random()*size*0.2
    let time = 0.25+Math.random()*0.35

    let options = CombatFxOptions.defaultOptions();
    options.fromPos = tempObj.position;
    options.toPos = tempVec3;
    options.fromSize = fromSize;
    options.toSize = toSize;
    options.time = time;
    options.callback = endOnLanded;
    options.bounce = 0;
    options.spread = 0;

    return options
}

let drawTriggerHead = function(head, heads, radius, triggerCycle, center, rgba, elevation) {


    let offset = MATH.TWO_PI / (heads/head)
    let cycle = offset + triggerCycle

    calcVec.set(Math.sin(cycle + cycle*head*0.1), 0, Math.cos(cycle + cycle*head*0.1));
    calcVec.multiplyScalar(radius);
    calcVec.add(center);
    let groundAvailable = physicalAlignYGoundTest(calcVec, calcVec, 1.5);
    if (groundAvailable === false) {
        return;
    }
  //  calcVec.y = ThreeAPI.terrainAt(calcVec) +elevation;
  //  calcVec2.set(Math.sin(cycle+0.3), 0, Math.cos(cycle+0.3));
 //   calcVec2.multiplyScalar(radius);
  //  calcVec2.add(center);
  //  calcVec2.y = ThreeAPI.terrainAt(calcVec2);

    //evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:center, to:calcVec, color:'RED'});
    //  evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:center, to:calcVec2, color:'RED'});
   // evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:calcVec, to:calcVec2, color:'YELLOW'});


    let effectCb = function(efct) {
        efct.activateEffectFromConfigId()
        let options = setupOptsSprayUpwards(efct, calcVec)
        efct.setEffectSpriteXY(1, 5);
        efct.activateSpatialTransition(options)
        if (rgba.length === 4) {
            efct.setEffectColorRGBA(CombatFxUtils.setRgba(rgba[0], rgba[1], rgba[2], rgba[3]))
        } else {
            efct.setEffectColorRGBA(rgba)
        }

    };

    EffectAPI.buildEffectClassByConfigId('additive_particles_8x8', 'particle_additive_pool',  effectCb)

}

let sprayUpwards = function(event) {

    let effectCb = function(efct) {
        efct.activateEffectFromConfigId()
        let options = setupOptsSprayUpwards(efct, event.pos)
        options.fromSize = event.fromSize;
        options.toSize = event.toSize;
        options.fromQuat.copy(0, 0, 0, 1);
        options.toQuat.copy(ThreeAPI.getCamera().quaternion);
        efct.setEffectSpriteXY(event.sprite[0], event.sprite[1]);
        efct.setEffectColorRGBA(event.rgba);
        efct.activateSpatialTransition(options)
    };

    EffectAPI.buildEffectClassByConfigId(event.effectConfig || 'additive_particles_8x8', event.effectName || 'particle_additive_pool',  effectCb)

}

let spawnEffect = function(event) {

    if (event.effectCall) {
        effectCalls[event.effectCall](event)
    //    return;
    }

 //   console.log("Spawn Effect", event);
    let shockwaveCb = function(efct) {
        efct.activateEffectFromConfigId()
        let options = CombatFxOptions.setupOptsShockwave(efct, event.pos, event.fromSize, event.toSize, event.duration)
        efct.setEffectSpriteXY(event.sprite[0], event.sprite[1]);
        efct.setEffectColorRGBA(event.rgba);
        efct.activateSpatialTransition(options)
    }

    EffectAPI.buildEffectClassByConfigId(event.effectConfig || 'additive_stamps_8x8', event.effectName|| 'particle_additive_pool',  shockwaveCb)
}

let effectCalls = {};
effectCalls['sprayUpwards'] = sprayUpwards;

function indicateRadius(event) {

    let gameTime = GameAPI.getGameTime();
    let cycle = gameTime * event.speed;
    let radius = event.radius;
    let center = event.pos;
    let elevation = event.elevation || 0;
    let rgba = event.rgba;
    for (let i = 0; i < event.heads; i++) {
        drawTriggerHead(i, event.heads, radius, cycle, center, rgba, elevation)
    }

}

class VisualEffectSystem {
    constructor() {
        evt.on(ENUMS.Event.SPAWN_EFFECT, spawnEffect)
        evt.on(ENUMS.Event.INDICATE_RADIUS, indicateRadius)
    }

}

export { VisualEffectSystem }