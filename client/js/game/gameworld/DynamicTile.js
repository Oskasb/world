import { Vector3 } from "../../../libs/three/math/Vector3.js";
import {Object3D} from "../../../libs/three/core/Object3D.js";
import * as CombatFxOptions from "../combat/feedback/CombatFxOptions.js";
import * as CombatFxUtils from "../combat/feedback/CombatFxUtils.js";
import {GridTile} from "../gamescenarios/GridTile.js";
import {poolReturn} from "../../application/utils/PoolUtils.js";

let up = new Vector3(0, 1, 0)
let tempVec = new Vector3();
let tempObj = new Object3D();
class DynamicTile {
    constructor(defaultSprite, defaultSize) {

    }

    activateTile = function(defaultSprite, defaultSize, spacing, hideTile) {
        this.defaultSprite = defaultSprite || [7, 3]

        this.hideTile = hideTile;
        this.spacing = spacing || 1;

        this.defaultSize = this.spacing * defaultSize || 0.9

        this.groundSprite = [7, 1]

        this.requiresLeap = false;
        this.walkable = false;
        this.blocking = false;

        this.obj3d = new Object3D();
        this.obj3d.lookAt(up);
        this.tileX = 0;
        this.tileZ = 0;
        this.gridI = 0;
        this.gridJ = 0;
        this.gridTile = new GridTile(0, 0, 1, 0.1, this.obj3d)
        this.groundNormal = new Vector3();
        this.groundData = {x:0, y:0, z:0, w:0};

        this.rgba = {
            r : 0,
            g : 1,
            b : 0,
            a : 1
        }

        this.tileEffect = null;

        let effectCb = function(efct) {

            efct.activateEffectFromConfigId(true)

            efct.setEffectQuaternion(this.obj3d.quaternion);

            efct.setEffectSpriteXY(this.defaultSprite[0], this.defaultSprite[1]);
            efct.scaleEffectSize( this.defaultSize)

            this.tileEffect = efct;
        }.bind(this);

        if (!this.hideTile) {
            EffectAPI.buildEffectClassByConfigId('additive_stamps_8x8', 'effect_character_indicator',  effectCb)
        }

    }

    setTileIndex = function(indexX, indexY, gridI, gridJ) {
        this.tileX = indexX;
        this.tileZ = indexY;

        this.gridI = gridI;
        this.gridJ = gridJ;

    //    this.gridTile.setTileXZ(indexX, indexY);
        this.obj3d.position.x = indexX*this.spacing;
        this.obj3d.position.z = indexY*this.spacing;
        let height = ThreeAPI.terrainAt(this.obj3d.position, this.groundNormal);
        this.obj3d.position.y = height + 0.01;

        if (this.hideTile) {
            return;
        }


        tempObj.lookAt(up);
        let pos = this.obj3d.position;
        let slope = 0;
        let spriteX = this.defaultSprite[0];
        let spriteY = this.defaultSprite[1];
        let r = 0;
        let g = 0.2;
        let b = 0;
        let a = 0.3;

        this.walkable = false;
        this.blocking = false;
        if (height < 0.1) {
            this.obj3d.position.y = 0.1;
            spriteX = 6;
            spriteY = 5;
            r = 0.1;
            g = 0.1;
            b = 1.0;
            a = 1;
        } else {
            this.obj3d.position.y = height + 0.01;

            ThreeAPI.groundAt(pos, this.groundData)

            slope = this.groundNormal.angleTo(up);

            if (slope > 0.65) {
                spriteX = 6;
                spriteY = 2;
                r = 0.2;
                g = 0;
                b = 0;
                a = 1;
                tempObj.lookAt(this.groundNormal);
            } else {
                this.walkable = true;
                tempObj.rotateX(Math.sin(this.groundNormal.z) * 0.5);
                tempObj.rotateY(Math.sin(this.groundNormal.x) * 0.5);
                this.obj3d.position.y += 0.05 + 0.55 * slope;

                if (this.groundData.y > 0.2) {
                    r = 0.05;
                    g = 0.1;
                    b = 0;
                }
                if (this.groundData.y > 0.32) {
                    r = 0.15;
                    g = 0.12;
                    b = 0;
                    spriteX = 6;
                    spriteY = 3;

                }
                if (this.groundData.y > 0.52) {
                    spriteX = 6;
                    spriteY = 4;
                    r = 1.0;
                    g = 0.0;
                    b = 0.0;
                    a = 0.6;
                    this.walkable = false;
                    this.blocking = true;
                }

                if (this.groundData.z > 0.05) {
                    r = 0.0;
                    g = 0.05;
                    b = 0.4;
                }
            }
        }

        this.rgba.r = r;
        this.rgba.g = g;
        this.rgba.b = b;
        this.rgba.a = a;

        this.groundSprite[0] = spriteX;
        this.groundSprite[1] = spriteY;

        this.tileEffect.setEffectSpriteXY(this.groundSprite[0], this.groundSprite[1]);
        this.tileEffect.setEffectColorRGBA(CombatFxUtils.setRgba(r, g, b, a))
        this.tileEffect.setEffectPosition(pos)
        this.tileEffect.setEffectQuaternion(tempObj.quaternion);
    }

    indicatePath = function() {
    //    this.tileEffect.setEffectSpriteXY(7, 1);
        this.tileEffect.setEffectColorRGBA(CombatFxUtils.setRgba(this.rgba.r*4, this.rgba.g*4, this.rgba.b*4, this.rgba.a*4))
    }

    clearPathIndication = function() {
    //    this.tileEffect.setEffectSpriteXY(this.groundSprite[0], this.groundSprite[1]);
        this.tileEffect.setEffectColorRGBA(CombatFxUtils.setRgba(this.rgba.r, this.rgba.g, this.rgba.b, this.rgba.a))
    }

    getPos = function() {
        return this.obj3d.position;
    }

    getTileExtents(minStore, maxStore) {
        let pos = this.getPos();
        minStore.x = pos.x - this.spacing*0.5;
        minStore.y = pos.y - this.spacing*0.5;
        minStore.z = pos.z - this.spacing*0.5;
        maxStore.copy(minStore);
        maxStore.x += this.spacing;
        maxStore.y += this.spacing;
        maxStore.z += this.spacing;
    }

    getNormal = function() {
        return this.groundNormal;
    }

    removeTile = function () {
        if (this.tileEffect) {
            this.tileEffect.recoverEffectOfClass();
        }
        poolReturn(this);
    }

    updateDynamicTile = function() {
    //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:this.obj3d.position, color:'RED', size:0.3});
    }

}

export {DynamicTile}