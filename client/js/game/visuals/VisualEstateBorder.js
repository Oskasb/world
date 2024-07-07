import {Vector3} from "../../../libs/three/math/Vector3.js";
import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";



class VisualEstateBorder {
    constructor() {
        this.center = new Vector3();
        this.minXYZ = new Vector3();
        this.maxXYZ = new Vector3();

        this.linesFromTo = [[[],[]], [[],[]], [[],[]], [[],[]], [[],[]], [[],[]], [[],[]], [[],[]]];
        this.edgeLines = [];

        let update = function() {

            while (this.edgeLines.length < this.linesFromTo.length) {
                let edgeLine = poolFetch('VisualEdgeLine')
                edgeLine.on();
                this.edgeLines.push(edgeLine)
            }

            for (let i = 0; i < this.edgeLines.length; i++) {
                let lineFrom = this.linesFromTo[i][0];
                let lineTo = this.linesFromTo[i][1];
                this.edgeLines[i].setFrom(lineFrom[0], lineFrom[1]);
                this.edgeLines[i].setTo(lineTo[0], lineTo[1]);
            }

        }.bind(this)


        this.call = {
            update:update
        }

    }

    on(center, sizeVec3) {
        this.center.copy(center)

        let lines = this.linesFromTo;

            let gridWidth = sizeVec3.x;
            let gridDepth = sizeVec3.z;

            let oddWidth = MATH.isOddNumber(gridWidth);
            let oddDepth = MATH.isOddNumber(gridDepth);
            if (!oddWidth) {
                this.center.x -= 0.5;
            }
            if (!oddDepth) {
                this.center.z -= 0.5;
            }

            this.minXYZ.set(-gridWidth * 0.5, 0, -gridDepth * 0.5).add(this.center);
            this.maxXYZ.set(gridWidth  * 0.5, 0, gridDepth  * 0.5).add(this.center);
            lines[0][0][0] = this.center.x;
            lines[0][0][1] = this.minXYZ.z;
            lines[0][1][0] = this.maxXYZ.x;
            lines[0][1][1] = this.minXYZ.z;

            lines[1][0][0] = this.center.x;
            lines[1][0][1] = this.minXYZ.z;
            lines[1][1][0] = this.minXYZ.x;
            lines[1][1][1] = this.minXYZ.z;

            lines[2][0][0] = this.center.x;
            lines[2][0][1] = this.maxXYZ.z;
            lines[2][1][0] = this.maxXYZ.x;
            lines[2][1][1] = this.maxXYZ.z;

            lines[3][0][0] = this.center.x;
            lines[3][0][1] = this.maxXYZ.z;
            lines[3][1][0] = this.minXYZ.x;
            lines[3][1][1] = this.maxXYZ.z;

            lines[4][0][0] = this.minXYZ.x ;
            lines[4][0][1] = this.center.z ;
            lines[4][1][0] = this.minXYZ.x ;
            lines[4][1][1] = this.maxXYZ.z ;

            lines[5][0][0] = this.minXYZ.x;
            lines[5][0][1] = this.center.z;
            lines[5][1][0] = this.minXYZ.x;
            lines[5][1][1] = this.minXYZ.z;

            lines[6][0][0] = this.maxXYZ.x;
            lines[6][0][1] = this.center.z;
            lines[6][1][0] = this.maxXYZ.x;
            lines[6][1][1] = this.maxXYZ.z;

            lines[7][0][0] = this.maxXYZ.x ;
            lines[7][0][1] = this.center.z ;
            lines[7][1][0] = this.maxXYZ.x ;
            lines[7][1][1] = this.minXYZ.z ;

        ThreeAPI.addPrerenderCallback(this.call.update);
    }

    off() {
        while (this.edgeLines.length) {
            this.edgeLines.pop().off()
        }
        ThreeAPI.unregisterPrerenderCallback(this.call.update);
    }


}

export {VisualEstateBorder}