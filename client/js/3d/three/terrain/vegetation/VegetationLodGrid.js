import {DynamicGrid} from "../../../../game/gameworld/DynamicGrid.js";
import {cubeTestVisibility} from "../../../ModelUtils.js";
import {VegetationTile} from "./VegetationTile.js";
import {VegetationPatch} from "./VegetationPatch.js";
import {poolFetch, poolReturn, registerPool} from "../../../../application/utils/PoolUtils.js";
import {Vector3} from "../../../../../libs/three/math/Vector3.js";

let releases = [];
class VegetationLodGrid {
    constructor() {
        this.dynamicGrid = poolFetch( 'DynamicGrid')
        this.vegetationTiles = [];
        this.vegetationPatches = [];

        let updateVisibility = function(tile, frame, nearness) {

            if (tile.isVisible === true) {
                let patch = this.getPatchByPosition(tile.getPos());
                if (!patch) {
                    patch = this.getFreePatch()
                    if (!patch) {
                    //    patch = this.requestNewPatch()
                    }
                    patch.clearVegPatch();
                    patch.setVegTile(tile, this.plantsConfig, this.plantList, this.maxPlants);
                }
            } else {
                releases.push(tile);
            }

        }.bind(this)

        this.call = {
            updateVisibility:updateVisibility
        }

    }

    releaseTiles = function() {

        while (releases.length) {
            let vegTile = releases.pop();

            for (let i = 0; i < this.vegetationPatches.length; i++) {
                if (this.vegetationPatches[i].vegetationTile === vegTile) {
                    let patch = this.vegetationPatches[i]
                    this.vegetationPatches[i].vegetationTile = null;
                    patch.clearVegPatch();
                };
            }
        }
    }

    getFreePatch = function() {
        let nearness = 2;
        let patch = null;
        for (let i = 0; i < this.vegetationPatches.length; i++) {
            if (this.vegetationPatches[i].vegetationTile === null) {
                evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: this.vegetationPatches[i].position, color:'WHITE', size:1.2})
                return this.vegetationPatches[i];
            };
        }

        for (let i = 0; i < this.vegetationPatches.length; i++) {
                let tile = this.vegetationPatches[i].vegetationTile;
                if (tile.isVisible) {
                    if (this.vegetationPatches[i].nearness < nearness) {
                        patch = this.vegetationPatches[i];
                        nearness = tile.nearness;
                    } else {
                        nearness = -1;
                        evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: this.vegetationPatches[i].position, color:'BLUE', size:1.2})
                        return this.vegetationPatches[i];
                    }
                } else {
                    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: this.vegetationPatches[i].position, color:'GREEN', size:1.2})
                    return this.vegetationPatches[i]
                }

        }

        evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: patch.position, color:'YELLOW', size:1.2})
        return patch;
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
                let patch =  this.requestNewPatch()
                patch.setVegTile(vegTile, this.plantsConfig, this.plantList, this.maxPlants)
            }
        }
    }

    getPatchByPosition(pos) {
        let patch = null;

        for (let i = 0; i < this.vegetationPatches.length; i++) {
            patch = this.vegetationPatches[i];
            if (patch.position.x  === pos.x && patch.position.z === pos.z) {
            //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: pos, color:'WHITE', size:1.2})
                return patch;
            }
        }
        //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:ThreeAPI.getCameraCursor().getPos(), to:tile.getPos(), color:'YELLOW', drawFrames:10});

        //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: tile.getPos(), color:'RED', size:1.2})
    }

    getPatchByTile(tile) {
        let patch = null;

        for (let i = 0; i < this.vegetationPatches.length; i++) {
            patch = this.vegetationPatches[i];
            if (patch.vegetationTile  === tile) {
                //            evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: tile.getPos(), color:'WHITE', size:1.2})
                return patch;
            }
        }
        //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:ThreeAPI.getCameraCursor().getPos(), to:tile.getPos(), color:'YELLOW', drawFrames:10});

        //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: tile.getPos(), color:'RED', size:1.2})
    }

    requestNewPatch() {
        let patch = poolFetch('VegetationPatch')
    //    patch.clearVegPatch();
        this.vegetationPatches.push(patch)
        return patch;
    }

    refitPatches = function() {
        for (let i = 0; i < this.vegetationPatches.length; i++) {
            let patch = this.vegetationPatches[i];
            let tile = patch.vegetationTile
            if (tile.isVisible === false) {
                releases.push(tile);
            }
            //    patch.applyGridVisibility(tile.nearness)
        }
        // patch.setVegTile(tile, this.plantsConfig, this.plantList, this.maxPlants);
    }

    processLodVisibility(lodCenter, frame) {
        //    if (this.lastLodCenter.distanceToSquared(lodCenter) > 0.0) {
        let tiles = this.vegetationTiles;
        for (let i = 0; i < tiles.length; i++) {
            tiles[i].processTileVisibility(this.maxDistance, lodCenter, this.call.updateVisibility, frame)
        }
        //        this.lastLodCenter.copy(lodCenter);
        //    }
    }

    updateVegLodGrid(lodCenter, frame) {
        let centerTile = this.dynamicGrid.getTileAtPosition(lodCenter);

        this.dynamicGrid.updateDynamicGrid(centerTile.tileX, centerTile.tileZ)

        this.processLodVisibility(lodCenter, frame)

        this.releaseTiles();

        for (let i = 0; i < this.vegetationPatches.length; i++) {
            this.releaseTiles();
            let patch = this.vegetationPatches[i];
            let tile = patch.vegetationTile
            if (tile) {
                patch.processPatchVisibility()
                //    patch.isVisible = true;
                if (patch.isVisible) {
                    patch.processPatchNearness(this.maxDistance, lodCenter)
                    if (patch.nearness > 0) {
                        patch.applyGridVisibility(patch.nearness);
                    } else {
                        patch.nearness = 0;
                        releases.push(tile);
                    }
                } else {
                    patch.nearness = 0;
                    releases.push(tile);
                    patch.clearVegPatch()
                }
            } else {
                patch.nearness = 0;
                patch.clearVegPatch()
                //patch.applyGridVisibility(0)
            }
        }

        this.releaseTiles();
    //    this.freeWeakestPatch()
    }

    freeWeakestPatch() {
        let nearness = 1;
        let patch;
        let release = null;
        for (let i = 0; i < this.vegetationPatches.length; i++) {
            patch = this.vegetationPatches[i]
            if (patch.vegetationTile) {
                if (patch.nearness < nearness) {
                    nearness = patch.nearness;
                    release = patch.vegetationTile;
                }
            }
        }
        releases.push(release);
        this.releaseTiles();
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