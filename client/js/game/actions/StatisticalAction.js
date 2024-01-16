import {processStatisticalActionApplied} from "./ActionStatusProcessor.js";

class StatisticalAction {
    constructor() {
        this.config = null;
    }

    initStatisticalActionConfig(conf) {
        this.config = conf;
    }

    applyStatisticalActionToTarget(target) {
        let onHitCfg = this.config['on_hit_apply'];
        let targetModifiers = onHitCfg['to_target'];
        for (let i = 0; i < targetModifiers.length; i++) {
            let mod = targetModifiers[i];
            processStatisticalActionApplied(target, mod['modifier'], mod['amount'])
        }

    }

}

export {StatisticalAction}