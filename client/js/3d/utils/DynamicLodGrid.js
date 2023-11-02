import {DynamicGrid} from "../../game/gameworld/DynamicGrid.js";
import {cubeTestVisibility} from "../ModelUtils.js";
import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";
import { Vector3 } from "../../../libs/three/math/Vector3.js";

class DynamicLodGrid {
    constructor() {
        this.lastLodCenter = new Vector3();
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


    processLodVisibility(lodCenter, tileUpdateCallback, coarseness) {
        let tiles = this.dynamicGrid.dynamicGridTiles;
        for (let i = 0; i < tiles.length; i++) {
            for (let j = 0; j < tiles[i].length;j++) {
                let tile = tiles[i][j];
                tile.processDynamicTileVisibility(this.maxDistance, this.lodLevels, lodCenter,  tileUpdateCallback, coarseness)
                if (this.debug) {
                //    tile.debugDrawTilePosition(2, 'RED');
                }

            }
        }
    }

    getTiles = function() {
        return this.dynamicGrid.dynamicGridTiles;
    }

    updateDynamicLodGrid(lodCenter, tileUpdateCallback, coarseness) {
    //    if (this.lastLodCenter.distanceToSquared(lodCenter) > 0.01) {

            let centerTile = this.dynamicGrid.getTileAtPosition(lodCenter);
            this.dynamicGrid.updateDynamicGrid(centerTile.tileX, centerTile.tileZ)
            this.lastLodCenter.copy(lodCenter);
            this.processLodVisibility(this.lastLodCenter, tileUpdateCallback, coarseness)


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