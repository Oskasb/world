class CombatOpponentStatusProcessor {
    constructor(gamePiece) {
        this.gamePiece = gamePiece;
    }

    engagingTarget(opponentPiece, engagedTarget) {
        if (this.gamePiece === GameAPI.getMainCharPiece()) {
        //    console.log("Main Char ignores opponent engagements")
            return;
        }
        if (this.gamePiece === engagedTarget) {
            this.gamePiece.setStatusValue('selectedTarget', opponentPiece);
        //    this.gamePiece.setStatusValue('engagingTarget', opponentPiece);
        }
    }

    disengagingTarget(opponentPiece, engagedTarget) {

    }
    handleOpponentStatusUpdate(opponentPiece, statusKey, statusValue) {
        if (!this[statusKey]) {
            console.log("handleOpponentStatusUpdate has no function for: ", statusKey);
            return;
        }
        this[statusKey](opponentPiece, statusValue)
    }


}

export { CombatOpponentStatusProcessor }