import {ServerTile} from "./ServerTile.js";

class ServerGrid {
    constructor() {
        this.gridTiles = [];
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

}

export { ServerGrid }