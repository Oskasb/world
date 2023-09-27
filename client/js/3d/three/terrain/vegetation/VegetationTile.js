import {cubeTestVisibility} from "../../../ModelUtils.js";

class VegetationTile {
    constructor(dynamicGridTile) {
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
        let farness = MATH.clamp( MATH.curveSigmoid( (camDistSQ - 5) / maxDistance) * 1.2, 0, 1)
        let nearness = 1-farness;

        if (isVisible) {
            rgba.r = farness;
            rgba.g = nearness;
            rgba.b = 0
            rgba.a = 0.15
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