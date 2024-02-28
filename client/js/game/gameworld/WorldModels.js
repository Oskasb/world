import { ConfigData } from "../../application/utils/ConfigData.js";
import * as ScenarioUtils from "../gameworld/ScenarioUtils.js";
import { WorldModel} from "./WorldModel.js";
import { WorldEncounter } from "../encounter/WorldEncounter.js";
import { WorldTreasure} from "../encounter/WorldTreasure.js";

let locationModelConfigs;
let worldModels = [];
let worldBoxes = [];
let worldEncounters = [];
let worldTreasures = [];
let skippedTreasures = {};
let skippedEncounters = {};

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

let lastWorldLevel = 20;
let initWorldModels = function(worldLevel) {

    if (!worldLevel) {
        worldLevel = lastWorldLevel;
    } else {
        lastWorldLevel = worldLevel;
    }

    let config = locationModelConfigs;
    console.log("worldLevel Models; ", worldLevel, config);

    removeWorldModels()

    let modelsData = function(models) {
        for (let i = 0; i < models.length;i++) {
            let model = new WorldModel(models[i])
            worldModels.push(model);
        }
    }

    let locationData = function(data) {
        for (let i = 0; i < data.length;i++) {

            if (worldLevel === 20) {
                if (!data[i].config['world_level']) {
                    modelsData(data[i].config.models);
                }
            }

            if (data[i].config['world_level'] === worldLevel) {
                console.log("Specific World LEvel Models", worldLevel, data[i])
                modelsData(data[i].config.models);
            }
        }
    }

    for (let i = 0; i < config.length;i++) {
        locationData(config[i].data);
    }

}

let deactivateWorldEncounters = function () {
    GuiAPI.getWorldInteractionUi().deactivateWorldInteractUi()

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

    if (event.world_level) {
        initWorldModels(event.world_level)
    }

    deactivateWorldEncounters();
    GuiAPI.getWorldInteractionUi().initWorldInteractUi();
    let activeActor = GameAPI.getGamePieceSystem().selectedActor;
    if (activeActor) {
        activeActor.setStatusKey(ENUMS.ActorStatus.TRAVEL_MODE, ENUMS.TravelMode.TRAVEL_MODE_WALK);
        activeActor.setStatusKey(ENUMS.ActorStatus.PARTY_SELECTED, true);
    }

    let completedEncounters = GameAPI.gameAdventureSystem.getCompletedEncounters();
    let lootedTreasures = GameAPI.gameAdventureSystem.getLootedTreasures();
    activateEvent = event;
    let encountersData = function(encounters, index, listId) {
        for (let i = 0; i < encounters.length;i++) {
            let encId = ""+listId+"_"+index+"_"+i;
            let onReady = function(encounter) {
                worldEncounters.push(encounter);
                encounter.activateWorldEncounter()
            }
            if (completedEncounters.indexOf(encId) === -1) {
                new WorldEncounter(encId, encounters[i], onReady)
            } else {
                console.log("Not loading completed encounters..", encId);
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
       //         console.log("locationData: ", data[i].config['encounters'])
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

    deactivateEncounters() {
        deactivateWorldEncounters()
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
        for (let i = 0; i < worldEncounters.length; i++) {
            if (id === worldEncounters[i].id) {
                return worldEncounters[i]
            }
        }
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
        removeWorldModels();
        deactivateWorldEncounters();
    }

}

export { WorldModels }