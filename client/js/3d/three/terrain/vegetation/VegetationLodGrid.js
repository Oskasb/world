import {DynamicGrid} from "../../../../game/gameworld/DynamicGrid.js";

let config = {

}

config['elevation'] = 0.1;
config['tile_size'] = 5;
config['tile_range'] = 5;
class VegetationLodGrid {
    constructor() {
        this.maxDistance = 100;
        this.sectors = 4;
        this.dynamicGrid = new DynamicGrid()
    }


    activateLodGrid(cfg) {
        this.maxDistance = cfg['max_distance'];
        this.sectors = cfg['sectors'];
        this.dynamicGrid.activateDynamicGrid(config)
    }

    updateVegLodGrid(lodCenter) {
        let centerTile = this.dynamicGrid.getTileAtPosition(lodCenter);
        this.dynamicGrid.updateDynamicGrid(centerTile.tileX, centerTile.tileZ)
    }

}

export { VegetationLodGrid }