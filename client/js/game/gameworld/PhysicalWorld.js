import {debugDrawPhysicalWorld} from "../../application/utils/PhysicsUtils.js";

class PhysicalWorld {
    constructor() {
        this.physicalModels = [];


   //     ThreeAPI.addPostrenderCallback(debugDrawPhysicalWorld);
    }

    addPhysicalModel(physicalModel) {
        this.physicalModels.push(physicalModel)
    }

    removePhysicalModel(physicalModel) {
        MATH.splice(this.physicalModels, physicalModel);
    }

    pointIntersectsPhysicalWorld(pos) {

    }




}

export {PhysicalWorld}