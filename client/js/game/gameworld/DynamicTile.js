import { Vector3 } from "../../../libs/three/math/Vector3.js";
import {Object3D} from "../../../libs/three/core/Object3D.js";
import * as CombatFxOptions from "../combat/feedback/CombatFxOptions.js";
import * as CombatFxUtils from "../combat/feedback/CombatFxUtils.js";

let up = new Vector3(0, 1, 0)
class DynamicTile {
    constructor() {
        this.obj3d = new Object3D();
        this.obj3d.lookAt(up);
        this.groundNormal = new Vector3();
        this.groundData = {x:0, y:0, z:0, w:0};

        this.tileEffect = null;

        let effectCb = function(efct) {
            //    this.indicators.push(efct);
            efct.activateEffectFromConfigId(true)
            //    tempObj.quaternion.set(0, 0, 0, 1);
            //   tempObj.lookAt(0, 1, 0);
            efct.setEffectQuaternion(this.obj3d.quaternion);
            //    gamePiece.getSpatial().getSpatialPosition(this.tempVec3);
            //    this.tempVec3.y+=0.03;
            // efct.setEffectPosition(pos)
            //    tempObj.lookAt(0, 1, 0);
            //    efct.setEffectQuaternion(tempObj.quaternion);

            //    if (typeof (tileX) === 'number' && typeof(tileY) === 'number') {
            efct.setEffectSpriteXY(1, 1);
            //    }

            //    gamePiece.addPieceUpdateCallback(this.call.updateIndicator)
            this.tileEffect = efct;
        }.bind(this);

        EffectAPI.buildEffectClassByConfigId('additive_stamps_8x8', 'effect_character_indicator',  effectCb)

    }

    setTileIndex = function(indexX, indexY) {
        this.obj3d.position.x = indexX;
        this.obj3d.position.z = indexY;
        this.obj3d.position.y = ThreeAPI.terrainAt(this.obj3d.position, this.groundNormal);
        let pos = this.obj3d.position;
        ThreeAPI.groundAt(pos, this.groundData)

        this.obj3d.position.y += 0.1 + 0.75 * Math.max(Math.abs(Math.sin(this.groundNormal.x)) , Math.abs(Math.sin(this.groundNormal.z)));


        this.tileEffect.setEffectPosition(pos)
        this.tileEffect.setEffectColorRGBA(CombatFxUtils.setRgba(this.groundData.x, this.groundData.y, this.groundData.z, Math.sin(this.groundNormal.y*this.groundNormal.y)))

    }

    setTilePosition = function (posVec) {
        this.obj3d.position.copy(posVec);
    }

    updateDynamicTile = function() {
    //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:this.obj3d.position, color:'RED', size:0.3});

    }

}

export {DynamicTile}