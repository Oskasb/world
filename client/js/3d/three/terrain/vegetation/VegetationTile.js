import {borrowBox, cubeTestVisibility} from "../../../../application/utils/ModelUtils.js";

let index = 0;
let boxColor = {}
class VegetationTile {
    constructor() {
        this.index = index;
        index++
        this.dynamicGridTile = null;
        this.isVisible = -1;
        this.nearness = 1;
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

    processTileVisibility(maxDistance, lodCenter, updateCB, frame) {

            let wasVisible = this.isVisible;
            let dynamicGridTile = this.dynamicGridTile;
            let pos = dynamicGridTile.getPos()
            let spacing = dynamicGridTile.spacing;

            this.isVisible = cubeTestVisibility(pos,  spacing)

            if (this.isVisible === -1) {
                let borrowedBox = borrowBox();
                borrowedBox.min.y = pos.y;
                borrowedBox.max.y = pos.y;
                evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, {min:borrowedBox.min, max:borrowedBox.max, color:'BLUE'})
                evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:pos, to:borrowedBox.max, color:'BLUE'});
            }

    //    if (wasVisible !== this.isVisible) {
            updateCB(this, frame)
    //    }
    }

}

export {VegetationTile}