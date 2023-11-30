import {transitionEffectOn, transitionEffectOff} from "./VisualTriggerFx.js";

class VisualPulse {
    constructor() {
        this.actor = null;
        this.statusKey = null;
        this.effectData = null;
    }
    on(statusKey, actor, effectData) {
        actor.actorText.say(statusKey+ " ON")
        this.actor = actor;
        this.statusKey = statusKey;
        this.effectData = effectData;
        transitionEffectOn(actor.getSpatialPosition(), effectData);
    }

    off() {
        this.actor.actorText.say(this.statusKey+ " OFF")
        transitionEffectOff(this.actor.getSpatialPosition(), this.effectData);
    }

}

export { VisualPulse }