import {isDev} from "../../application/utils/DebugUtils.js";
import {saveItemStatus} from "../../application/setup/Database.js";

class ActorInventory {
    constructor(actor) {
        this.actor = actor;
        this.inventoryStatus = [
            "", "", "",
            "", "", "",
            "", "", "",
            "", "", ""
        ];
        this.items = {}

        for (let i = 0; i < this.inventoryStatus.length; i++) {
            this.items["SLOT_"+i] = {index:i, item:null}
        }

        actor.actorStatus.setStatusKey(ENUMS.ActorStatus.INVENTORY_ITEMS, this.inventoryStatus);
    }

    getFirstEmptySlotKey() {
        for (let key in this.items) {
            if (this.items[key].item === null) {
                return key;
            }
        }
        return null;
    }

    isInventorySlot(toSlot) {
        if (typeof (this.items[toSlot]) === 'object') {
            return true;
        } else {
            return false;
        }
    }


    getInvItemSlotId(item) {
        for (let key in this.items) {
            if (this.items[key].item === item) {
                return key;
            }
        }
        return null;
    }

    addInventoryItem(item, slot, callback) {
        if (isDev()) {
            console.log("Add Inv Item ", item)
        }

        let slotKey = null;
        if (typeof (slot) === 'string') {
            slotKey = slot;
        } else if (typeof (slot) === 'number') {
            slotKey = 'SLOT_'+slot;
        } else {
            slotKey = this.getFirstEmptySlotKey();
            if (slotKey === null) {
                if (typeof (callback) === 'function') {
                    callback(null);
                    return;
                }
            }
        }

        let slotItem = this.items[slotKey];
        if (!slotItem) {
            console.log("Bad slot lookup ", slotKey, this.items)
        }


        let switchItem = null;
        if (slotItem) {
            switchItem = slotItem.item;
        }

        let invStatus = this.actor.getStatus(ENUMS.ActorStatus.INVENTORY_ITEMS);

        if (item === null) {
            invStatus[this.items[slotKey].index] = "";
        } else {

            if (this.actor.isPlayerActor()) {
                saveItemStatus(item.getStatus())
            }

            invStatus[this.items[slotKey].index] = item.getStatus(ENUMS.ItemStatus.ITEM_ID);
            item.setStatusKey(ENUMS.ItemStatus.EQUIPPED_SLOT, slotKey);
        }

        this.items[slotKey].item = item;
        if (typeof (callback) === 'function') {
            callback(item, switchItem);
        }
    }

    getItemAtIndex(slotIndex) {
        return this.items["SLOT_"+slotIndex].item;
    }

    getItemAtSlot(slotId) {
        if (typeof (this.items[slotId]) === 'object') {
            return this.items[slotId].item;
        } else {
            return null;
        }
    }

    fetchInventoryItems(store) {
        for (let key in this.items) {
            if (this.items[key].item !== null) {
                store.push(this.items[key].item)
            }
        }
    }

}

export { ActorInventory }