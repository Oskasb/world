import {DynamicGrid} from "../../game/gameworld/DynamicGrid.js";
import {cubeTestVisibility} from "../ModelUtils.js";
import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";

class DynamicLodGrid {
    constructor() {
        this.dynamicGrid = poolFetch( 'DynamicGrid')
        this.lodElements = [];
    }


    activateLodGrid(config) {
        this.debug = config['debug'] || false;
        this.config = config;
        this.lodLevels = config['lod_levels'] || 6;
        this.maxDistance = config['tile_range'] * config['tile_spacing'];
        this.dynamicGrid.activateDynamicGrid(config)
    }


    processLodVisibility(lodCenter) {
        let tiles = this.dynamicGrid.dynamicGridTiles;
        for (let i = 0; i < tiles.length; i++) {
            for (let j = 0; j < tiles[i].length;j++) {
                let tile = tiles[i][j];
                tile.processDynamicTileVisibility(this.maxDistance, this.lodLevels, lodCenter)
                if (this.debug) {
                //    tile.debugDrawTilePosition(2, 'RED');
                }

            }
        }
    }

    getTiles = function() {
        return this.dynamicGrid.dynamicGridTiles;
    }

    updateDynamicLodGrid(lodCenter) {
        let centerTile = this.dynamicGrid.getTileAtPosition(lodCenter);
        this.dynamicGrid.updateDynamicGrid(centerTile.tileX, centerTile.tileZ)
        this.processLodVisibility(lodCenter)
    //    if (this.dynamicGrid.updated) {
     //       this.refitPatches(this.vegetationTiles);

    //    for (let i = 0; i < this.vegetationPatches.length; i++) {
    //        let patch = this.vegetationPatches[i];
    //        patch.applyGridVisibility()
    //    }
    //    }

    }

    deactivateLodGrid() {
        while (this.lodElements.length) {
            let element = this.lodElements.pop();
        //    poolReturn(patch)
        }

        this.dynamicGrid.deactivateDynamicGrid();
        poolReturn(this.dynamicGrid);
    }

    rebuildLodGrid() {

    }

}

export { DynamicLodGrid }