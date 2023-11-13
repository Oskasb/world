class ItemSlot {
    constructor(slotId) {
        this.slotId = slotId;
        this.item = null;
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