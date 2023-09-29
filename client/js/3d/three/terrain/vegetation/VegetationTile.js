import {borrowBox, cubeTestVisibility} from "../../../ModelUtils.js";

let index = 0;
let boxColor = {}
class VegetationTile {
    constructor() {
        this.index = index;
        index++
        this.dynamicGridTile = null;
        this.isVisible = false;
    }

    setDynamicTile(dynamicGridTile) {
        this.dynamicGridTile = dynamicGridTile;
        this.isVisible = false;
    }

    getPos() {
        return this.dynamicGridTile.getPos();
    }

    getExtents(minStore, maxStore) {
        return this.dynamicGridTile.getTileExtents(minStore, maxStore);
    }

    processTileVisibility(maxDistance) {
        let dynamicGridTile = this.dynamicGridTile;
        let pos = dynamicGridTile.getPos()
        let camDistSQ = pos.distanceTo(ThreeAPI.getCamera().position)
        let rgba = dynamicGridTile.rgba
        let tileSize = dynamicGridTile.spacing
        let isVisible = cubeTestVisibility(pos,  tileSize * 0.8)
        let borrowedBox = borrowBox();
        let farness = MATH.clamp( MATH.curveSigmoid( (camDistSQ - 5) / maxDistance) * 1.1, 0, 1)
        let nearness = 1-farness;
        if (this.nearness > nearness) {
            this.nearness = 1-farness*0.5;
        } else {
            this.nearness = nearness;
        }

        this.isVisible = false;
        if (isVisible) {

            if (nearness > 0) {
                this.isVisible = true;
            //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, {min:borrowedBox.min, max:borrowedBox.max, color:boxColor})
            }
        }

    }

}

export {VegetationTile}