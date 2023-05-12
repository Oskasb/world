class AbilitySlot {
    constructor(gamePiece, slotIndex) {
        this.gamePiece = gamePiece;
        this.slotIndex = slotIndex;
        this.isLocked = true;
        this.pieceAbility = null;
    }

    setLocked(bool) {
        this.isLocked = bool;
    }
    setAbility(pieceAbility) {
        this.pieceAbility = pieceAbility;
    }

}

export { AbilitySlot }