import {SimpleSend} from "../../Transport/io/SimpleSend.js";

class ItemStatus {
    constructor(itemId) {

        let simpleSend = new SimpleSend();

        this.statusMap =  {};
        this.statusMap[ENUMS.ItemStatus.ITEM_ID] = itemId;
        this.statusMap[ENUMS.ItemStatus.ACTOR_ID] = 'none';
        this.statusMap[ENUMS.ItemStatus.PALETTE_VALUES] = [];
        this.statusMap[ENUMS.ItemStatus.EQUIPPED_SLOT] = '';
        this.statusMap[ENUMS.ItemStatus.MODIFIERS] = [];
        this.statusMap[ENUMS.ItemStatus.ACTIVATION_STATE] = ENUMS.ActivationState.INACTIVE;


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

            let actor = GameAPI.getActorById(this.statusMap[ENUMS.ItemStatus.ACTOR_ID])
            if (!actor) {
                return;
            }

            if (!actor.call.getRemote()) {
                simpleSend.call.broadcastStatus(ENUMS.ItemStatus.ITEM_ID, this.statusMap);
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

        let initItemStatus = function() {
            this.statusMap[ENUMS.ActionStatus.ACTIVATION_STATE] = ENUMS.ActivationState.INIT;
        }.bind(this);

        this.call = {
            initItemStatus:initItemStatus,
            setStatusByKey:setStatusByKey,
            getStatusByKey:getStatusByKey
        }


    }





}

export {ItemStatus}