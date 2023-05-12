class  GameWorld  {
    constructor() {
        this.itemPieces = [];
    }

    gameWorldRegisterPiece(piece) {
        GameAPI.registerGameUpdateCallback(piece.getOnUpdateCallback())
        this.itemPieces.push(piece);
    }

    gameWorldReleasePiece(piece) {
        GameAPI.unregisterGameUpdateCallback(piece.getOnUpdateCallback())
        return MATH.quickSplice(this.itemPieces, piece);
    }

    gameWorldInactivatePiece(piece) {
        GameAPI.unregisterGameUpdateCallback(piece.getOnUpdateCallback())
    }

}

export { GameWorld }