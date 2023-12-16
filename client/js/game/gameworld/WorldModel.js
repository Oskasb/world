import {Object3D} from "../../../libs/three/core/Object3D.js";
import {LocationModel} from "./LocationModel.js";
import {parseConfigDataKey} from "../../application/utils/ConfigUtils.js";
import {inheritConfigTransform} from "../../application/utils/ModelUtils.js";

function removeWorldModel(model) {
    //    console.log("Remove Model ", this.isVisible, this)
    model.removeLocationModels();
}

let randomPaletteList = [
    'DEFAULT',
    'TOWN_RED',
    'TOWN_RED_2',
    'TOWN_GREEN',
    'TOWN_NEUTRAL',
    'TOWN_NEUTRAL_2',
    'TOWN_DARK',
    'TOWN_DARK_2',
    'TOWN_YELLOW'
]


class WorldModel {

    constructor(config) {

        this.config = config;

        this.obj3d = new Object3D();

        inheritConfigTransform(this.obj3d, this.config);
        if (config['palette']) {
            this.paletteKey = config['palette'];
        } else {
            this.paletteKey = randomPaletteList[Math.floor(randomPaletteList.length * MATH.sillyRandom(this.obj3d.position.x + this.obj3d.position.z + this.obj3d.position.y))];
        }


        this.locationModels = [];

        this.visibility = null;

        let locationModels = function(data) {
        //    console.log("Reflow Location Models: ", this.locationModels.length)
            this.removeLocationModels();
            for (let i = 0; i < data.assets.length; i++) {
                let model = new LocationModel(this.obj3d, data.assets[i])
                if (model.lodLevel) {
                    ThreeAPI.registerTerrainLodUpdateCallback(model.getPos(), model.call.lodUpdated)
                    model.call.setPaletteKey(this.paletteKey);
                }
                this.locationModels.push(model)
            }
        }.bind(this)

        parseConfigDataKey("WORLD_LOCATIONS","LOCATION_MODELS", "model_data", config.model, locationModels)

        this.call = {
            removeWorldModel:removeWorldModel
        }

    }

    getPos() {
        return this.obj3d.position;
    }

    removeLocationModels() {

        while (this.locationModels.length) {

            let model = this.locationModels.pop();
            model.clearLocationBoxes();
            if (model.lodLevel) {
                ThreeAPI.clearTerrainLodUpdateCallback(model.call.lodUpdated)
            }
            model.call.hideLocationModel(model);

        }
    }


}

export { WorldModel }