import { ConfigData } from "../../application/utils/ConfigData.js";
import * as ScenarioUtils from "../gameworld/ScenarioUtils.js";
import { WorldModel} from "./WorldModel.js";
import { WorldBox }from "./WorldBox.js";

let worldModels = [];
let locationConfigs = [];


let initWorldModels = function(config) {
    locationConfigs = [];
    console.log("World Models; ", config);



    while (worldModels.length) {
        let model = worldModels.pop()
        ThreeAPI.clearTerrainLodUpdateCallback(model.call.lodUpdated)
        model.removeWorldModel()
    }

    let modelsData = function(models) {
        for (let i = 0; i < models.length;i++) {
            let model = new WorldModel(models[i])
            ThreeAPI.registerTerrainLodUpdateCallback(model.getPos(), model.call.lodUpdated)
            // model.showWorldModel()
            worldModels.push(model);
        }
    }

    let boxesData = function(boxes) {
        for (let i = 0; i < boxes.length;i++) {
            let box = new WorldBox(boxes[i])
            ThreeAPI.registerTerrainLodUpdateCallback(box.getPos(), box.call.lodUpdated)
            worldModels.push(box);
            console.log("Add box:", box)
        }
    }

    let locationData = function(data) {
        console.log(data);
        for (let i = 0; i < data.length;i++) {
            if (data[i].config['models']) {
                modelsData(data[i].config.models);
            }
            if (data[i].config['boxes']) {
                boxesData(data[i].config.boxes);
            }
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