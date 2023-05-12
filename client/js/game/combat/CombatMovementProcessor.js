class CombatMovementProcessor {
    constructor(gamePiece) {
        this.gamePiece = gamePiece;
    }



    moveToEngagedTarget(engageTarget) {

        let rangeCheck = this.gamePiece.distanceToReachTarget(engageTarget);

        if (GameAPI.pieceIsMainChar(this.gamePiece)) {
            let combatTarget = this.gamePiece.getStatusByKey('combatTarget');
            if (combatTarget) {
                console.log("Main char is cool in combat")
                return;
            }
        }

        if (rangeCheck > 0) {
        //    console.log("Move to Target", engageTarget);
            this.gamePiece.setStatusValue('combatTarget', null);
            let onArrive = function(arrive) {
        //        console.log("Arrive at Target", arrive);
                this.initiateCombat(engageTarget);
            }.bind(this);
            this.gamePiece.movementPath.addPathEndCallback(onArrive);
            this.gamePiece.movementPath.setPathTargetPiece(engageTarget);
        } else {
            this.initiateCombat(engageTarget);
        }

    }

    initiateCombat(engageTarget) {
        this.gamePiece.setStatusValue('targState', ENUMS.CharacterState.COMBAT);
        this.gamePiece.setStatusValue('combatTarget', engageTarget);
    }

    determineAttackRangeMargin(engageTarget) {
        let targetSize = engageTarget.getStatusByKey('size')
        let meleeRange = this.gamePiece.getStatusByKey('meleeRange');
        return meleeRange + targetSize + 0.05
    }
    measureAttackRange(engageTarget) {
        let distance = MATH.distanceBetween(this.gamePiece.getPos(), engageTarget.getPos());
        let margin = this.determineAttackRangeMargin(engageTarget);
        let combatRange = this.gamePiece.getStatusByKey('size') + margin;
        return distance < combatRange;
    }
    updateEngagedTarget(engageTarget) {
        if (!engageTarget) return;
        if (engageTarget.isDead) {
            console.log("Already dead, dont call phone")
            this.gamePiece.movementPath.cancelMovementPath();
            this.gamePiece.setStatusValue('charState', ENUMS.CharacterState.IDLE_HANDS);
            this.gamePiece.setStatusValue('targState', ENUMS.CharacterState.IDLE_HANDS);
            this.gamePiece.setStatusValue('engageTarget', null);
            this.gamePiece.setStatusValue('selectedTarget', null);
            this.gamePiece.setStatusValue('combatTarget', null);
            this.gamePiece.setStatusValue('disengagingTarget', null);
        } else if (engageTarget) {
        //    this.gamePiece.getSpatial().turnTowardsPos(engageTarget.getPos());
            let isInRange = this.measureAttackRange(engageTarget)
            if (isInRange) {
                this.initiateCombat(engageTarget);
            //    this.moveToEngagedTarget(engageTarget);
            } else {
                this.moveToEngagedTarget(engageTarget);
            }
        }
    }

}

export { CombatMovementProcessor }