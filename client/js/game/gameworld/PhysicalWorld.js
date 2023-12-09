import {AmmoAPI} from "../../application/physics/AmmoAPI.js";

let AMMO ;

class PhysicalWorld {
    constructor() {
        this.physicalModels = [];

        let onReady = function() {
            window.AmmoAPI.initPhysics();
            ThreeAPI.addPostrenderCallback(AMMO.updatePhysicsSimulation);
        }

        window.AmmoAPI = new AmmoAPI(onReady);
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