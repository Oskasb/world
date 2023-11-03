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
        this.effects = [];

        let updateTileSelector = function() {

            if (this.moveVec3.lengthSq() < 0.01) {
                return;
            }

            let cursorObj = ThreeAPI.getCameraCursor().getCursorObj3d();
            this.moveVec3.applyQuaternion(cursorObj.quaternion);

            this.obj3d.lookAt(this.moveVec3);
            this.obj3d.rotateX(-MATH.HALF_PI);
            this.framePos.addVectors(this.initPos, this.moveVec3);

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

    setPos(posVec) {
        this.initPos.copy(posVec);
    }

    getPos() {
        return this.framePos;
    }

    moveAlongX(value) {
        console.log("moveAlongX", value)
        this.moveVec3.x = value * 10;
    }

    moveAlongZ(value) {
        this.moveVec3.z = value * 10;
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