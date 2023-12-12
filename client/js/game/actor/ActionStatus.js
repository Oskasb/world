import { SimpleSend } from "../../Transport/io/SimpleSend.js";

class ActionStatus {
    constructor() {
        let simpleSend = new SimpleSend();
        this.statusMap = {};
        this.statusMap[ENUMS.ActionStatus.ACTOR_ID] = "none";
        this.statusMap[ENUMS.ActionStatus.ACTION_ID] = "none";
        this.statusMap[ENUMS.ActionStatus.ACTION_KEY] = "none";
        this.statusMap[ENUMS.ActionStatus.BUTTON_STATE] = ENUMS.ButtonState.UNAVAILABLE;
        this.statusMap[ENUMS.ActionStatus.ACTION_STATE] = ENUMS.ActionState.DISABLED;
        this.statusMap[ENUMS.ActionStatus.SELECTED] = false;
        this.statusMap[ENUMS.ActionStatus.TARGET_ID] = "none";
        this.statusMap[ENUMS.ActionStatus.STEP_START_TIME] = 0;
        this.statusMap[ENUMS.ActionStatus.STEP_END_TIME] = 0;


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
                return;
            }

            if (!actor.call.getRemote()) {

            if (this.statusMap[ENUMS.ActionStatus.ACTION_ID] === "none") {
                    console.log("Missing ID", this.statusMap);
                } else {
            //    console.log("Trigger send", key, status);
                    simpleSend.call.broadcastStatus(ENUMS.ActionStatus.ACTION_ID, this.statusMap);
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
            this.statusMap[ENUMS.ActionStatus.ACTION_KEY] = 'none';
            this.statusMap[ENUMS.ActionStatus.BUTTON_STATE] = ENUMS.ButtonState.UNAVAILABLE;
            this.statusMap[ENUMS.ActionStatus.ACTION_STATE] = ENUMS.ActionState.DISABLED;
            this.statusMap[ENUMS.ActionStatus.SELECTED] = false;
            this.statusMap[ENUMS.ActionStatus.TARGET_ID] = "none";
            this.statusMap[ENUMS.ActionStatus.STEP_CURRENT_TIME] = 0;
            this.statusMap[ENUMS.ActionStatus.STEP_START_TIME] = 0;
            this.statusMap[ENUMS.ActionStatus.STEP_END_TIME] = 0;
        //    console.log("INIT ACTION STATUS", this, actor, this.statusMap[ENUMS.ActionStatus.ACTION_STATE])
        //    simpleSend.call.broadcastStatus(ENUMS.ActionStatus.ACTION_ID, this.statusMap);
        }.bind(this);

        this.call = {
            initActionStatus:initActionStatus,
            setStatusByKey:setStatusByKey,
            getStatusByKey:getStatusByKey
        }
    }



}

export {ActionStatus}