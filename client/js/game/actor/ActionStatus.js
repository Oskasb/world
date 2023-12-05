class ActionStatus {
    constructor() {
        this.statusMap = {};
        this.isRemote = false;
        let setStatusByKey = function(key, status) {

            if (typeof (this.statusMap[key]) === typeof (status)) {
                this.statusMap[key] = status;
            } else {
                if (typeof (this.statusMap[key]) === 'undefined' || this.statusMap[key] === 0  || this.statusMap[key] === null) {
                    console.log("SET STATUS", key, status)
                    this.statusMap[key] = status;
                } else {
                    console.log("changing type for status is bad", key, status)
                }
            }
        }.bind(this);

        let getStatusByKey = function(key) {
            if (typeof (this.statusMap[key]) === 'undefined') {
                this.statusMap[key] = 0;
            }
            return this.statusMap[key]
        }.bind(this);

        let initActionStatus = function(actor, actionKey, action) {

            if (actor.call.getRemote()) {
                this.isRemote = true;
            } else {
                this.isRemote = false;
            }

            this.statusMap[ENUMS.ActionStatus.ACTOR_ID] = actor.id;
            this.statusMap[ENUMS.ActionStatus.ACTION_ID] = action.id;
            this.statusMap[ENUMS.ActionStatus.ACTION_KEY] = actionKey;
            this.statusMap[ENUMS.ActionStatus.BUTTON_STATE] = ENUMS.ButtonState.UNAVAILABLE;
            this.statusMap[ENUMS.ActionStatus.ACTION_STATE] = ENUMS.ActionState.DISABLED;
            this.statusMap[ENUMS.ActionStatus.SELECTED] = false;
            this.statusMap[ENUMS.ActionStatus.TARGET_ID] = '';
            this.statusMap[ENUMS.ActionStatus.STEP_CURRENT_TIME] = 0;
            this.statusMap[ENUMS.ActionStatus.STEP_START_TIME] = 0;
            this.statusMap[ENUMS.ActionStatus.STEP_END_TIME] = 0;
            console.log("INIT ACTION STATUS", this, actor, this.statusMap[ENUMS.ActionStatus.ACTION_STATE])

        }.bind(this);

        this.call = {
            initActionStatus:initActionStatus,
            setStatusByKey:setStatusByKey,
            getStatusByKey:getStatusByKey
        }
    }



}

export {ActionStatus}