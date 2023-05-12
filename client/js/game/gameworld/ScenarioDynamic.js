import { EncounterDynamicScenario } from "../gamescenarios/EncounterDynamicScenario.js";

class ScenarioDynamic {
    constructor(scenarioDynamicId) {
        this.dynamicScenarioId = scenarioDynamicId;
        this.loadedDynamicScenarios = [];
    }

    initDynamicScenario(onReadyCB) {
        let dynamicScenario = new EncounterDynamicScenario(this.dynamicScenarioId);
        this.loadedDynamicScenarios.push(dynamicScenario);
        dynamicScenario.initEncounterDynamicScenario(onReadyCB);
    }

    dynamicScenarioActivate() {
        for (let i = 0; i < this.loadedDynamicScenarios.length; i++) {
            this.loadedDynamicScenarios[i].activateEncDynScenario();
        }
    }

    exitDynamicScenario() {
        let dynamicScenario = this.loadedDynamicScenarios.pop();
        if (dynamicScenario) {
            dynamicScenario.exitScenario();
        } else {
            console.log("No home_dynamic scenario, look for error plz")
        }
    }

    tickDynamicScenario(tpf, scenarioTime) {
        for (let i = 0; i < this.loadedDynamicScenarios.length; i++) {
            this.loadedDynamicScenarios[i].tickScenario(tpf, scenarioTime);
        }
    }
}

export {ScenarioDynamic}