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
                if (config['no_lod'] === true) {
                    model.call.lodUpdated(0)
                } else {
                    if (model.lodLevel) {
                        ThreeAPI.registerTerrainLodUpdateCallback(model.getPos(), model.call.lodUpdated)
                        model.call.setPaletteKey(this.paletteKey);
                    }
                }

                this.locationModels.push(model)
            }
        }.bind(this)

        parseConfigDataKey("WORLD_LOCATIONS","LOCATION_MODELS", "model_data", config.model, locationModels)

        let applyEditCursorUpdate = function(obj3d) {
            this.obj3d.copy(obj3d);
            this.applyObj3dUpdate()
        }.bind(this);

        this.call = {
            removeWorldModel:removeWorldModel,
            applyEditCursorUpdate:applyEditCursorUpdate
        }

    }

    getPos() {
        return this.obj3d.position;
    }

    applyObj3dUpdate() {
        for (let i = 0; i < this.locationModels.length; i++) {
            this.locationModels[i].hierarchyUpdated();
        }
    }

    removeLocationModels() {

        while (this.locationModels.length) {
            let model = this.locationModels.pop();
            model.removeLocationModel();
        }
    //    ThreeAPI.clearTerrainLodUpdateCallback(this.call.lodUpdated)

    }

}

export { WorldModel }