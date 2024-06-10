import {ENUMS} from "../../../client/js/application/ENUMS.js";
import {MATH} from "../../../client/js/application/MATH.js";
import {
    applyActorKilled,
    faceTowardsPos,
    getActorForward,
    getStatusPosition, getStatusVelocity, moveToPosition,
    registerCombatStatus,
    setDestination, setStatusPosition,
    unregisterCombatStatus
} from "../actor/ActorStatusFunctions.js";
import {parseConfigData} from "../utils/GameServerFunctions.js";
import {StatisticalAction} from "../../../client/js/game/actions/StatisticalAction.js";

function modifyTargetHP(target, change, typeKey) {
    let hp = target.getStatus(ENUMS.ActorStatus.HP);
    let maxHP = target.getStatus(ENUMS.ActorStatus.MAX_HP);
    let newHP = Math.ceil(MATH.clamp(hp +change, 0, maxHP ));
        target.setStatusKey(ENUMS.ActorStatus.HP, newHP)
        target.setStatusKey(ENUMS.ActorStatus[typeKey], hp - newHP)
 //   console.log('modifyTargetHP', [target], newHP, maxHP, hp, change, typeKey)

    if (newHP === 0) {
        target.setStatusKey(ENUMS.ActorStatus.DEAD, true)
        applyActorKilled(target);
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
        unregisterCombatStatus(sourceActor, ENUMS.CombatStatus.LEAPING)
        let pos = getStatusPosition(target);
         let direction = getActorForward(sourceActor);
    //     direction.normalize();
         direction.multiplyScalar(value);
         direction.add(pos);
        console.log('APPLY_KNOCKBACK applyServerAction', target.id, modifier, value, sourceActor.id, pos, direction)
        target.serverTransition.activateKnockbackTransition(direction);
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


function testActionTrigger(serverAction, actionKey, trigger) {
    let conf = serverAction.getActionConfig(actionKey);

    let statActions = conf['statistical_actions'];
    let statConfigs = serverAction.getStatActionConfigs();

    for (let i = 0; i < statActions.length; i++) {
        let statId = statActions[i];
        let statsConf = parseConfigData(statConfigs, statId);
        let status = statsConf['status'];

        let key = status[ENUMS.ActionStatus.ACTION_TRIGGER]

        console.log("Test Key ", key, trigger);

        if (key === trigger) {
            return true;
        }

    }

}

function processActorTargetTrigger(actor, target, trigger, encounter) {
    let passiveActions = actor.getStatus(ENUMS.ActorStatus.PASSIVE_ACTIONS);
    let serverAction = actor.serverAction;
    for (let i = 0; i < passiveActions.length; i++) {
        let activate = testActionTrigger(serverAction, passiveActions[i], trigger);
        if (activate) {
            serverAction.activateServerActionId(passiveActions[i], actor, target, encounter);
            encounter.sendActionStatusUpdate(serverAction);
        //    console.log("activateServerActionId", passiveActions[i])
            return;
        }
    }

}

function processActorEngageTarget(actor, target, encounter) {
    let hasTurn = actor.getStatus(ENUMS.ActorStatus.HAS_TURN);
    if (hasTurn === false) {
        faceTowardsPos(actor, getStatusPosition(target));
        processActorTargetTrigger(actor, target, ENUMS.Trigger.ON_ENGAGED, encounter);
    } else {
        processActorTargetTrigger(actor, target, ENUMS.Trigger.ON_ENGAGING, encounter);
    }
}

function processDisengagement(actor, target, encounter) {
    let hasTurn = actor.getStatus(ENUMS.ActorStatus.HAS_TURN);

    if (hasTurn === false) {
        faceTowardsPos(actor, getStatusPosition(target));
        processActorTargetTrigger(actor, target, ENUMS.Trigger.ON_DISENGAGE, encounter);
    }

}

export {
    applyServerAction,
    checkCombatActionConditions,
    processActorEngageTarget,
    processDisengagement
}