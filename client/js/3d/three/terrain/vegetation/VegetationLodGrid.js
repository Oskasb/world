import {DynamicGrid} from "../../../../game/gameworld/DynamicGrid.js";
import {cubeTestVisibility} from "../../../ModelUtils.js";
import {VegetationTile} from "./VegetationTile.js";
import {VegetationPatch} from "./VegetationPatch.js";
import {poolFetch, poolReturn, registerPool} from "../../../../application/utils/PoolUtils.js";
import {Vector3} from "../../../../../libs/three/math/Vector3.js";


class VegetationLodGrid {
    constructor() {
        this.dynamicGrid = poolFetch( 'DynamicGrid')
        this.vegetationTiles = [];
        this.vegetationPatches = [];
        this.lastLodCenter = new Vector3();

        let hideTile = function(tile, frame) {
            let patch = this.getPatchByTile(tile);
            if (this.vegetationPatches.indexOf(patch) !== -1) {
                MATH.splice(this.vegetationPatches, patch);
                patch.recoverVegetationPatch();
            }
        }.bind(this)

        this.call = {
            hideTile:hideTile
        }

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


    processLodVisibility(lodCenter, frame) {
        if (this.lastLodCenter.distanceToSquared(lodCenter) > 0.0) {
            let tiles = this.vegetationTiles;
            for (let i = 0; i < tiles.length; i++) {
                tiles[i].processTileVisibility(this.maxDistance, lodCenter, this.call.hideTile, frame)
            }
            this.lastLodCenter.copy(lodCenter);
        }
    }

    getPatchByTile(tile) {
        let patch = null;
        for (let i = 0; i < this.vegetationPatches.length; i++) {
            patch = this.vegetationPatches[i];
            if (patch.vegetationTile  === tile) {
                evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: tile.getPos(), color:'WHITE', size:1.2})
                return patch;
            }
        }
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: tile.getPos(), color:'RED', size:1.2})
        return this.requestNewPatchForTile(tile)
    }

    requestNewPatchForTile(tile) {
        let patch = poolFetch('VegetationPatch')
        patch.setVegTile(tile);
        this.vegetationPatches.push(patch)
        return patch;
    }

    refitPatches(tiles) {
        for (let i = 0; i < tiles.length; i++) {
            let tile = tiles[i];
            let patch = this.getPatchByTile(tile);
                if (tile.isVisible) {
                    patch.setVegTile(tile, this.plantsConfig, this.plantList, this.maxPlants);
                } else {
                    tile.nearness = 0;
                    if (this.vegetationPatches.indexOf(patch) !== -1) {
                        MATH.splice(this.vegetationPatches, patch);
                        patch.recoverVegetationPatch();
                    }
                }
        }

    }

    updateVegLodGrid(lodCenter, frame) {
        let centerTile = this.dynamicGrid.getTileAtPosition(lodCenter);
        this.dynamicGrid.updateDynamicGrid(centerTile.tileX, centerTile.tileZ)
        this.processLodVisibility(lodCenter, frame)
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
        }

        while (this.vegetationTiles.length) {
            let vegTile = this.vegetationTiles.pop();
            poolReturn(vegTile);
        }

        this.dynamicGrid.deactivateDynamicGrid();
        poolReturn(this.dynamicGrid);
    }

    rebuildLodGrid() {

    }

}

export { VegetationLodGrid }