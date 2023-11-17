import {Object3D} from "../../../libs/three/core/Object3D.js";
import {Vector3} from "../../../libs/three/math/Vector3.js";
import * as CombatFxUtils from "../combat/feedback/CombatFxUtils.js";


let cfgDefault = {
    "sprite": [4, 7],
    "height": 0.6,
    "rgba": [0.2, 0.3, 0.6, 0.4],
    "size": 1
}

let attachSelectorFx = function(gridTileSelector) {

    let config = cfgDefault

    let rgba = config.rgba;

    let effectCb = function(efct) {

        gridTileSelector.addEffect(efct);
        efct.activateEffectFromConfigId()
        efct.setEffectPosition(gridTileSelector.obj3d.position)
        //    let options = CombatFxOptions.setupOptsBoneToGround(efct, gamePiece)
        //    options.toSize*=0.5;
        efct.setEffectSpriteXY(config.sprite[0], config.sprite[1]);
        efct.scaleEffectSize(config.size);
        efct.setEffectColorRGBA(CombatFxUtils.setRgba(rgba[0], rgba[1], rgba[2], rgba[3]))
        //    efct.activateSpatialTransition(options)

    }

    EffectAPI.buildEffectClassByConfigId('normal_stamps_8x8', 'stamp_normal_pool',  effectCb)
    EffectAPI.buildEffectClassByConfigId('overlay_stamps_8x8', 'stamp_overlay_pool',  effectCb)
}

let detachSelectorFx = function(gridTileSelector) {
    if (gridTileSelector.effect) {
        gridTileSelector.effect.recoverEffectOfClass();
    }
}

class GridTileSelector {
    constructor() {
        this.obj3d = new Object3D();
        this.initPos = new Vector3();
        this.moveVec3 = new Vector3();
        this.framePos = new Vector3();
        this.translation = new Vector3();
        this.extendedDistance = 0;
        this.effects = [];

        let updateTileSelector = function() {

            if (!this.hasValue()) {
                return;
            }

            let cursorObj = ThreeAPI.getCameraCursor().getCursorObj3d();
            this.moveVec3.applyQuaternion(cursorObj.quaternion);

            this.obj3d.lookAt(this.moveVec3);
            this.obj3d.rotateX(-MATH.HALF_PI);
            this.framePos.addVectors(this.initPos, this.moveVec3);
            this.framePos.y = ThreeAPI.terrainAt(this.framePos)+0.2
            this.moveVec3.y = this.framePos.y - this.initPos.y;
            this.translation.copy(this.framePos);
            this.translation.sub(this.initPos);
            this.extendedDistance = this.translation.length();
            for (let i = 0; i < this.effects.length; i++) {
                let effect = this.effects[i]
                effect.setEffectPosition(this.framePos)
                effect.setEffectQuaternion(this.obj3d.quaternion)
            }

        }.bind(this)

        this.call = {
            updateTileSelector:updateTileSelector
        }

    }

    hasValue() {
        if (this.moveVec3.lengthSq() * 0.1) {
            return true;
        } else {
            return false;
        }
    }

    setPos(posVec) {
        this.initPos.copy(posVec);
        this.initPos.y = ThreeAPI.terrainAt(this.initPos)+0.2
    }

    getPos() {
        return this.framePos;
    }

    moveAlongX(value) {
        this.moveVec3.x = value;
    }

    moveAlongZ(value) {
        this.moveVec3.z = value;
    }

    getObj3D() {
        return this.obj3d;
    }

    addEffect(effect) {
        this.effects.push(effect);
    }


    activateGridTileSelector() {
        attachSelectorFx(this);
        GameAPI.registerGameUpdateCallback(this.call.updateTileSelector)
    }

    deactivateGridTileSelector() {
        while (this.effects.length) {
            this.effects.pop().recoverEffectOfClass();
        }
        GameAPI.unregisterGameUpdateCallback(this.call.updateTileSelector)
    }


}

export { GridTileSelector }