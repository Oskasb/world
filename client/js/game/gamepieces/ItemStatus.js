import {SimpleSend} from "../../Transport/io/SimpleSend.js";

class ItemStatus {
    constructor(itemId, itemTemplate) {
    //    console.log("Init Item status", itemId)
        let simpleSend = new SimpleSend();

        this.statusMap =  {};
        this.statusMap[ENUMS.ItemStatus.ITEM_ID] = itemId;
        this.statusMap[ENUMS.ItemStatus.TEMPLATE] = itemTemplate;
        this.statusMap[ENUMS.ItemStatus.ACTOR_ID] = 'none';
        this.statusMap[ENUMS.ItemStatus.PALETTE_VALUES] = [];
        this.statusMap[ENUMS.ItemStatus.EQUIPPED_SLOT] = '';
        this.statusMap[ENUMS.ItemStatus.MODIFIERS] = [];
        this.statusMap[ENUMS.ItemStatus.ACTIVATION_STATE] = ENUMS.ActivationState.INACTIVE;
        this.statusMap[ENUMS.ItemStatus.RARITY] = ENUMS.rarity.COMMON;
        this.statusMap[ENUMS.ItemStatus.QUALITY] = ENUMS.quality.POOR;

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
                simpleSend.call.broadcastStatus(ENUMS.ItemStatus.ITEM_ID, this.statusMap, ENUMS.ClientRequests.APPLY_ITEM_STATUS);
            }

        }.bind(this);

        let getStatusByKey = function(key) {
            if (key === undefined) {
                return this.statusMap;
            //    console.log("Undefined Get? ")
            }

            if (typeof (this.statusMap[key]) === 'undefined') {
                this.statusMap[key] = 0;
            }
            return this.statusMap[key]
        }.bind(this);

        let initItemStatus = function() {
            this.statusMap[ENUMS.ItemStatus.ACTIVATION_STATE] = ENUMS.ActivationState.INIT;
        }.bind(this);

        let lastPulseTime = 0;

        let pulseStatusUpdate = function() {
            let gameTime = GameAPI.getGameTime();

            let equipSlotId = getStatusByKey(ENUMS.ItemStatus.EQUIPPED_SLOT);
            if (equipSlotId === '') {
                let item = GameAPI.getItemById(getStatusByKey(ENUMS.ItemStatus.ITEM_ID))
            //    console.log("Fix missing equipslotId ", item)
                setStatusByKey(ENUMS.ItemStatus.EQUIPPED_SLOT, item.config['equip_slot'])
            }

            if (lastPulseTime < gameTime -5) {
                lastPulseTime = gameTime;
                simpleSend.call.broadcastStatus(ENUMS.ItemStatus.ITEM_ID, this.statusMap, ENUMS.ClientRequests.APPLY_ITEM_STATUS);
            }
        }.bind(this);

        this.call = {
            initItemStatus:initItemStatus,
            setStatusByKey:setStatusByKey,
            getStatusByKey:getStatusByKey,
            pulseStatusUpdate:pulseStatusUpdate
        }


    }





}

export {ItemStatus}