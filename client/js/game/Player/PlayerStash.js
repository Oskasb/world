

class PlayerStash {
    constructor() {
        this.tempVec = new THREE.Vector3()
        this.pos = new THREE.Vector3(1.5, 0.1, 3.3);
        this.extents = new THREE.Vector3(1, 0.2, 1);
        this.pieces = [];
    }

    setStashPosition(pos) {
        this.pos.copy(pos);
    }

    findPositionInStash(storeVec3) {
        storeVec3.copy(this.pos);
        MATH.spreadVector(storeVec3, this.extents);
    }

    positionPieceInStash(gamePiece) {
        this.findPositionInStash(ThreeAPI.tempVec3);
        gamePiece.getSpatial().setPosVec3(ThreeAPI.tempVec3);
        GameAPI.registerGameUpdateCallback(gamePiece.getOnUpdateCallback());
    }

    addPieceToStash(piece) {
        this.pieces.push(piece);
     //   console.log("Stash pieces ", this.pieces)
    }

    getStashedItemByItemId(itemId) {
        if (!this.pieces.length) return;

        if (itemId === 'random') {
        //    console.log(this.pieces)
            return this.pieces[Math.floor(Math.random()*this.pieces.length)]
        } else {
            console.log("Figure this out...")

        }

    }

    takePieceFromStash(gamePiece) {

        if (typeof (gamePiece) === 'string') {
            gamePiece = this.getStashedItemByItemId(gamePiece);
        }

        let piece = MATH.quickSplice(this.pieces, gamePiece);
        return piece;
    }



}
export { PlayerStash }