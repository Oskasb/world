import {ConfigData} from "../../application/utils/ConfigData.js";
import * as ScenarioUtils from "../gameworld/ScenarioUtils.js";
import {Vector3} from "../../../libs/three/math/Vector3.js";
import {filterForWalkableTiles} from "../gameworld/ScenarioUtils.js";

let initPos = new Vector3();
let forward = new Vector3();

let store = [];

class EncounterGrid {
    constructor() {
        this.gridTiles = [];
        this.instances = [];
        this.minXYZ = new Vector3();
        this.maxXYZ = new Vector3();
        this.configData = new ConfigData("GRID", "ENCOUNTER_GRIDS",  'grid_main_data', 'data_key', 'config')
    }

    initEncounterGrid(gridId, pos, gridLoaded, forwardVec) {
        initPos.copy(pos);
        if (forwardVec) {
            forward.copy(forwardVec);
        } else {
            forward.set(0, 0, 0);
        }


        let onConfig = function(config, updateCount) {
            //    console.log("Update Count: ", updateCount, config)
            if (updateCount) {
                GuiAPI.printDebugText("REFLOW GRID")
                this.removeEncounterGrid();
            } else {
                setTimeout(function() {
                //    onReady(this);
                }, 0);
            }
            this.applyGridConfig(config, initPos, forward);
            gridLoaded(this);
        }.bind(this)

        this.configData.parseConfig(gridId, onConfig)
    }

    getPlayerEntranceTile() {
        let row = this.entranceTile[0];
        let col = this.gridTiles[0].length - this.entranceTile[1];
        return this.gridTiles[row][col]
    }

    getTileByRowCol(x, y) {
        let row = x;
        let col = this.gridTiles[0].length - y -1;
        return this.gridTiles[row][col]
    }

    getPlayerStartTile() {
        let row = this.startTile[0];
        let col = this.gridTiles[0].length - this.startTile[1];
        return this.gridTiles[row][col]
    }
    applyGridConfig(config, pos, forward) {
        this.entranceTile = [3, 3];
        this.startTile =  [3, 3];
        ScenarioUtils.setupEncounterGrid(this.gridTiles, this.instances, config, pos, forward, this.minXYZ , this.maxXYZ )
    }

    getRandomWalkableTiles(count) {
        let tiles = filterForWalkableTiles(this.gridTiles);

        if (tiles.length < count) {
            console.log("Not enought tiles", tiles)
        }

        let walkableTiles = [];

        for (let i = 0; i < count; i++) {
            let tile = MATH.getRandomArrayEntry(tiles);
            MATH.quickSplice(tiles, tile)
            walkableTiles.push(tile);
        }
        return walkableTiles;

    }

    getTileAtPosition(posVec3) {
        return ScenarioUtils.getTileForPosition(this.gridTiles, posVec3)
    }

    removeEncounterGrid() {
        while (this.gridTiles.length) {
            let col = this.gridTiles.pop()
            while (col.length) {
                let tile = col.pop();
                tile.removeTile();
            }
        }
    }

}

export { EncounterGrid }