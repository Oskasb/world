import {ENUMS} from "../../../client/js/application/ENUMS.js";
import {MATH} from "../../../client/js/application/MATH.js";
import {
    getActorForward,
    getStatusPosition, getStatusVelocity, moveToPosition,
    registerCombatStatus,
    setDestination, setStatusPosition,
    unregisterCombatStatus
} from "../actor/ActorStatusFunctions.js";

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

function applyServerAction(target, modifier, value, sourceActor) {

    if (modifier === ENUMS.StatusModifiers.APPLY_DAMAGE) {
        let change = Math.ceil(value * 0.5 + Math.random()*value);
        modifyTargetHP(target, -change, ENUMS.ActorStatus.DAMAGE_APPLIED)
    } else if  (modifier === ENUMS.StatusModifiers.APPLY_HEAL) {
        let change = Math.ceil(value * 0.5 + Math.random()*value);
        modifyTargetHP(target, change, ENUMS.ActorStatus.HEALING_APPLIED)
    } else if  (modifier === ENUMS.StatusModifiers.SELECT_LEAP) {
        let tPos = getStatusPosition(target);
        setDestination(sourceActor, tPos);
        registerCombatStatus(sourceActor, ENUMS.CombatStatus.LEAPING)
    } else if  (modifier === ENUMS.StatusModifiers.APPLY_LEAP) {
        unregisterCombatStatus(sourceActor, ENUMS.CombatStatus.LEAPING)
    } else if  (modifier === ENUMS.StatusModifiers.APPLY_KNOCKBACK) {

        let pos = getStatusPosition(target);
         let direction = getActorForward(sourceActor);
    //     direction.normalize();
         direction.multiplyScalar(value);
         direction.add(pos);
        console.log('APPLY_KNOCKBACK applyServerAction', target.id, modifier, value, sourceActor.id, pos, direction)

        setDestination(target, direction);
        registerCombatStatus(target, ENUMS.CombatStatus.LEAPING)
        //    moveToPosition(target, direction, 0.05);

    } else {
        console.log('unhandled applyServerAction', target.id, modifier, value, sourceActor.id)
    }
 //   console.log('applyServerAction', target.id, modifier, change, amount)

}

function checkCombatActionConditions(actor, action) {
    let requiresTarget = action.status.call.getStatusByKey(ENUMS.ActionStatus.REQUIRES_TARGET)

    if (requiresTarget) {
        let targetId = actor.getStatus(ENUMS.ActorStatus.SELECTED_TARGET);

        if (targetId) {
            let target = GameAPI.getActorById(targetId);

            if (!target) {
                console.log("No target found", targetId);
                return;
            }

            let isDead = target.getStatus(ENUMS.ActorStatus.DEAD)

            if (isDead) {
                return false;
            }

            let apos = actor.getSpatialPosition(actor.actorObj3d.position);
            let tpos = target.getSpatialPosition(target.actorObj3d.position);

            let distance = MATH.distanceBetween(apos, tpos);

            let rangeMin = action.status.call.getStatusByKey(ENUMS.ActionStatus.RANGE_MIN);
            let rangeMax = action.status.call.getStatusByKey(ENUMS.ActionStatus.RANGE_MAX);

            let rangeChecked = MATH.valueIsBetween(distance, rangeMin - 0.5, rangeMax + 0.5)

            if (rangeChecked) {
                return true;
            } else {
                return false;
            }

        } else {
            return false;
        }
    } else {
        return true;
    }
}

export {
    applyServerAction,
    checkCombatActionConditions
}