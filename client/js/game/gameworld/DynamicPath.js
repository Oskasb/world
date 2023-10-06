import { TilePath } from "../piece_functions/TilePath.js";
import {Vector3} from "../../../libs/three/math/Vector3.js";
import {VisualPath} from "../visuals/VisualPath.js";

let tempVec = new Vector3()
let tempVec1 = new Vector3()
let tempVec2 = new Vector3()
let tempVec3 = new Vector3()

let visualPath = new VisualPath()

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
        this.lineStepFromVec = new Vector3();

        this.lineEvent = {
            from:new Vector3(),
            to: new Vector3(),
            color:'CYAN'
        }
    }



    drawLineSegment(from, to, segment, segments, color, tile) {
        tempVec.copy(to);
        tempVec.sub(from);
        let frac = MATH.calcFraction(0, segments, segment);



        if (tile.requiresLeap) {
            tempVec.y *= frac
            tempVec.y += Math.sin(frac*Math.PI)
        } else {
            let heightFrac = MATH.curveSigmoid(frac);
            tempVec.y *= MATH.curveQuad(heightFrac)
        }


        let travelFrac = frac // MATH.valueFromCurve(frac, MATH.curves["edgeStep"])
        tempVec.x *= travelFrac;
        tempVec.z *= travelFrac;

        tempVec.add(from);
       // tempVec.x = to.x;
       // tempVec.z = to.z;
        this.lineEvent.from.copy(this.lineStepFromVec)
        this.lineEvent.to.copy(tempVec);
        this.lineEvent.color = color || 'CYAN';
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, this.lineEvent);
        if (segment) {
            visualPath.addVisualPathPoint(this.lineStepFromVec, tempVec, segment, tile, frac);
        }
        this.lineStepFromVec.copy(tempVec)

    }

    drawPathLine(from, to, color, tile) {
        let segments = 9;
        this.lineStepFromVec.copy(from)
        for (let i = 0; i < segments+1; i++) {
            this.drawLineSegment(from, to, i, segments, color, tile)
        }
    }


    selectTilesBeneathPath(startTile, endTile, gridTiles) {
        visualPath.clearVisualPath();
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

        let leapOver = false;

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
            } else if (tile.blocking) {
                i = tileCount;
            } else if (tile.walkable) {
                tile.indicatePath()
                let color = 'YELLOW';
                this.tilePath.addTileToPath(tile);
                let elevationDiff = tile.getPos().y - this.tempVec.y;
                if (Math.abs(elevationDiff) > 0.7 || leapOver) {
                    tile.requiresLeap = true;
                    leapOver = false;
                } else {
                    tile.requiresLeap = false;
                }
                this.drawPathLine(this.tempVec, tile.getPos(), color, tile)
                this.tempVec.copy(tile.getPos());
            } else {
                leapOver = true;
            }
        }

        this.tilePath.setEndTile(this.tilePath.getTurnEndTile());
        //    drawPathTiles(this.tilePath.getTiles())

        return this.tilePath

    }

    clearPathVisuals() {
        visualPath.clearVisualPath();
    }


}

export { DynamicPath }