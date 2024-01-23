import { SimpleSend } from "../../Transport/io/SimpleSend.js";
import {ENUMS} from "../../application/ENUMS.js";

function setDefaults(statusMap) {
    statusMap[ENUMS.ActionStatus.ACTION_KEY] = "none";
    statusMap[ENUMS.ActionStatus.BUTTON_STATE] = ENUMS.ButtonState.UNAVAILABLE;
    statusMap[ENUMS.ActionStatus.ACTION_STATE] = ENUMS.ActionState.DISABLED;
    statusMap[ENUMS.ActionStatus.SELECTED] = false;
    statusMap[ENUMS.ActionStatus.TARGET_ID] = "none";
    statusMap[ENUMS.ActionStatus.STEP_START_TIME] = 0;
    statusMap[ENUMS.ActionStatus.STEP_END_TIME] = 0;
    statusMap[ENUMS.ActionStatus.RANGE_MIN] = 0;
    statusMap[ENUMS.ActionStatus.RANGE_MAX] = 1;
    statusMap[ENUMS.ActionStatus.REQUIRES_TARGET] = true;
    statusMap[ENUMS.ActionStatus.ACTION_TRIGGER] = ENUMS.Trigger.ON_ACTIVATE;
}

class ActionStatus {
    constructor() {
        let simpleSend = new SimpleSend();
        this.statusMap = {};
        this.statusMap[ENUMS.ActionStatus.ACTOR_ID] = "none";
        this.statusMap[ENUMS.ActionStatus.ACTION_ID] = "none";
        this.statusMap[ENUMS.ActionStatus.STATUS_MODIFIERS] = [];
        setDefaults(this.statusMap);

        this.isRemote = false;
        let setStatusByKey = function(key, status) {

            if (key === undefined) {
                console.log("Bad Key: ", this.statusMap);
                return;
            }

            if (typeof (this.statusMap[key]) === typeof (status)) {
                this.statusMap[key] = status;
            } else {
                if (typeof (this.statusMap[key]) === 'undefined' || this.statusMap[key] === 0  || this.statusMap[key] === null) {
            //        console.log("SET STATUS", key, status)
                    this.statusMap[key] = status;
                } else {
                    console.log("changing type for status is bad", key, status)
                }
            }

            let actor = GameAPI.getActorById(this.statusMap[ENUMS.ActionStatus.ACTOR_ID])
            if (!actor) {
                console.log("No Actor for Action")
                return;
            }

            if (!actor.call.getRemote()) {

            if (this.statusMap[ENUMS.ActionStatus.ACTION_ID] === "none") {
                    console.log("Missing ID", this.statusMap);
                } else {
            //    console.log("Trigger send", key, status);
                    simpleSend.call.broadcastStatus(ENUMS.ActionStatus.ACTION_ID, this.statusMap, ENUMS.ClientRequests.APPLY_ACTION_STATUS, true);
                }
            }

        }.bind(this);

        let getStatusByKey = function(key) {
            if (key === undefined) {
                console.log("Undefined Get? ")
                return;
            }

            if (typeof (this.statusMap[key]) === 'undefined') {
                this.statusMap[key] = 0;
            }
            return this.statusMap[key]
        }.bind(this);

        let initActionStatus = function(actor, action) {
            this.statusMap[ENUMS.ActionStatus.ACTOR_ID] = actor.id;
            this.statusMap[ENUMS.ActionStatus.ACTION_ID] = action.id;
            setDefaults(this.statusMap);
            MATH.emptyArray(this.statusMap[ENUMS.ActionStatus.STATUS_MODIFIERS]);

        }.bind(this);

        let forceStatusSend = function() {
            simpleSend.call.broadcastStatus(ENUMS.ActionStatus.ACTION_ID, this.statusMap, ENUMS.ClientRequests.APPLY_ACTION_STATUS, true);
        }.bind(this);

        this.call = {
            initActionStatus:initActionStatus,
            setStatusByKey:setStatusByKey,
            getStatusByKey:getStatusByKey,
            forceStatusSend:forceStatusSend
        }
    }

}

export {ActionStatus}