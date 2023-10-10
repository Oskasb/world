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

    processTileVisibility(maxDistance, lodCenter) {
        let dynamicGridTile = this.dynamicGridTile;
        let pos = dynamicGridTile.getPos()
        let lodDistance = pos.distanceTo(lodCenter)
        let rgba = dynamicGridTile.rgba
        let tileSize = dynamicGridTile.spacing
        let farness = MATH.calcFraction(0, maxDistance - tileSize*2, lodDistance * 2.0 -tileSize*2)
        let nearness = MATH.clamp(1-farness, 0, 1);
        let isVisible = cubeTestVisibility(pos,  tileSize * nearness)
        let borrowedBox = borrowBox();

        /*
        if (this.nearness > nearness) {
            this.nearness = 1-farness*0.5;
        } else {

        }

         */

        this.nearness = nearness;
        this.isVisible = false;
        if (isVisible) {

            if (nearness > 0) {
                this.isVisible = true;
        //        evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, {min:borrowedBox.min, max:borrowedBox.max, color:'CYAN'})
            } else {
         //       evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, {min:borrowedBox.min, max:borrowedBox.max, color:'BLACK'})
            }
        }

    }

}

export {VegetationTile}