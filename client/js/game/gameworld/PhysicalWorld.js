import {AmmoAPI} from "../../application/physics/AmmoAPI.js";
import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";

let AMMO ;



class PhysicalWorld {
    constructor() {
        this.viewObstuctingModels = [];
        this.physicalModels = [];
        this.terrainBody = null;

        this.removesRequested = [];

        let processRequestedRemoves = function() {

        }.bind(this);

        let updateModels = function() {
            processRequestedRemoves(this.removesRequested);
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




}

export {PhysicalWorld}