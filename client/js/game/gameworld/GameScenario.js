import {ScenarioStatic} from "./ScenarioStatic.js";
import {ScenarioDynamic} from "./ScenarioDynamic.js";
import * as ScenarioUtils from "./ScenarioUtils.js";

class GameScenario {
    constructor(scenarioId) {
        this.scenarioId = scenarioId;
        this.scenarioTime = 0;
        this.isActive = true;
    }

    initGameScenario(eArgs) {

    }

    initGameStaticScenario(staticId, onReady) {
        this.scenarioTime = 0;
        this.staticScenario = new ScenarioStatic(staticId);
        this.staticScenario.initStaticScenario(onReady)

    }

    activateDynamicScenario() {
        ScenarioUtils.resetScenarioCharacterPiece(GameAPI.getMainCharPiece());
        if (this.dynamicScenario) this.dynamicScenario.dynamicScenarioActivate()
    }

    initGameDynamicScenario(dynamicId, dynamicReady) {
        if (this.dynamicScenario) {
            this.dynamicScenario.exitDynamicScenario()
        }

        //   let dynamicReady = function(dyn) {
        //       console.log("Dynamic scenario loaded", dyn);
        //   };

        this.dynamicScenario = new ScenarioDynamic(dynamicId);
        this.dynamicScenario.initDynamicScenario(dynamicReady)
    }

    exitGameScenario() {
        this.isActive = false;
        this.staticScenario.exitStaticScenario();
        this.dynamicScenario.exitDynamicScenario()
    }

    tickGameScenario(frame) {
        this.scenarioTime+=frame.tpf;
        if (this.dynamicScenario) {
            this.dynamicScenario.tickDynamicScenario(frame.tpf, this.scenarioTime);
        }
        this.staticScenario.tickStaticScenario(frame.tpf, this.scenarioTime);
    }

}

export { GameScenario }