import {ENUMS} from "../../../client/js/application/ENUMS.js";
import {MATH} from "../../../client/js/application/MATH.js";

function modifyTargetHP(target, change, typeKey) {
    let hp = target.getStatus(ENUMS.ActorStatus.HP);
    let maxHP = target.getStatus(ENUMS.ActorStatus.MAX_HP);
    let newHP = Math.ceil(MATH.clamp(hp +change, 0, maxHP ));
        target.setStatusKey(ENUMS.ActorStatus.HP, newHP)
        target.setStatusKey(ENUMS.ActorStatus[typeKey], hp - newHP)
 //   console.log('modifyTargetHP', [target], newHP, maxHP, hp, change, typeKey)

    if (newHP === 0) {
        target.setStatusKey(ENUMS.ActorStatus.DEAD, true)
    }

}

function applyServerAction(target, modifier, amount) {

    let change = Math.ceil(amount * 0.5 + Math.random()*amount);

    if (modifier === ENUMS.StatusModifiers.APPLY_DAMAGE) {
        modifyTargetHP(target, -change, ENUMS.ActorStatus.DAMAGE_APPLIED)
    } else if  (modifier === ENUMS.StatusModifiers.APPLY_HEAL) {
        modifyTargetHP(target, change, ENUMS.ActorStatus.HEALING_APPLIED)
    }
 //   console.log('applyServerAction', target.id, modifier, change, amount)

}

export {
    applyServerAction
}