import {effectMap} from "./Effects.js";
import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";

class StatusFeedback {
    constructor() {
        this.feedbackMap = {}
    }

    setStatusKey(key, status, actor) {
        let activate = null;
        let settings = null;
        if (typeof (effectMap[key]) === 'object') {
            if (typeof (effectMap[key][status]) === 'object') {

                settings = effectMap[key][status];
                if (typeof(this.feedbackMap[key]) === 'object') {
                    console.log("EFFECT MAYBE TOGGLE ---")
                    this.feedbackMap[key].off();
                    poolReturn(this.feedbackMap[key]);
                    this.feedbackMap[key] = null;
                    activate = true;
                } else {
                //    console.log("EFFECT ON +++")
                    activate = true;
                }

            } else {

                settings = effectMap[key];

                if (typeof (settings.activateOn) === 'boolean') {
                    if (status === settings.activateOn) {
                        activate = true;
                    } else if (status === settings.deactivateOn) {
                        if (typeof(this.feedbackMap[key]) === 'object') {
                            activate = false;
                        } else {
                            activate = true;
                        }
                    }
                }
                if (typeof (settings.activateOn) === 'number') {
                //    console.log("ACTIVATE FX: ", settings)
                    if (status < settings.activateOn) {
                        activate = false;
                    } else  {
                        activate = true;
                    }
                }
            }
        }

        if (settings !== null) {
            if (activate === true) {
                this.feedbackMap[key] = poolFetch(settings.className);
                this.feedbackMap[key].on(key, actor, settings)

                if (settings.maxDuration) {

                    let timeoutCB = function(effect) {
                        effect.off();
                        this.feedbackMap[effect.statusKey] = null;
                        poolReturn(effect);
                    }.bind(this)
                    this.feedbackMap[key].addOnTimeoutCallback(timeoutCB)
                }

            } else if (activate === false) {
                if (this.feedbackMap[key]) {
                    if (this.feedbackMap[key].off) {
                        this.feedbackMap[key].off();
                        poolReturn(this.feedbackMap[key]);
                        this.feedbackMap[key] = null;
                    } else {
                        console.log("Some bad logic for removing status feedback FX")
                        this.feedbackMap[key] = null;
                    }

                }
            }
        }
    }
}

export {StatusFeedback}