import * as CombatFxUtils from "../combat/feedback/CombatFxUtils.js";

let index = 0;
import { Object3D } from "../../../libs/three/core/Object3D.js";
import { Vector3 } from "../../../libs/three/math/Vector3.js";

let up = new Vector3(0, 1, 0)
let tempObj = new Object3D()
class VisualTile {
    constructor() {
        index++
    //    console.log("VisualTiles: ", index)
        this.effects = [];
    }

    visualizeDynamicTile(dynamicTile) {


        this.rgba = {
            r : 0,
            g : 1,
            b : 0,
            a : 1
        }

        let effects = this.effects;

        let effectCb = function(efct) {

            efct.activateEffectFromConfigId(true)

            efct.setEffectQuaternion(dynamicTile.obj3d.quaternion);
            efct.setEffectPosition(dynamicTile.obj3d.position);
            efct.setEffectSpriteXY(dynamicTile.defaultSprite[0], dynamicTile.defaultSprite[1]);
            efct.scaleEffectSize( dynamicTile.defaultSize)

            effects.push(efct);
        };

        EffectAPI.buildEffectClassByConfigId('overlay_stamps_8x8', 'stamp_overlay_pool',  effectCb)
        EffectAPI.buildEffectClassByConfigId('additive_stamps_8x8', 'stamp_additive_pool',  effectCb)
    }

    setTilePosition(pos) {
        for (let i = 0; i < this.effects.length; i++) {
            this.effects[i].setEffectPosition(pos)
        }
    }

    setTileQuat(quat) {
        for (let i = 0; i < this.effects.length; i++) {
            this.effects[i].setEffectQuaternion(quat)
        }
    }

    setTileSpriteXY(x, y) {
        for (let i = 0; i < this.effects.length; i++) {
            this.effects[i].setEffectSpriteXY(x, y)
        }
    }
    setTileColor(rgba) {
        for (let i = 0; i < this.effects.length; i++) {
            this.effects[i].setEffectColorRGBA(rgba)

        }
    }

    dynamicTileUpdated(dynamicTile) {

        tempObj.lookAt(up);
        let pos = dynamicTile.obj3d.position;
        let height = pos.y;
        let slope = 0;
        let spriteX = dynamicTile.defaultSprite[0];
        let spriteY = dynamicTile.defaultSprite[1];
        let r = 0.05;
        let g = 0.16;
        let b = 0.05;
        let a = 0.25;

        dynamicTile.walkable = false;
        dynamicTile.blocking = false;
        if (height < 0.01) {
            dynamicTile.obj3d.position.y = 0.1;
            spriteX = 6;
            spriteY = 5;
            r = 0.1;
            g = 0.1;
            b = 1.0;
        } else {
            dynamicTile.obj3d.position.y = height + 0.01;

            ThreeAPI.groundAt(pos, dynamicTile.groundData)

            slope = dynamicTile.groundNormal.angleTo(up);

            if (slope > 0.65) {
                spriteX = 6;
                spriteY = 2;
                r = 0.12;
                g = 0;
                b = 0;
                tempObj.lookAt(dynamicTile.groundNormal);
            } else {
                dynamicTile.walkable = true;
                tempObj.rotateX(Math.sin(dynamicTile.groundNormal.z) * 0.5);
                tempObj.rotateY(Math.sin(dynamicTile.groundNormal.x) * 0.5);
                dynamicTile.obj3d.position.y += 0.05 + 0.55 * slope;

                if (dynamicTile.groundData.y > 0.2) {
                    r = 0.0;
                    g = 0.2;
                    b = 0;
                }
                if (dynamicTile.groundData.y > 0.32) {
                    r = 0.12;
                    g = 0.07;
                    b = 0;
                    spriteX = 6;
                    spriteY = 3;

                }
                if (dynamicTile.groundData.y > 0.52) {
                    spriteX = 6;
                    spriteY = 4;
                    r = 0.12;
                    g = 0.0;
                    b = 0.0;
                    a = 0.85;
                    dynamicTile.walkable = false;
                    dynamicTile.blocking = true;
                }

                if (dynamicTile.groundData.z > 0.05) {
                    r = 0.0;
                    g = 0.05;
                    b = 0.6;
                }
            }
        }

        this.rgba.r = r;
        this.rgba.g = g;
        this.rgba.b = b;
        this.rgba.a = a;

        dynamicTile.groundSprite[0] = spriteX;
        dynamicTile.groundSprite[1] = spriteY;

        this.setTileSpriteXY(spriteX, spriteY);
        this.setTileColor(this.rgba)
        this.setTilePosition(pos)
        this.setTileQuat(tempObj.quaternion);
    }

    recoverVisualTile() {
        while (this.effects.length) {
            let fx = this.effects.pop();
            fx.recoverEffectOfClass()
        }
    }

}

export { VisualTile }