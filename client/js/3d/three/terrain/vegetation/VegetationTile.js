import {borrowBox, cubeTestVisibility} from "../../../ModelUtils.js";

let index = 0;
let boxColor = {r:1, g:1, b:1}
class VegetationTile {
    constructor(dynamicGridTile) {
        this.index = index;
        index++
        this.dynamicGridTile = dynamicGridTile;
    }


    getPos() {
        return this.dynamicGridTile.getPos();
    }

    processTileVisibility(maxDistance) {
        let dynamicGridTile = this.dynamicGridTile;
        let pos = dynamicGridTile.getPos()
        let camDistSQ = pos.distanceTo(ThreeAPI.getCamera().position)
        let rgba = dynamicGridTile.rgba
        let tileSize = dynamicGridTile.spacing
        let isVisible = cubeTestVisibility(pos,  tileSize * 0.1)
        let borrowedBox = borrowBox();
        let farness = MATH.clamp( MATH.curveSigmoid( (camDistSQ - 5) / maxDistance) * 1.2, 0, 1)
        let nearness = 1-farness;

        if (isVisible) {
            rgba.r = farness;
            rgba.g = nearness;
            rgba.b = 0
            rgba.a = 0.15
            boxColor.x = Math.sin(this.index*1.1);
            boxColor.y = Math.cos(this.index*0.4);
            boxColor.z = Math.cos(this.index*1.5);
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, {min:borrowedBox.min, max:borrowedBox.max, color:boxColor})

        } else {
            rgba.r = 0;
            rgba.g = 0;
            rgba.b = 1
            rgba.a = 0.1
        }

        dynamicGridTile.tileEffect.setEffectColorRGBA(rgba)
    }
    updateVegetationTile() {

    }

}

export {VegetationTile}