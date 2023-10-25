import {Vegetation} from "./Vegetation.js";

let vegetation = new Vegetation();
let lodCenter = null;
let updateVegetationSystem = function() {
    vegetation.updateVegetation(lodCenter)
}

class VegetationSystem {
    constructor() {

    }

    activateVegetationSystem(lodCenterVec3) {
        lodCenter = lodCenterVec3;
        let vegReadyCB = function() {
            ThreeAPI.addPostrenderCallback(updateVegetationSystem)
        }

        vegetation.initVegetation(vegReadyCB);

    }

    processGroundDataUpdate() {
        vegetation.resetVegetationGrids()
    }


}

export {VegetationSystem}