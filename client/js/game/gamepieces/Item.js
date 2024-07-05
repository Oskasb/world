import {ItemStatus} from "./ItemStatus.js";
import {applyStatusMessageToMap} from "../../../../Server/game/utils/GameServerFunctions.js";

let index = 0;

class Item {

    constructor(configId, config, itemId) {

        this.id = itemId || 'item_local_'+index+'_'+client.getStamp();
        index++;

        this.configId = configId;
        this.config = config;
        this.visualItem = null;

        this.status = new ItemStatus(this.id, configId);

        if (!config) {
            console.log("Item Config missing", configId)
            config = {};
        }
        let defaultStatus = config['status'];
        if (typeof(defaultStatus) === 'object') {
            for (let key in defaultStatus) {
                this.status.statusMap[key] = defaultStatus[key];
            }
        }

        if (typeof (this.status.statusMap[ENUMS.ItemStatus.STACK_SIZE]) !== 'number') {
            this.status.statusMap[ENUMS.ItemStatus.STACK_SIZE] = 0;
        }

        if (typeof (this.status.statusMap[ENUMS.ItemStatus.CHILD_ITEMS]) !== 'object') {
            this.status.statusMap[ENUMS.ItemStatus.CHILD_ITEMS] = [];
        }

        if (typeof (this.status.statusMap[ENUMS.ItemStatus.ITEM_POTENCY]) !== typeof (ENUMS.potency.POTENCY_0)) {
            this.status.statusMap[ENUMS.ItemStatus.ITEM_POTENCY] = ENUMS.potency.POTENCY_0;
            this.status.statusMap[ENUMS.ItemStatus.POTENCY_ECHELON] = ENUMS.echelon.ECHELON_0;
        }

        if (typeof (this.status.statusMap[ENUMS.ItemStatus.ITEM_RANK]) !== typeof ( ENUMS.rank.RANK_0)) {
            this.status.statusMap[ENUMS.ItemStatus.ITEM_RANK] = ENUMS.rank.RANK_0;
            this.status.statusMap[ENUMS.ItemStatus.RANK_ECHELON] = ENUMS.echelon.ECHELON_0;
        }

    //    this.visualGamePiece.call.setPiece(this)

        let addModifiers = {};
        let updateCallback = null;

        let addMods = config['status_add_modifiers']
        if (addMods) {
            let modStatus = this.status.call.getStatusByKey(ENUMS.ItemStatus.MODIFIERS)
            for (let i = 0; i < addMods.length; i++) {
                if (addModifiers[addMods[i].status]) {
                    addModifiers[addMods[i].status].push(addMods[i].value)
                } else {
                    addModifiers[addMods[i].status] = [addMods[i].value];
                }
                modStatus[i*2] = addMods[i].status;
                modStatus[i*2 + 1] = addMods[i].value;
             //   console.log("Add Modifier ", addMods, modStatus, addModifiers)
            }
        }
        let getAddModifiers = function() {
            return addModifiers
        }

        let setUpdateCallback = function(cb) {
            updateCallback = cb;
        }

        let getUpdateCallback = function() {
            return updateCallback
        }

        this.paletteUpdated = true;

        let applyStatusMessage = function(msg) {
            applyStatusMessageToMap(msg, this.status.statusMap);
            if (msg.indexOf(ENUMS.ItemStatus.PALETTE_VALUES) !== -1) {
                this.paletteUpdated = true;
            }

        }.bind(this)

        this.call = {
            getAddModifiers:getAddModifiers,
            setUpdateCallback:setUpdateCallback,
            getUpdateCallback:getUpdateCallback,
            applyStatusMessage:applyStatusMessage
        }

    }


    setStatusKey(key, status) {
        this.status.call.setStatusByKey(key, status);
    };

    getStatus(key) {
        return this.status.call.getStatusByKey(key);
    }

    getEquipSlotId() {
        return this.config['equip_slot']
    }

    getPos() {
        return this.visualItem.getPos();
    }

    getQuat() {
        return this.visualItem.getQuat();
    }

    getSpatial() {
        console.log("Item Get Spat is to be removed.. ")
        return this.getModel().getSpatial()
    }

    getModel() {
        return this.visualItem.call.getInstance();
    }

    getVisualGamePiece() {
        return this.visualItem
    }

    disposeItem() {
        this.setStatusKey(ENUMS.ItemStatus.ACTIVATION_STATE, ENUMS.ActivationState.DEACTIVATING)
    //    ThreeAPI.unregisterPostrenderCallback(this.status.call.pulseStatusUpdate);
        if (this.visualItem !== null) {
            this.visualItem.call.requestDeactivation();
            this.visualItem = null;
        }

    }

}

export {Item}