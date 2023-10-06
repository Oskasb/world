import { Vector3 } from "../../../libs/three/math/Vector3.js";

let tempVec3 = new Vector3()

class TilePath {
    constructor() {
        this.startTile = null;
        this.endTile = null;
        this.pathTiles = [];
        this.pathCompetedCallbacks = [];
        this.pathingUpdateCallbacks = [];
        this.activeTurn = 0;
    }

    addTileToPath(tile) {
        this.pathTiles.push(tile);
    }

    cutTilePath() {
        if (this.pathTiles.length > 1) {
            this.pathTiles.length = 2;
            this.setEndTile(this.pathTiles[1])
        }
    }

    deductNextTileFromPath() {
        return this.pathTiles.shift();
    }

    setStartTile(tile) {
        this.startTile = tile;
    }

    getStartTile() {
        return this.startTile;
    }

    setEndTile(tile) {
        this.endTile = tile;
    }

    getEndTile() {
        return this.endTile;
    }

    getRemainingTiles() {
        return this.pathTiles.length;
    }
    getPathEndPosVec3() {
        return this.endTile.getPos();
    }

    getTurnEndTile = function() {
        return this.pathTiles[this.pathTiles.length -1]
    }

    getTiles() {
        return this.pathTiles;
    }

    clearTilePath() {
        while(this.pathTiles.length) {
            let tile = this.pathTiles.pop();
            tile.setTileStatus('FREE');
            tile.indicateTileStatus(false);
        }
    }

}

export { TilePath }