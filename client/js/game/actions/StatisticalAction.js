import {processStatisticalActionApplied} from "./ActionStatusProcessor.js";
import {applyServerAction} from "../../../../Server/game/action/ServerActionFunctions.js";

class StatisticalAction {
    constructor() {
        this.config = null;
    }

    initStatisticalActionConfig(conf) {
        this.config = conf;
    }

    applyStatisticalActionToTarget(target, modifiersList, serverSide) {
        let onHitCfg = this.config['on_hit_apply'];
        let targetModifiers = onHitCfg['to_target'];
        for (let i = 0; i < targetModifiers.length; i++) {
            let mod = targetModifiers[i];
            let modifier = mod['modifier'];
            let amount = mod['amount'];
            modifiersList.push(modifier);
            modifiersList.push(amount);
            if (serverSide) {
                applyServerAction(target, modifier, amount)
            }
        }
    }

}

export {StatisticalAction}