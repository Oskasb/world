import {DynamicGrid} from "../../../../game/gameworld/DynamicGrid.js";
import {cubeTestVisibility} from "../../../ModelUtils.js";
import {VegetationTile} from "./VegetationTile.js";
import {VegetationPatch} from "./VegetationPatch.js";
import {poolFetch, poolReturn, registerPool} from "../../../../application/utils/PoolUtils.js";

class VegetationLodGrid {
    constructor() {
        this.dynamicGrid = poolFetch( 'DynamicGrid')
        this.vegetationTiles = [];
        this.vegetationPatches = [];
    }


    activateLodGrid(config, plantsConfig) {
        this.plantsConfig = plantsConfig;
        this.plantList = config['plants'];
        this.maxPlants = config['max_plants'];
        this.maxDistance = config['tile_range'] * config['tile_spacing'];
        this.dynamicGrid.activateDynamicGrid(config)

        let tiles = this.dynamicGrid.dynamicGridTiles;
        for (let i = 0; i < tiles.length; i++) {
            for (let j = 0; j < tiles[i].length;j++) {
                let vegTile = poolFetch('VegetationTile');
                vegTile.setDynamicTile(tiles[i][j])
                this.vegetationTiles.push(vegTile);
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
                    patch.setVegTile(tile, this.plantsConfig, this.plantList, this.maxPlants);
                } else {
                    MATH.splice(this.vegetationPatches, patch);
                    patch.recoverVegetationPatch();
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

        for (let i = 0; i < this.vegetationPatches.length; i++) {
            let patch = this.vegetationPatches[i];
            patch.applyGridVisibility()
        }
    //    }

    }

    deactivateLodGrid() {
        while (this.vegetationPatches.length) {
            let patch = this.vegetationPatches.pop();
            patch.recoverVegetationPatch();
            poolReturn(patch)
        }

        while (this.vegetationTiles.length) {
            let vegTile = this.vegetationTiles.pop();
            poolReturn(vegTile);
        }

        this.dynamicGrid.deactivateDynamicGrid();
        poolReturn(this.dynamicGrid);
    }

}

export { VegetationLodGrid }