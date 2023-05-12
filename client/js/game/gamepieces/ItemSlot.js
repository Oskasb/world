class ItemSlot {
    constructor(slotId) {
        this.slotId = slotId;
        this.itemPiece = null;
    }

    setSlotItemPiece(itemPiece) {
        this.itemPiece = itemPiece;
    }

    removeSlotItemPiece() {
        let oldPiece = this.itemPiece;
        this.itemPiece = null;
        return oldPiece
    }

    getSlotItemPiece() {
        return this.itemPiece;
    }

}

export { ItemSlot }