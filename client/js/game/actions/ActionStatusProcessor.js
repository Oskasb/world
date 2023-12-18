function processActionStatus(action) {

}

function modifyTargetHP(target, change, typeKey) {
    let hp = target.getStatus(ENUMS.ActorStatus.HP);
    let maxHP = target.getStatus(ENUMS.ActorStatus.MAX_HP);
    let newHP = Math.ceil(MATH.clamp(hp +change, 0, maxHP ));
    target.setStatusKey(ENUMS.ActorStatus.HP, newHP)
    target.setStatusKey(ENUMS.ActorStatus[typeKey], hp - newHP)
    if (change < 0) {
        target.actorText.pieceTextPrint(Math.abs(change), ENUMS.Message.DAMAGE_NORMAL_TAKEN, 3)
    } else {
        target.actorText.pieceTextPrint(change, ENUMS.Message.HEALING_GAINED, 3)
    }
}

function processStatisticalActionApplied(target, modifier, amount) {

    if (modifier === ENUMS.StatusModifiers.APPLY_DAMAGE) {
        let change = Math.ceil(amount * 0.5 + Math.random()*amount);
        modifyTargetHP(target, -change, ENUMS.ActorStatus.DAMAGE_APPLIED)
    } else if  (modifier === ENUMS.StatusModifiers.APPLY_HEAL) {
        let change = Math.ceil(amount * 0.5 + Math.random()*amount);
        modifyTargetHP(target, change, ENUMS.ActorStatus.HEALING_APPLIED)
    }



}

export {
    processActionStatus,
    processStatisticalActionApplied
}