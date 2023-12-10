import {AmmoAPI} from "../../application/physics/AmmoAPI.js";

let AMMO ;

class PhysicalWorld {
    constructor() {
        this.physicalModels = [];

        let updateModels = function() {
            for (let i = 0; i < this.physicalModels.length; i++) {
                this.physicalModels[i].updatePhysicalModel();
            }
        }.bind(this);

        let onReady = function() {
            window.AmmoAPI.initPhysics();
            GameAPI.registerGameUpdateCallback(window.AmmoAPI.updatePhysicsSimulation);
            ThreeAPI.addPostrenderCallback(updateModels);
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