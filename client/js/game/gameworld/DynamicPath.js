import { TilePath } from "../piece_functions/TilePath.js";
import {Vector3} from "../../../libs/three/math/Vector3.js";

class DynamicPath {
    constructor() {
        this.tilePath = new TilePath();
        this.tempVec = new Vector3()
        this.isPathing = false;
    //    this.pathTargetPiece = null;
        this.pathTargetPos = new Vector3();
        this.turnPathEnd = new Vector3()
        this.currentPosTile = null;
        this.targetPosTile = null;
        this.tempVec = new Vector3();

    //    this.pathWalker = new PathWalker(gamePiece, this.tilePath);

        this.lineEvent = {
            from:new Vector3(),
            to: new Vector3(),
            color:'CYAN'
        }
    }


    drawPathLine(from, to, color) {
        this.lineEvent.from.copy(from)
        this.lineEvent.to.copy(to);
        this.lineEvent.color = color || 'CYAN';
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, this.lineEvent);
    }

    setDestination(posVec) {
        this.tilePath.setEndTile(this.getTileAtPos(posVec))
    }

    clearTilePathStatus() {
        this.isPathing = false;
        this.tilePath.clearTilePath()
    }


    selectTilesBeneathPath(startTile, endTile, gridTiles) {

        while (this.tilePath.pathTiles.length) {
            let clearTile =  this.tilePath.pathTiles.pop();
            clearTile.clearPathIndication();
        }

        this.drawPathLine(startTile.getPos(), endTile.getPos(), 'WHITE')
        let startX = startTile.gridI;
        let startZ = startTile.gridJ;
        let endX = endTile.gridI;
        let endZ = endTile.gridJ;

        let xDiff = endX - startX;
        let zDiff = endZ - startZ;

        this.tempVec.copy(startTile.getPos());

        let stepX = 0;
        let stepZ = 0;
        let tileX = startX;
        let tileZ = startZ;
        let incrementX = 0;
        let incrementZ = 0;
        let tileCount = Math.max(Math.abs(xDiff), Math.abs(zDiff));

        startTile.indicatePath()

        this.tilePath.addTileToPath(startTile);
        for (let i = 0; i < tileCount; i++) {

            if (incrementX < Math.abs(xDiff)) {
                incrementX++
            }

            if (incrementZ < Math.abs(zDiff)) {
                incrementZ++
            }

            stepX = incrementX * Math.sign(-xDiff);
            stepZ = incrementZ * Math.sign(-zDiff);

            tileX = gridTiles.length - (startX + stepX +1);
            tileX = MATH.clamp(tileX, 0, gridTiles.length-1)
            tileZ = gridTiles[0].length - (startZ + stepZ +1);
            tileZ = MATH.clamp(tileZ, 0, gridTiles[0].length-1)
            let tile = gridTiles[tileX][tileZ];
            if (!tile) {
                console.log("No tile")
            } else {
                tile.indicatePath()
                let color = 'YELLOW';
                this.tilePath.addTileToPath(tile);
                this.drawPathLine(this.tempVec, tile.getPos(), color)
                this.tempVec.copy(tile.getPos());
            }

        }

        endTile.indicatePath()
        this.tilePath.addTileToPath(endTile);
        return this.tilePath

    }

    getTileAtPos = function(posVec3) {
        if (!GameAPI.getActiveEncounterGrid()) {
            console.log("Sometimes no active grid", this)
            return;
        }
        return GameAPI.getActiveEncounterGrid().getTileAtPosition(posVec3);
    }


}

export { DynamicPath }