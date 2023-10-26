import { Vector3 } from "../../../libs/three/math/Vector3.js";
import * as ScenarioUtils from "./ScenarioUtils.js";
import {registerPool, poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";

let moveCenterTileTo = function(dynamicGrid, centerTileIndexX, centerTileIndexY) {
    dynamicGrid.moveX = centerTileIndexX - dynamicGrid.centerTileIndexX;
    dynamicGrid.moveY = centerTileIndexY - dynamicGrid.centerTileIndexY;
    dynamicGrid.centerTileIndexX = centerTileIndexX;
    dynamicGrid.centerTileIndexY = centerTileIndexY;
}

let updateTileIndices = function(dynamicGrid, dynamicGridTiles) {
    let half = Math.floor(dynamicGridTiles.length / 2)
    for (let i = 0; i < dynamicGridTiles.length; i++) {

        for (let j = 0; j < dynamicGridTiles[i].length; j++) {
            let dynamicTile = dynamicGridTiles[i][j];
            dynamicTile.setTileIndex(dynamicGrid.centerTileIndexX + i -half, dynamicGrid.centerTileIndexY + j-half, i, j)
        //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: dynamicTile.obj3d.position, color:'WHITE', size:1.2})
        //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:ThreeAPI.getCameraCursor().getPos(), to:dynamicTile.obj3d.position, color:'WHITE', drawFrames:20});
        }
    }
}

let renderDynamicTiles = function(dynamicGrid, dynamicGridTiles) {
    for (let i = 0; i < dynamicGridTiles.length; i++) {
        for (let j = 0; j < dynamicGridTiles[i].length; j++) {
            let dynamicTile = dynamicGridTiles[i][j];
            dynamicTile.updateDynamicTile()
        }
    }
}



class DynamicGrid {
    constructor() {
        this.gridCenterPos = new Vector3();
        this.centerTileIndexX = 0;
        this.centerTileIndexY = 0;
        this.moveX = 0;
        this.moveY = 0;
        this.dynamicGridTiles = [];
        this.config = null;
        this.gridTiles = [];
    }

    activateDynamicGrid = function(config) {
        this.config = config;

        this.elevation =  config['elevation'] || 0;
        this.tileSpacing = config['tile_spacing'];
        this.tileSize =  config['tile_size'] || 1;
        this.stepHeight = config['step_height'] || 0;
        this.tileRange =  config['tile_range'];
        this.hideTiles = config['hide_tiles'] || false;
        this.centerOffset = config['center_offset'] || false;
        this.debug = config['debug'] || false;

        for (let i = 0; i < this.tileRange; i++) {

            this.dynamicGridTiles[i] = [];

            for (let j = 0; j < this.tileRange; j++) {
                let tile = poolFetch('DynamicTile')
                tile.activateTile(null, this.tileSize, this.tileSpacing, this.hideTiles, this.centerOffset, this.debug);
                this.dynamicGridTiles[i][j] = tile;
            }
        }

        this.centerTileIndexX = -1;
        this.centerTileIndexY = -1;

    }

    deactivateDynamicGrid = function() {

        while (this.dynamicGridTiles.length) {
            let row = this.dynamicGridTiles.pop();
            while (row.length) {
                let tile = row.pop();
                tile.removeTile();
            }
        }

    }

    getTileAtPosition(posVec3) {
        return ScenarioUtils.getTileForPosition(this.dynamicGridTiles, posVec3)
    }

    updateDynamicGrid = function(centerTileIndexX, centerTileIndexY) {

        if (centerTileIndexX !== this.centerTileIndexX || centerTileIndexY !== this.centerTileIndexY) {
            moveCenterTileTo(this, centerTileIndexX, centerTileIndexY)
            updateTileIndices(this, this.dynamicGridTiles)
            this.gridCenterPos.set(centerTileIndexX, 0,  centerTileIndexY)
            this.gridCenterPos.y = ThreeAPI.terrainAt(this.gridCenterPos);
            this.updated = true;
        } else {
            this.updated = false;
        }

    }

}


export {DynamicGrid}