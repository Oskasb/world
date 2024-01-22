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
            let value = mod['value'];
            modifiersList.push(modifier);
            modifiersList.push(value);
            if (serverSide) {
                applyServerAction(target, modifier, value)
            }
        }
    }

    applyActorActionActivate(actor, modifiersList, serverSide) {
        let onActivateCfg = this.config['on_activation'];
        if (!onActivateCfg) {
            return;
        }
        let modifiers = onActivateCfg['to_actor'];

        if (modifiers) {
            for (let i = 0; i < modifiers.length; i++) {
                let mod = modifiers[i];
                let modifier = mod['modifier'];
                let value = mod['value'];
                modifiersList.push(modifier);
                modifiersList.push(value);
                if (serverSide) {
                    applyServerAction(actor, modifier, value)
                }
            }
        }

    }

    applyActorActionSelected(actor, modifiersList, serverSide) {
        let onSelectedCfg = this.config['on_selected'];
        if (!onSelectedCfg) {
            return;
        }
        let modifiers = onSelectedCfg['to_actor'];

        if (modifiers) {
            for (let i = 0; i < modifiers.length; i++) {
                let mod = modifiers[i];
                let modifier = mod['modifier'];
                let value = mod['value'];
                modifiersList.push(modifier);
                modifiersList.push(value);
                if (serverSide) {
                    applyServerAction(actor, modifier, value)
                }
            }
        }

    }


}

export {StatisticalAction}