import {ConfigData} from "../../application/utils/ConfigData.js";
import * as ScenarioUtils from "../gameworld/ScenarioUtils.js";
import {Vector3} from "../../../libs/three/math/Vector3.js";
import {filterForWalkableTiles} from "../gameworld/ScenarioUtils.js";

let forward = new Vector3();
let tempVec = new Vector3()
let camHome = new Vector3()

let walkableTiles = [];

let store = [];

class EncounterGrid {
    constructor() {
        this.center = new Vector3();
        this.gridTiles = [];
        this.instances = [];
        this.minXYZ = new Vector3();
        this.maxXYZ = new Vector3();
        this.camHomePos = new Vector3();
        this.configData = new ConfigData("GRID", "ENCOUNTER_GRIDS",  'grid_main_data', 'data_key', 'config')
    }

    getPos() {
        return this.center;
    }

    initEncounterGrid(gridId, pos, gridLoaded, forwardVec) {
        this.center.copy(pos);
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
            this.applyGridConfig(config, this.center, forward);
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

        MATH.emptyArray(walkableTiles)

        for (let i = 0; i < count; i++) {
            let tile = MATH.getRandomArrayEntry(tiles);
            MATH.splice(tiles, tile)
            walkableTiles.push(tile);
        }
        return walkableTiles;

    }

    setCameraHomePos(pos) {
        this.camHomePos.copy(pos);
    }
    getEncounterCameraHomePosition() {
        return this.camHomePos;
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