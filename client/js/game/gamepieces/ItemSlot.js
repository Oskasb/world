class ItemSlot {
    constructor() {
        this.slotId = null;
        this.item = null;
    }

    setSlotId(slotId) {
        this.slotId = slotId;
    }

    setSlotItem(item) {
        this.item = item;
    }

    removeSlotItem() {
        let oldPiece = this.item;
        this.item = null;
        return oldPiece
    }

    getSlotItem() {
        return this.item;
    }

}

export { ItemSlot }