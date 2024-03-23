import {Object3D} from "../../../libs/three/core/Object3D.js";
import {LocationModel} from "./LocationModel.js";
import {parseConfigDataKey} from "../../application/utils/ConfigUtils.js";
import {inheritConfigTransform} from "../../application/utils/ModelUtils.js";

function removeWorldModel(model) {
    //    console.log("Remove Model ", this.isVisible, this)
    model.removeLocationModels();
}

let index = 0;

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

        index++;
        this.id = 'world_model_'+index
;
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
        this.hidden = false;

        this.configData = null;

        let locationModels = function(data) {
            this.configData = data;        //    console.log("Reflow Location Models: ", this.locationModels.length)
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

        let setPaletteKey = function(key) {
            this.paletteKey = key;
            for (let i = 0; i < this.locationModels.length; i++) {
                this.locationModels[i].call.setPaletteKey(this.paletteKey)
            }
        }.bind(this)

        let getPaletteKey = function() {
            return this.paletteKey;
        }.bind(this)

        this.call = {
            setPaletteKey:setPaletteKey,
            getPaletteKey:getPaletteKey,
            removeWorldModel:removeWorldModel,
            applyEditCursorUpdate:applyEditCursorUpdate,
            locationModels:locationModels
        }

    }

    getPos() {
        return this.obj3d.position;
    }

    applyObj3dUpdate() {
        for (let i = 0; i < this.locationModels.length; i++) {
            this.locationModels[i].hierarchyUpdated();
            this.locationModels[i].call.alignPhysicalModel()
        }
    }

    setHidden(bool) {
        this.hidden = bool;
        for (let i = 0; i < this.locationModels.length; i++) {
            if (this.hidden === true) {
                this.locationModels[i].call.hideLocationModel(this.locationModels[i])
            } else {
                this.call.locationModels(this.configData)
            }

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