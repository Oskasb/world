import { ConfigData } from "../../application/utils/ConfigData.js";
import * as ScenarioUtils from "../gameworld/ScenarioUtils.js";

class EncounterStaticScenario {
    constructor(staticId) {
        this.instances = [];
        this.scenarioStaticId = staticId;
        this.onUpdateCallbacks = []
        this.configData =  new ConfigData("STATIC_SCENARIOS","MAIN_SCENARIOS", 'scenario_data', 'data_key', 'config')

    }

    initEncounterStaticScenario(onReady) {

        let _this = this;

        let onConfig = function(config, updateCount) {
        //    console.log("Update Count: ", updateCount)
            if (updateCount) {
                GuiAPI.printDebugText("REFLOW SCENARIO")
                this.exitScenario();
            } else {
                setTimeout(function() {
                    onReady(_this);
                }, 0);
            }
            this.applyScenarioConfig(config);
        }.bind(this)

        this.configData.parseConfig(this.scenarioStaticId, onConfig)
    }

    applyScenarioConfig(config) {
        evt.dispatch(ENUMS.Event.ADVANCE_ENVIRONMENT,  {envId:config.environment, time:2});
        let instances = this.instances;
        let updateDispatch = config['update_dispatch'];

        this.onUpdateCallbacks.push(
            function() {
                evt.dispatch(ENUMS.Event[updateDispatch.event], updateDispatch.value)
            }
        )

        let boxGrid = config['box_grid'];
        let patches = config['patches'];
        let locations = config['locations'];

        if (boxGrid) ScenarioUtils.setupBoxGrid(instances, boxGrid)

        if (patches) {
            for (let i = 0; i < patches.length; i++) {
                ScenarioUtils.spawnPatch(instances, patches[i]);
            }
        }

        if (locations) {
            for (let i = 0; i < locations.length; i++) {
                ScenarioUtils.spawnLocation(instances, locations[i]);
            }
        }
    }

    exitScenario() {
        let instances = this.instances;
        while (instances.length) {
            let instance = instances.pop();
            instance.decommissionInstancedModel();
        }
        this.onUpdateCallbacks = [];
    };

    tickScenario(tpf, scenarioTime) {
        MATH.callAll(this.onUpdateCallbacks, tpf, scenarioTime);
    }

}

export { EncounterStaticScenario }