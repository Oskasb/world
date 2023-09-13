import { TilePath } from "../piece_functions/TilePath.js";
import {Vector3} from "../../../libs/three/math/Vector3.js";

let tempVec = new Vector3()
let tempVec1 = new Vector3()
let tempVec2 = new Vector3()
let tempVec3 = new Vector3()

let drawPathTiles = function(pathTiles) {
    tempVec.copy(pathTiles[0].getPos());
    tempVec1.set(0.49, 0, 0.49);
    for (let i = 0; i < pathTiles.length; i++) {

        evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:tempVec, color:'GREEN', size:0.1})

        if (pathTiles[i+1]) {

            tempVec2.subVectors(tempVec, tempVec1);
            tempVec3.addVectors(tempVec, tempVec1);


            tempVec.copy(pathTiles[i+1].getPos());
            tempVec3.y = tempVec.y;


            evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, {min:tempVec2, max:tempVec3, color:'GREEN'})

        }

    }
}

class DynamicPath {
    constructor() {
        this.tilePath = new TilePath();
        this.tempVec = new Vector3()
        this.tempVec = new Vector3();

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



    selectTilesBeneathPath(startTile, endTile, gridTiles) {

        while (this.tilePath.pathTiles.length) {
            let clearTile =  this.tilePath.pathTiles.pop();
            clearTile.clearPathIndication();
        }

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

        this.tilePath.setEndTile(endTile);

        drawPathTiles(this.tilePath.getTiles())

        return this.tilePath

    }


}

export { DynamicPath }