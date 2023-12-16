import {AmmoAPI} from "../../application/physics/AmmoAPI.js";
import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";

let AMMO ;

class PhysicalWorld {
    constructor() {
        this.physicalModels = [];
        this.terrainBody = null;
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

    registerTerrainBody(terrainBody) {
        this.terrainBody = terrainBody;
    }

    addPhysicalModel() {
        let physicalModel = poolFetch('PhysicalModel')
        this.physicalModels.push(physicalModel)
        return physicalModel
    }

    removePhysicalModel(physicalModel) {
        if (this.physicalModels.indexOf(physicalModel) === -1) {
            console.log("no model to remove, bad call")
            return;
        }
        MATH.splice(this.physicalModels, physicalModel);

        poolReturn(physicalModel);
    }

    pointIntersectsPhysicalWorld(pos) {

    }

}

export {PhysicalWorld}