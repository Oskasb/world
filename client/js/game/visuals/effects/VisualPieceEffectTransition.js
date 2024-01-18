import {transitionEffectOn, transitionEffectOff} from "./VisualTriggerFx.js";
import {damageEffect, deathEffect} from "./PieceEffects.js";

let updateFunctions = {};
updateFunctions['damageEffect'] = damageEffect;
updateFunctions['deathEffect'] = deathEffect;

class VisualPieceEffectTransition {
    constructor() {
        this.actor = null;
        this.statusKey = null;
        this.effectData = null;
        this.onTimeoutCallbacks = [];

        let update = function(tpf) {
            if (this.duration > this.effectData.maxDuration) {
                MATH.callAll(this.onTimeoutCallbacks, this);
            }
            this.duration += tpf;
        }.bind(this);

        this.call = {
            update:update
        }
    }

    addOnTimeoutCallback(cb) {
        this.onTimeoutCallbacks.push(cb);
    }

    on(statusKey, actor, effectData) {
        this.duration = 0;
        this.actor = actor;
        this.statusKey = statusKey;
        this.effectData = effectData;
        ThreeAPI.addPostrenderCallback(this.call.update);

        let amount = this.actor.getStatus(ENUMS.ActorStatus[this.statusKey])
    //    console.log("Trigger FX ", statusKey, amount)

        updateFunctions[this.effectData.effect['updateFunction']](this.actor, amount);
    }

    off() {
        ThreeAPI.unregisterPostrenderCallback(this.call.update);
        MATH.emptyArray(this.onTimeoutCallbacks);
    }

}

export { VisualPieceEffectTransition }