import {AmmoAPI} from "../../application/physics/AmmoAPI.js";

let AMMO ;

class PhysicalWorld {
    constructor() {
        this.physicalModels = [];

        let onReady = function() {
            AMMO.initPhysics();
            ThreeAPI.addPostrenderCallback(AMMO.updatePhysicsSimulation);
        }

        AMMO = new AmmoAPI(onReady);
        window.AmmoAPI = AMMO;
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