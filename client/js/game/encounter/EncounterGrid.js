import {ConfigData} from "../../application/utils/ConfigData.js";
import * as ScenarioUtils from "../gameworld/ScenarioUtils.js";
import {Vector3} from "../../../libs/three/math/Vector3.js";
import {filterForWalkableTiles, getRandomWalkableTiles} from "../gameworld/ScenarioUtils.js";
import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";

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
                if (this.visualGridBorder) {
                    this.visualGridBorder.off();
                }
            }
            this.applyGridConfig(config, this.center, forward);
            this.visualGridBorder = poolFetch('VisualGridBorder')
            this.visualGridBorder.on(null, this.center, null, gridId, this);
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

    getRandomWalkableTiles(count, key) {
        return getRandomWalkableTiles(this.gridTiles, count, key);
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

    getPosOutsideTrigger() {
        return this.getRandomWalkableTiles(1, 'isExit')[0].getPos()
    }

    buildGridDataForMessage() {
        let messageData= [];
        for (let i = 0; i < this.gridTiles.length;i++) {
            let col = []
            messageData[i] = col;
            for (let j=0; j < this.gridTiles[i].length; j++) {
                let tile = this.gridTiles[i][j];
                let pos = tile.getPos();
                col[j] = {
                    tileX:tile.tileX,
                    tileZ:tile.tileZ,
                    gridI:tile.gridI,
                    gridJ:tile.gridJ,
                    posX:pos.x,
                    posY:pos.y,
                    posZ:pos.z,
                    walkable:tile.walkable,
                    blocking:tile.blocking,
                    isExit:tile.isExit
                }
            }
        }
        return messageData;
    }

    removeEncounterGrid() {
        this.visualGridBorder.off();
        this.visualGridBorder = null;
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