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
                    console.log("EFFECT MAYNE TOGGLE ---")
                    this.feedbackMap[key].off();
                    poolReturn(this.feedbackMap[key]);
                    this.feedbackMap[key] = null;
                    activate = true;
                } else {
                    console.log("EFFECT ON +++")
                    activate = true;
                }

            } else {
                settings = effectMap[key];
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
        }

        if (settings !== null) {
            if (activate === true) {
                this.feedbackMap[key] = poolFetch(settings.className);
                this.feedbackMap[key].on(key, actor, settings)
            } else if (activate === false) {
                this.feedbackMap[key].off();
                poolReturn(this.feedbackMap[key]);
                this.feedbackMap[key] = null;
            }
        }
    }
}

export {StatusFeedback}