import { Vector3 } from "../../../libs/three/math/Vector3.js";
import {Object3D} from "../../../libs/three/core/Object3D.js";
import * as CombatFxOptions from "../combat/feedback/CombatFxOptions.js";
import * as CombatFxUtils from "../combat/feedback/CombatFxUtils.js";

let up = new Vector3(0, 1, 0)
let tempObj = new Object3D();
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
        //    efct.setEffectSize()
            efct.setEffectSpriteXY(7, 1);
            efct.scaleEffectSize(0.8)
            //    }

            //    gamePiece.addPieceUpdateCallback(this.call.updateIndicator)
            this.tileEffect = efct;
        }.bind(this);

        EffectAPI.buildEffectClassByConfigId('additive_stamps_8x8', 'effect_character_indicator',  effectCb)

    }

    setTileIndex = function(indexX, indexY) {
        this.obj3d.position.x = indexX;
        this.obj3d.position.z = indexY;
        let height = ThreeAPI.terrainAt(this.obj3d.position, this.groundNormal);
        tempObj.lookAt(up);
        let pos = this.obj3d.position;
        let slope = 0;
        let spriteX = 7;
        let spriteY = 1;
        let r = 0;
        let g = 1;
        let b = 0;
        let a = 1;

        if (height < 0.1) {
            this.obj3d.position.y = 0.1;
            spriteX = 6;
            spriteY = 2;
            r = 0;
            g = 0;
            b = 1;
            a = 0.4;
        } else {
            this.obj3d.position.y = height;

            ThreeAPI.groundAt(pos, this.groundData)

            slope = this.groundNormal.angleTo(up);

            this.obj3d.position.y += 0.3 + 0.055 * slope/3.14;

            tempObj.rotateX(Math.sin(this.groundNormal.z) * 0.5);
            tempObj.rotateY(Math.sin(this.groundNormal.x) * 0.5);


            if (slope > 0.65) {
                spriteX = 6;
                spriteY = 2;
                r = 1;
                g = 0;
                b = 0;
                a = 0.2;
            } else {

                if (this.groundData.y > 0.2) {
                    r = 0.3;
                    g = 0.6;
                    b = 0;
                }

                if (this.groundData.y > 0.6) {
                    spriteX = 6;
                    spriteY = 2;
                    r = 0.;
                    g = 0.3;
                    b = 0;
                    a = 0.4;
                }

                if (this.groundData.z > 0.05) {
                    b = 1;
                }

            }

        }


        this.tileEffect.setEffectSpriteXY(spriteX, spriteY);
        this.tileEffect.setEffectColorRGBA(CombatFxUtils.setRgba(r, g, b, a))
        this.tileEffect.setEffectPosition(pos)
        this.tileEffect.setEffectQuaternion(tempObj.quaternion);

    }

    setTilePosition = function (posVec) {
        this.obj3d.position.copy(posVec);
    }

    updateDynamicTile = function() {
    //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:this.obj3d.position, color:'RED', size:0.3});

    }

}

export {DynamicTile}