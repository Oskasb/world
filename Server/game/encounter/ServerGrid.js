import {ServerTile} from "./ServerTile.js";
import {getTileForPosition} from "../utils/GameServerFunctions.js";
import {MATH} from "../../../client/js/application/MATH.js";
import {Vector3} from "../../../client/libs/three/math/Vector3.js";

let tempVec1 = new Vector3();
let tempVec2 = new Vector3()

class ServerGrid {
    constructor() {
        this.gridTiles = [];
        this.pathFromPos = new Vector3();
        this.pathToPos = new Vector3();
        this.pathDirection = new Vector3();
        this.pathDistance = 0;
        this.stepLength = 0.75;
    }

    buildGridFromReportedTiles(tiles) {
        for (let i = 0; i < tiles.length;i++) {
            this.gridTiles[i] = [];
            for (let j=0; j < tiles[i].length; j++) {
                let tileInfo = tiles[i][j];
                this.gridTiles[i][j] = new ServerTile(tileInfo);
            }
        }
        console.log("Build Server Grid:", this);
    }

    getTileByColRow(col, row) {
        return this.gridTiles[col][row]
    }

    getTileByPos(posVec) {
        let gridTiles = this.gridTiles
        return getTileForPosition(gridTiles, posVec)
    }



    selectTilesBeneathPath(startTile, endTile, gridTiles, tilePath) {

        MATH.emptyArray(tilePath.pathTiles);

        let tile = startTile;
        //    tile.text.say(""+tile.gridI+":"+tile.gridJ)
        //    GuiAPI.screenText(""+tile.gridI+":"+tile.gridJ, ENUMS.Message.HINT, 1)

        if (startTile === endTile) {
            tilePath.setEndTile(null);
            tilePath.setStartTile(null);
                console.log("Single Tile, no path");
            return;
        }

        this.pathFromPos.copy(startTile.getPos());
        this.pathToPos.copy(endTile.getPos());
        this.pathDirection.copy(this.pathToPos);
        this.pathDirection.sub(this.pathFromPos);
        this.pathDistance = this.pathDirection.length();
        this.pathDirection.y = 0;
        this.pathDirection.normalize();
        this.pathDirection.multiplyScalar(this.stepLength);

        let testSteps = this.pathDistance / this.stepLength;
        
        tilePath.addTileToPath(startTile);
        tempVec1.copy(this.pathFromPos);

        for (let i = 0; i < testSteps; i++) {

            tempVec1.add(this.pathDirection);
            let stepToTile = getTileForPosition(gridTiles, tempVec1);

            if (stepToTile !== tile) {
                tile = stepToTile;
                if (tile.blocking) {
                    i = testSteps;
                } else if (tile.walkable) {
                    //    tile.indicatePath()
                    tilePath.addTileToPath(tile);
                    console.log("Add walkable tile", tile)
                } else {
                    tilePath.addTileToPath(tile);
                    console.log("Add leapOver tile", tile)
                }
            }
        }

        if (tile) {
            //    tile.text.say(""+tile.gridI+":"+tile.gridJ)
            tilePath.setEndTile(tile);
        } else {
            tilePath.length = 0;
            tilePath.setEndTile(null);
            tilePath.setStartTile(null);
        }

        return tilePath

    }


}

export { ServerGrid }