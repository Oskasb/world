import { Vector3 } from "../../../libs/three/math/Vector3.js";
import {Object3D} from "../../../libs/three/core/Object3D.js";
import * as CombatFxOptions from "../combat/feedback/CombatFxOptions.js";
import * as CombatFxUtils from "../combat/feedback/CombatFxUtils.js";
import {GridTile} from "../gamescenarios/GridTile.js";
import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";
import {aaBoxTestVisibility, borrowBox, cubeTestVisibility} from "../../3d/ModelUtils.js";

let up = new Vector3(0, 1, 0)
let tempVec = new Vector3();
let tempObj = new Object3D();
let index = 0;
class DynamicTile {
    constructor() {
        this.index = index;
        index ++;
        this.step = 0;
        this.offset = 0;
    }

    activateTile = function(defaultSprite, defaultSize, spacing, hideTile, centerOffset, debug) {
        this.defaultSprite = defaultSprite || [7, 3]

        this.debug = debug;
        this.hideTile = hideTile;
        this.spacing = spacing || 1;

        if (centerOffset) {
            this.offset = spacing * 0.5
        } else {
            this.offset = 0;
        }

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

        this.visualTile = null;
        if (!this.hideTile) {
            this.visualTile = poolFetch('VisualTile');
            this.visualTile.visualizeDynamicTile(this);
       //     EffectAPI.buildEffectClassByConfigId('overlay_stamps_8x8', 'stamp_overlay_pool',  effectCb)
       //     EffectAPI.buildEffectClassByConfigId('additive_stamps_8x8', 'stamp_additive_pool',  effectCb)
        }

    }

    setTileIndex = function(indexX, indexY, gridI, gridJ) {
        this.tileX = indexX;
        this.tileZ = indexY;

        this.gridI = gridI;
        this.gridJ = gridJ;

    //    this.gridTile.setTileXZ(indexX, indexY);
        this.obj3d.position.x = indexX*this.spacing + this.offset
        this.obj3d.position.z = indexY*this.spacing + this.offset;
        let height = ThreeAPI.terrainAt(this.obj3d.position, this.groundNormal);
        this.obj3d.position.y = height+0.05;
        if (this.visualTile) {
            this.visualTile.dynamicTileUpdated(this)
        }

    }

    indicatePath = function() {
    //    this.tileEffect.setEffectSpriteXY(7, 1);
        if (this.visualTile) {
            let rgba = this.visualTile.rgba;
            this.visualTile.setTileColor(CombatFxUtils.setRgba(rgba.r*2, rgba.g*2, rgba.b*2, rgba.a*2))
        }
    //    this.tileEffect.setEffectColorRGBA(CombatFxUtils.setRgba(this.rgba.r*4, this.rgba.g*4, this.rgba.b*4, this.rgba.a*4))
    }

    clearPathIndication = function() {
        if (this.visualTile) {
            let rgba = this.visualTile.rgba;
            this.visualTile.setTileColor(CombatFxUtils.setRgba(rgba.r, rgba.g, rgba.b, rgba.a))
        }
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
        if (this.visualTile) {
            this.visualTile.recoverVisualTile();
            poolReturn(this.visualTile);
            this.visualTile = null;
        }
        poolReturn(this);
    }

    processDynamicTileVisibility = function(maxDistance, lodLevels, lodCenter,  tileUpdateCallback, coarseness) {

        if (coarseness) {
            this.step++;
            if ((this.index+this.step) % coarseness !== 1) {
                tileUpdateCallback(this)
                return;
            }
        }

        let dynamicGridTile = this;
        let pos = this.getPos()
        let lodDistance = pos.distanceTo(lodCenter)
        let rgba = this.rgba
        let tileSize = this.spacing*1.1

        let isVisible = aaBoxTestVisibility(pos,  tileSize, tileSize*2, tileSize)
        let borrowedBox = borrowBox();
        let farness = MATH.calcFraction(0, maxDistance, lodDistance * 2.0)  //MATH.clamp( (camDist / maxDistance) * 1.0, 0, 1)
        let nearness = 1-farness;
        let lodLevel = Math.floor(farness * (lodLevels));
        if (this.nearness > nearness) {
            this.nearness = 1-farness*0.5;
        } else {
            this.nearness = nearness;
        }

        this.isVisible = false;
        this.lodLevel = lodLevel;
        if (isVisible) {

            if (nearness > 0) {
                this.isVisible = true;
                if (this.debug) {
                    let color = {x:MATH.sillyRandom(lodLevel), y:Math.sin(lodLevel*1.8), z:Math.cos(lodLevel), w:1}
                    this.debugDrawTilePosition(nearness*nearness*tileSize*0.5, color)
                    evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, {min:borrowedBox.min, max:borrowedBox.max, color:color})
                }
            } else {
                if (this.debug) {
                    this.debugDrawTilePosition(nearness*nearness*tileSize, 'BLACK')
                    evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, {min:borrowedBox.min, max:borrowedBox.max, color:'BLACK'})
                }

            }
        } else {
            this.lodLevel = -1;
        }
        tileUpdateCallback(this)
    }

    debugDrawTilePosition(size, color) {
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:this.obj3d.position, color:color || 'RED', size: size || 1});
    }
    updateDynamicTile = function() {
        if (this.debug) {

        }
    //
    }

}

export {DynamicTile}