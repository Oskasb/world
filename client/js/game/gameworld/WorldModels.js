import { ConfigData } from "../../application/utils/ConfigData.js";
import * as ScenarioUtils from "../gameworld/ScenarioUtils.js";
import { WorldModel} from "./WorldModel.js";
import { WorldEncounter } from "../encounter/WorldEncounter.js";
import { WorldTreasure} from "../encounter/WorldTreasure.js";
import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";

let locationModelConfigs;
let worldModels = [];
let worldBoxes = [];
let worldEncounters = [];
let worldTreasures = [];
let skippedTreasures = {};
let skippedEncounters = {};
let dynamicSpawnPoints = [];

let loadedConfigs = {}

let activateEvent = {world_encounters:[]};

let heightTestNear = [];
let heightIntersects = [];

let encounterConfigs = null;


function removeWorldModels() {
    while (worldModels.length) {
        let model = worldModels.pop()
        model.call.removeWorldModel(model)
    }
}

let setlocationModelConfigs = function(config) {
    locationModelConfigs = config;
    initWorldModels()
}

function clearDynamicSpawnPoints() {
    while (dynamicSpawnPoints.length) {
        let sPoint = dynamicSpawnPoints.pop()
        sPoint.removeSpawnPoint()
        poolReturn(sPoint);
    }
}

function populateDynamicSpawnPoints(worldLevel) {

    clearDynamicSpawnPoints()
    let config = GameAPI.gameMain.getWorldLevelConfig(worldLevel);
    let spawns = config['spawns'] || 100;
    let lvlMin = config['level_min'] || 1;
    let lvlMax = config['level_max'] || 50;
    let yMax = config['y_max'] || 50;
    for (let i = 0; i < spawns; i++) {
        let point = poolFetch('DynamicSpawnPoint');
        point.initDynamicSpawnPoint(i, spawns, worldLevel, yMax, lvlMin, lvlMax);
        dynamicSpawnPoints.push(point);
    }

}

function activateDynamicSpawnPoints() {
    for (let i = 0; i < dynamicSpawnPoints.length; i++) {
        let sPoint = dynamicSpawnPoints[i]
        if (sPoint.isActive === false) {
            sPoint.activateSpawnPoint();
        }
    }
}

function deactivateDynamicSpawnPoints() {
    for (let i = 0; i < dynamicSpawnPoints.length; i++) {
        let sPoint = dynamicSpawnPoints[i]
        if (sPoint.isActive === true) {
            sPoint.deactivateSpawnPoint();
        }
    }
}

function loadModelFromConfig(config, id) {
    if (config.DELETED === true) {
        console.log("Deleted World Model Appears")
        return;
    }
    let model = new WorldModel(config, id)
    worldModels.push(model);
    return model;
}

function loadEditorModels(configs) {
    for (let key in configs) {
        let add = true;
        for (let i = 0; i < worldModels.length; i++) {
            if (worldModels[i].id === key) {
                worldModels[i].call.applyLoadedConfig(configs[key]);
                add = false;
            }
        }
        if (add === true) {
            loadModelFromConfig(configs[key], key)
        }
    }
}

function loadModelsFromEditor(worldLevel) {
    if (loadedConfigs['models']) {
        if (loadedConfigs['models'][worldLevel]) {
            loadEditorModels(loadedConfigs['models'][worldLevel])
        }
    }
}

let worldLevelLocations = []
let lastWorldLevel = "20";

let initWorldModels = function(worldLevel) {

    if (worldLevel !== lastWorldLevel || dynamicSpawnPoints.length === 0) {
        if (!worldLevel) {
            worldLevel = lastWorldLevel;
        } else {
            lastWorldLevel = worldLevel;
        }
        populateDynamicSpawnPoints(worldLevel);
    } else {
        activateDynamicSpawnPoints()
    }

    let config = locationModelConfigs;
    console.log("worldLevel Models; ", worldLevel, config);

    removeWorldModels(worldLevel)

    MATH.emptyArray(worldLevelLocations);

    loadModelsFromEditor()

    let modelsData = function(models) {
        for (let i = 0; i < models.length;i++) {
            let model = new WorldModel(models[i])
            let add = true;
            for (let i = 0; i < worldModels.length; i++) {
                if (worldModels[i].id === model.id) {
                    add = false;
                }
            }
            if (add === true) {
                worldModels.push(model);
            }


        }
    }

    let locationData = function(data) {
        for (let i = 0; i < data.length;i++) {

            if (worldLevel === "20") {
                if (!data[i].config['world_level']) {
                    modelsData(data[i].config.models);
                    worldLevelLocations.push(data[i])
                }
            }

            if (data[i].config['world_level'] === worldLevel) {
            //    console.log("Specific World Level Models", worldLevel, data[i])
                modelsData(data[i].config.models);
                worldLevelLocations.push(data[i])
            }
        }
    }

    for (let i = 0; i < config.length;i++) {
        locationData(config[i].data);
    }

}

let deactivateWorldEncounters = function () {
    GuiAPI.getWorldInteractionUi().deactivateWorldInteractUi()
    deactivateDynamicSpawnPoints();
    while (worldEncounters.length) {
        let encounter = worldEncounters.pop()
        encounter.deactivateWorldEncounter()
    }
    while (worldTreasures.length) {
        let trsr = worldTreasures.pop()
        trsr.deactivateWorldTreasure()
    }
}



let activateSkippedEncounter = function(encId, cb) {
    let onReady = function(encounter) {
        worldEncounters.push(encounter);
        encounter.activateWorldEncounter()
        cb(encounter);
    }

    new WorldEncounter(encId, skippedEncounters[encId], onReady)
}

let activateWorldEncounters = function(event) {

    deactivateWorldEncounters();

    if (event.world_level) {
        initWorldModels(event.world_level)
    } else {
        activateDynamicSpawnPoints()
    }

    setTimeout(GuiAPI.getWorldInteractionUi().initWorldInteractUi, 1000)

//    GuiAPI.getWorldInteractionUi().initWorldInteractUi();
    let activeActor = GameAPI.getGamePieceSystem().selectedActor;
    if (activeActor) {
        activeActor.setStatusKey(ENUMS.ActorStatus.TRAVEL_MODE, ENUMS.TravelMode.TRAVEL_MODE_WALK);
        activeActor.setStatusKey(ENUMS.ActorStatus.PARTY_SELECTED, true);
    }

    let completedEncounters = GameAPI.gameAdventureSystem.getCompletedEncounters();
    let lootedTreasures = GameAPI.gameAdventureSystem.getLootedTreasures();
    activateEvent = event;

    let onReady = function(encounter) {
        worldEncounters.push(encounter);
        encounter.activateWorldEncounter()
    }
    let encountersData = function(encounters, index, listId) {
        for (let i = 0; i < encounters.length;i++) {
            let encId = ""+listId+"_"+index+"_"+i;
            if (completedEncounters.indexOf(encId) === -1) {
                new WorldEncounter(encId, encounters[i], onReady)
            } else {
                console.log("Not loading completed encounter..", encId);
                skippedEncounters[encId] = encounters[i];
            }

        }
    }

    let treasuresData = function(treasures, index, listId) {
        for (let i = 0; i < treasures.length;i++) {
            let treasureId = "trsr_"+listId+"_"+index+"_"+i;
       //     console.log("Load World Treasure: ", treasureId, treasures[i])
            let onReady = function(treasure) {
                worldTreasures.push(treasure);
                treasure.activateWorldTreasure()
            }
            if (lootedTreasures.indexOf(treasureId) === -1) {
                new WorldTreasure(treasureId, treasures[i], onReady)
            } else {
                console.log("Not loading looted treasures..", treasureId);
                skippedTreasures[treasureId] = treasures[i];
            }

        }
    }

    let locationData = function(data, listId) {
        for (let i = 0; i < data.length;i++) {
            if (data[i].config['encounters']) {
            //    console.log("locationData: ", data[i].config['encounter'])
                encountersData(data[i].config.encounters, i, listId);
            }
            if (data[i].config['treasures']) {
                treasuresData(data[i].config.treasures, i, listId);
            }
        }
    }

    for (let i = 0; i < encounterConfigs.length;i++) {
        if (activateEvent.world_encounters.indexOf(encounterConfigs[i].id) !== -1) {
            locationData(encounterConfigs[i].data, encounterConfigs[i].id);
        }
    }

}

let initWorldEncounters = function(config) {
    //  console.log("World Models; ", config);
    encounterConfigs = config;
    activateWorldEncounters(activateEvent);
}

class WorldModels {
    constructor() {
        this.configData =  new ConfigData("WORLD_LOCATIONS","MODELS", null, null, null, setlocationModelConfigs)
        this.configData =  new ConfigData("WORLD_ENCOUNTERS","ENCOUNTERS", null, null, null, initWorldEncounters)

        evt.on(ENUMS.Event.LOAD_ADVENTURE_ENCOUNTERS, activateWorldEncounters)
    }

    getEncounterConfigs() {
        return encounterConfigs;
    }

    deactivateEncounters() {
        deactivateWorldEncounters()
    }

    getActiveLocationData() {
        return worldLevelLocations
    }

    getActiveWorldModels() {
        return worldModels;
    }

    setLoadedConfig(root, folder, id, config) {
        if (!loadedConfigs[root]) {
            loadedConfigs[root] = {};
        }

        if (!loadedConfigs[root][folder]) {
            loadedConfigs[root][folder] = {};
        }
        loadedConfigs[root][folder][id] = config;
        if (root === 'model') {
            let wModel = GameAPI.worldModels.getActiveWorldModel(id);
            if (wModel !== null) {
                wModel.call.applyLoadedConfig(config)
            } else if (folder === lastWorldLevel) {
                loadModelFromConfig(config)
            }

        }


    }

    getActiveWorldModel(id) {
        for (let i = 0; i < worldModels.length; i++) {
            if (worldModels[i].id === id) {
                return worldModels[i];
            }
        }
        return null;
    }

    getWorldEncounters() {
        return worldEncounters;
    }

    getDynamicSpawnPoints() {
        return dynamicSpawnPoints;
    }

    activateEncounters() {
        activateWorldEncounters(activateEvent)
    }

    activateCompletedEncounter(encId, onReady) {
        activateSkippedEncounter(encId, onReady);
    }

    getEncounterByHostActorId(actorId) {
        for (let i = 0; i < worldEncounters.length; i++) {
            let hostActor = worldEncounters[i].getHostActor()
            if (hostActor.id === actorId) {
                return worldEncounters[i]
            };
        }
    }

    getEncounterById(id) {
        if (!id) {
            return worldEncounters;
        }
        for (let i = 0; i < worldEncounters.length; i++) {
            if (id === worldEncounters[i].id) {
                return worldEncounters[i]
            }
        }
    }

    addConfigModel(config) {
        return loadModelFromConfig(config);
    }

    registerWorldBox(box) {
        if (worldBoxes.indexOf(box) === -1) {
            worldBoxes.push(box)
        } else {
            console.log("Box Already Added", box);
        }

    };

    getWorldModelCount() {
        return worldModels.length;
    }

    getWorldBoxCount() {
        return worldBoxes.length;
    }

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

    removeActiveWorldModels() {
        clearDynamicSpawnPoints();
        removeWorldModels();
        deactivateWorldEncounters();
    }

}

export { WorldModels }