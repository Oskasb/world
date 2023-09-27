import {DynamicGrid} from "../../../../game/gameworld/DynamicGrid.js";
import {cubeTestVisibility} from "../../../ModelUtils.js";
import {VegetationTile} from "./VegetationTile.js";

class VegetationLodGrid {
    constructor() {
        this.dynamicGrid = new DynamicGrid()
        this.vegetationTiles = [];
    }


    activateLodGrid(config) {
        this.maxDistance = config['tile_range'] * config['tile_spacing'];
        this.dynamicGrid.activateDynamicGrid(config)

        let tiles = this.dynamicGrid.dynamicGridTiles;
        for (let i = 0; i < tiles.length; i++) {
            for (let j = 0; j < tiles[i].length;j++) {
                this.vegetationTiles.push(new VegetationTile(tiles[i][j]));
            }
        }

    }


    processLodVisibility() {
        let tiles = this.vegetationTiles;
        for (let i = 0; i < tiles.length; i++) {
            tiles[i].processTileVisibility(this.maxDistance)
        }
    }

    updateVegLodGrid(lodCenter) {
        let centerTile = this.dynamicGrid.getTileAtPosition(lodCenter);
        this.dynamicGrid.updateDynamicGrid(centerTile.tileX, centerTile.tileZ)
    //    if (this.dynamicGrid.updated) {
            this.processLodVisibility()
    //    }

    }

}

export { VegetationLodGrid }