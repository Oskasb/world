import { ConfigData } from "../../application/utils/ConfigData.js";
import * as ScenarioUtils from "../gameworld/ScenarioUtils.js";
import { WorldModel} from "./WorldModel.js";


let worldModels = [];
let locationConfigs = [];


let initWorldModels = function(config) {
    locationConfigs = [];
    console.log("World Models; ", config);

    while (worldModels.length) {
        worldModels.pop().removeWorldModel()
    }

    let modelsData = function(models) {
        for (let i = 0; i < models.length;i++) {
            let model = new WorldModel(models[i])
            model.showWorldModel()
            worldModels.push(model);
        }
    }

    let locationData = function(data) {
        for (let i = 0; i < data.length;i++) {
            modelsData(data[i].config.models);
        }
    }

    for (let i = 0; i < config.length;i++) {
        locationData(config[i].data);
    }
    console.log(worldModels)

}

class WorldModels {
    constructor() {
        this.configData =  new ConfigData("WORLD_LOCATIONS","MODELS", null, null, null, initWorldModels)
    }
}

export { WorldModels }