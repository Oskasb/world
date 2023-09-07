import { ConfigData } from "../../application/utils/ConfigData.js";
import * as ScenarioUtils from "../gameworld/ScenarioUtils.js";
import { WorldModel} from "./WorldModel.js";
import { WorldBox }from "./WorldBox.js";

let worldModels = [];
let worldBoxes = [];
let locationConfigs = [];

let heightTestNear = [];
let heightIntersects = [];

let initWorldModels = function(config) {
    locationConfigs = [];
    console.log("World Models; ", config);

    while (worldModels.length) {
        let model = worldModels.pop()
        ThreeAPI.clearTerrainLodUpdateCallback(model.call.lodUpdated)
        model.removeWorldModel()
    }

    while (worldBoxes.length) {
        let model = worldBoxes.pop()
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
            worldBoxes.push(box);
         //   console.log("Add box:", box)
        }
    }

    let locationData = function(data) {
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

}

class WorldModels {
    constructor() {
        this.configData =  new ConfigData("WORLD_LOCATIONS","MODELS", null, null, null, initWorldModels)
    }

    queryWorldModelHeight = function(posVec3, boxHeight) {

        for (let i = 0; i < worldBoxes.length; i++) {
            let isNear = worldBoxes[i].testIsNearPosition(posVec3)
            if (isNear) {
                heightTestNear.push(worldBoxes[i])
            }
        }

        let highestIntersection = -99999;

        while (heightTestNear.length) {
            let box = heightTestNear.pop();
            boxHeight = box.testIntersectPosition(posVec3, boxHeight)
        }

        return boxHeight;

    }

}

export { WorldModels }