import {EncounterStaticScenario} from "../gamescenarios/EncounterStaticScenario.js";

class ScenarioStatic {
    constructor(staticId) {
        this.tempObj = new THREE.Object3D();
        this.staticScenarioId = staticId; // || 'home_scenariostatic'
        this.loadedStatisScenario = null;
    }

    initStaticScenario(onReady) {
        let staticScenario;

        let callback = function(scenario) {
            this.loadedStatisScenario = scenario;
            onReady(scenario);
        }.bind(this);

        staticScenario = new EncounterStaticScenario(this.staticScenarioId);
        staticScenario.initEncounterStaticScenario(callback);

    }

    exitStaticScenario() {
        this.loadedStatisScenario.exitScenario();
    }

    tickStaticScenario(tpf, scenarioTime) {

        if (this.loadedStatisScenario) {
            this.loadedStatisScenario.tickScenario(tpf, scenarioTime);
        }

    }

}

export { ScenarioStatic }