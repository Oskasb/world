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

    addInventoryItem(item, slot, callback) {
        console.log("Add Inv Item ", item)
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


        let switchItem = this.items[slotKey].item;

        let invStatus = this.actor.getStatus(ENUMS.ActorStatus.INVENTORY_ITEMS);
        invStatus[this.items[slotKey].index] = item.getStatus(ENUMS.ItemStatus.ITEM_ID);
        this.items[slotKey].item = item;
        if (typeof (callback) === 'function') {
            callback(item, switchItem);
        }
    }

    getItemAtIndex(slotIndex) {
        return this.items["SLOT_"+slotIndex].item;
    }



}

export { ActorInventory }