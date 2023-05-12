class CombatTargetProcessor {
    constructor() {}

    applyTargetSelection(gamePiece) {
        let selectedTarget = gamePiece.getStatusByKey('selectedTarget');
        let combatTarget = gamePiece.getStatusByKey('combatTarget');
        if (selectedTarget !== null) {
            gamePiece.setStatusValue('disengagingTarget', null);
            gamePiece.setStatusValue('engagingTarget', selectedTarget);
            selectedTarget.notifyOpponentStatusUpdate(gamePiece, 'engagingTarget', selectedTarget)
        } else {
            if (combatTarget !== null) {
                gamePiece.setStatusValue('disengagingTarget', combatTarget);
                combatTarget.notifyOpponentStatusUpdate(gamePiece,'disengagingTarget', combatTarget)
                gamePiece.setStatusValue('engagingTarget', null);
                gamePiece.setStatusValue('combatTarget', null);
            } else {
                gamePiece.setStatusValue('disengagingTarget', null);
            }
            gamePiece.setStatusValue('engagingTarget', null);
        }
    }

    updateCombatTarget(gamePiece) {
        this.applyTargetSelection(gamePiece)
    }

}

export { CombatTargetProcessor }