import { ConfigData } from "../../application/utils/ConfigData.js";
import * as ScenarioUtils from "../gameworld/ScenarioUtils.js";
import { WorldModel} from "./WorldModel.js";
import { WorldBox }from "./WorldBox.js";
import { WorldEncounter } from "./WorldEncounter.js";

let worldModels = [];
let worldBoxes = [];
let worldEncounters = [];

let heightTestNear = [];
let heightIntersects = [];

let encounterConfigs = null;

let initWorldModels = function(config) {

  //  console.log("World Models; ", config);

    while (worldModels.length) {
        let model = worldModels.pop()
        model.call.removeWorldModel(model)
    }

    let modelsData = function(models) {
        for (let i = 0; i < models.length;i++) {
            let model = new WorldModel(models[i])
            worldModels.push(model);
        }
    }

    let locationData = function(data) {
        for (let i = 0; i < data.length;i++) {
            if (data[i].config['models']) {
                modelsData(data[i].config.models);
            }
        }
    }

    for (let i = 0; i < config.length;i++) {
        locationData(config[i].data);
    }

}

let deactivateWorldEncounters = function () {
    while (worldEncounters.length) {
        let encounter = worldEncounters.pop()
        encounter.deactivateWorldEncounter()
    }
}

let activateWorldEncounters = function() {
    let encountersData = function(encounters) {
        for (let i = 0; i < encounters.length;i++) {
            let encounter = new WorldEncounter(encounters[i])
            worldEncounters.push(encounter);
            encounter.activateWorldEncounter()
        }
    }

    let locationData = function(data) {
        for (let i = 0; i < data.length;i++) {
            if (data[i].config['encounters']) {
                encountersData(data[i].config.encounters);
            }
        }
    }

    for (let i = 0; i < encounterConfigs.length;i++) {
        locationData(encounterConfigs[i].data);
    }
}

let initWorldEncounters = function(config) {
    //  console.log("World Models; ", config);
    encounterConfigs = config;
    deactivateWorldEncounters();
    activateWorldEncounters();
}

class WorldModels {
    constructor() {
        this.configData =  new ConfigData("WORLD_LOCATIONS","MODELS", null, null, null, initWorldModels)
        this.configData =  new ConfigData("WORLD_ENCOUNTERS","ENCOUNTERS", null, null, null, initWorldEncounters)
    }

    deactivateEncounters() {
        deactivateWorldEncounters()
    }

    activateEncounters() {
        activateWorldEncounters()
    }

    registerWorldBox(box) {
        if (worldBoxes.indexOf(box) === -1) {
            worldBoxes.push(box)
        } else {
            console.log("Box Already Added", box);
        }

    };

    unregisterWorldBox(box) {
        MATH.splice(worldBoxes, box);
    };

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