import {DynamicGrid} from "../../../../game/gameworld/DynamicGrid.js";
import {cubeTestVisibility} from "../../../ModelUtils.js";
import {VegetationTile} from "./VegetationTile.js";
import {VegetationPatch} from "./VegetationPatch.js";
import {poolFetch, poolReturn, registerPool} from "../../../../application/utils/PoolUtils.js";

class VegetationLodGrid {
    constructor() {
        this.dynamicGrid = new DynamicGrid()
        this.vegetationTiles = [];
        this.vegetationPatches = [];
    }


    activateLodGrid(config) {
        this.maxDistance = config['tile_range'] * config['tile_spacing'];
        this.dynamicGrid.activateDynamicGrid(config)

        registerPool(VegetationPatch);

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

    getPatchByPosition(pos) {
        let patch = null;
        for (let i = 0; i < this.vegetationPatches.length; i++) {
            patch = this.vegetationPatches[i];
            if (patch.position.x === pos.x && patch.position.z === pos.z) {

                return patch;
            }
        }

        patch = poolFetch('VegetationPatch')
        this.vegetationPatches.push(patch)
        return patch;
    }

    refitPatches(tiles) {
        for (let i = 0; i < tiles.length; i++) {
                let tile = tiles[i];
            let patch = this.getPatchByPosition(tile.getPos());
                if (tile.isVisible) {
                    patch.setVegTile(tile);
                } else {
                    MATH.splice(this.vegetationPatches, patch);
                    poolReturn(patch)
                }
        }

    }

    updateVegLodGrid(lodCenter) {
        let centerTile = this.dynamicGrid.getTileAtPosition(lodCenter);
        this.dynamicGrid.updateDynamicGrid(centerTile.tileX, centerTile.tileZ)
        this.processLodVisibility()
    //    if (this.dynamicGrid.updated) {
            this.refitPatches(this.vegetationTiles);
    //    }

    }

}

export { VegetationLodGrid }