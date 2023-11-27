import {DynamicGrid} from "../../../../game/gameworld/DynamicGrid.js";
import {DynamicLodGrid} from "../../../utils/DynamicLodGrid.js";
import {cubeTestVisibility} from "../../../ModelUtils.js";
import {VegetationTile} from "./VegetationTile.js";
import {VegetationPatch} from "./VegetationPatch.js";
import {poolFetch, poolReturn, registerPool} from "../../../../application/utils/PoolUtils.js";
import {Vector3} from "../../../../../libs/three/math/Vector3.js";

let updateFrame = 0;
let releases = [];

function getPatchByPosition(vegPatches, pos) {
    let patch = null;

    for (let i = 0; i < vegPatches.length; i++) {
        patch = vegPatches[i];
        if (patch.position.x  === pos.x && patch.position.z === pos.z) {
            //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: pos, color:'WHITE', size:1.2})
            return patch;
        }
    }
    //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:ThreeAPI.getCameraCursor().getPos(), to:tile.getPos(), color:'YELLOW', drawFrames:10});

    //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: tile.getPos(), color:'RED', size:1.2})
}

function fitPatchToLodTile(freePatches, vegPatches, lodTile) {

    let pos = lodTile.getPos();
    let patch = getPatchByPosition(vegPatches, pos);
    if (!patch) {
        patch = freePatches.pop();
        if (!patch) {
            console.log("No free Patch...")
            return;
        }
        patch.setPatchPosition(pos)
    }
    patch.applyGridVisibility(lodTile, updateFrame);
}

class VegetationLodGrid {
    constructor() {
        this.dynamicLodGrid = new DynamicLodGrid();
        this.vegetationPatches = [];
        this.freePatches = [];

        let updateVisibility = function(lodTile) {
        //    lodTile.debug = true;
            if (lodTile.isVisible === true) {
               fitPatchToLodTile(this.freePatches, this.vegetationPatches, lodTile);

            }

        }.bind(this)

        this.call = {
            updateVisibility:updateVisibility
        }

    }

    releaseHiddenTiles = function() {

            for (let i = 0; i < this.vegetationPatches.length; i++) {
                let patch = this.vegetationPatches[i]
                if (patch.updateFrame !== updateFrame) {
                    if (this.freePatches.indexOf(patch) === -1) {
                        patch.clearVegPatch();
                        this.freePatches.push(patch)
                    }
                };
            }
    }


    activateLodGrid(config, plantsConfig) {

        this.dynamicLodGrid.activateLodGrid(config)
        let requestNewPatch = function() {
            let patch = poolFetch('VegetationPatch')
            patch.setPatchConfig(plantsConfig, config['plants'],  config['max_plants'])
            return patch;
        }

        let tiles = this.dynamicLodGrid.getTiles();
        for (let i = 0; i < tiles.length; i++) {
            for (let j = 0; j < tiles[i].length;j++) {
                let patch =  requestNewPatch()
                this.vegetationPatches.push(patch)
            }
        }
    }

    updateVegLodGrid(lodCenter, frame) {
        updateFrame = frame;
        this.dynamicLodGrid.updateDynamicLodGrid(lodCenter, this.call.updateVisibility, 0, 1)
        this.releaseHiddenTiles()
    }

    deactivateLodGrid() {
        while (this.vegetationPatches.length) {
            let patch = this.vegetationPatches.pop();
            patch.recoverVegetationPatch();
        }

        this.dynamicLodGrid.deactivateLodGrid();
        poolReturn(this.dynamicLodGrid);
    }

}

export { VegetationLodGrid }