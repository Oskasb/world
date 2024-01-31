import {Vector3} from "../../../libs/three/math/Vector3.js";
import {ConfigData} from "../../application/utils/ConfigData.js";
import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";


let configData;
setTimeout(function (){
    configData = new ConfigData("GRID", "ENCOUNTER_GRIDS",  'grid_main_data', 'data_key', 'config')
}, 2000)


class VisualGridBorder {
    constructor() {
        this.center = new Vector3();
        this.minXYZ = new Vector3();
        this.maxXYZ = new Vector3();

        this.linesFromTo = [[[],[]], [[],[]], [[],[]], [[],[]], [[],[]], [[],[]], [[],[]], [[],[]]];
        this.edgeLines = [];

        let update = function() {
            let gameTime = GameAPI.getGameTime();
        //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, {min:this.minXYZ, max:this.maxXYZ, color:'CYAN'})
        //    drawPathPoints(this.from, this.to, this.pathPointsFX, gameTime, this.actor)

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

    on(statusKey, center, effectData, gridId) {
        this.center.copy(center)
        this.center.x -= 0.5;
        this.center.z -= 0.5;
        let lines = this.linesFromTo;

        let onConfig = function(config) {
            let grid = config['grid'];
            let gridWidth = grid.length;
            let gridDepth = grid[0].length;
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


        }.bind(this)

        configData.parseConfig(gridId, onConfig)
        ThreeAPI.addPrerenderCallback(this.call.update);
    }

    off() {

        while (this.edgeLines.length) {
            this.edgeLines.pop().off()
        }
        poolReturn(this);
        ThreeAPI.unregisterPrerenderCallback(this.call.update);
    }


}

export {VisualGridBorder}