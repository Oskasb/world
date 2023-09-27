import {DynamicTile} from "./DynamicTile.js";
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
        registerPool(DynamicTile)
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

        this.elevation =  config['elevation'];
        this.tileSpacing = config['tile_spacing'];
        this.tileSize =  config['tile_size'];
        this.stepHeight = config['step_height'];
        this.tileRange =  config['tile_range'];

        for (let i = 0; i < this.tileRange; i++) {

            this.dynamicGridTiles[i] = [];

            for (let j = 0; j < this.tileRange; j++) {
                let tile = poolFetch('DynamicTile')
                tile.activateTile(null, this.tileSize, this.tileSpacing);
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
            this.updated = true;
        } else {
            this.updated = false;
        }

        this.gridCenterPos.set(centerTileIndexX, 0,  centerTileIndexY)
        this.gridCenterPos.y = ThreeAPI.terrainAt(this.gridCenterPos);
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:this.gridCenterPos, color:'WHITE', size:this.tileSize * 0.5});

        renderDynamicTiles(this, this.dynamicGridTiles)

    }

}


export {DynamicGrid}