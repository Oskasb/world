import {processStatisticalActionApplied} from "./ActionStatusProcessor.js";
import {applyServerAction} from "../../../../Server/game/action/ServerActionFunctions.js";

class StatisticalAction {
    constructor() {
        this.config = null;
    }

    initStatisticalActionConfig(conf, action) {

        this.config = conf;

        let status = conf['status'];
        let statusMap = action.status.statusMap;
        for (let key in status) {
            statusMap[key] = status[key];
        }

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