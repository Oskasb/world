class CharacterInventory {
    constructor() {
        this.pieces = [];
    }

    addItemToInventory(piece, time) {
        piece.hideGamePiece();
        this.pieces.push(piece);
        GuiAPI.printDebugText("Inventory Items: "+this.pieces.length)
        GameAPI.takePieceFromWorld(piece);
    //    console.log("Add inv item ", this.pieces);
    }

    getInventoryItemByItemId(itemId) {
        if (!this.pieces.length) return;

        if (itemId === 'random') {
            //    console.log(this.pieces)
            return this.pieces[Math.floor(Math.random()*this.pieces.length)]
        } else {
            console.log("Figure this out...")

        }

    }

    takeItemFromInventory(gamePiece) {
        if (typeof (gamePiece) === 'string') {
            gamePiece = this.getInventoryItemByItemId(gamePiece);
        }
        if(gamePiece) {
            gamePiece.showGamePiece();
        }
        let removeItem = MATH.quickSplice(this.pieces, gamePiece );
        GuiAPI.printDebugText("Inventory Items: "+this.pieces.length)

        return removeItem
    }

}

export { CharacterInventory }