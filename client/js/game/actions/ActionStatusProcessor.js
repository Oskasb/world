import {ENUMS} from "../../application/ENUMS.js";
import {MATH} from "../../application/MATH.js";
import {evt} from "../../application/event/evt.js";

function processActionStatus(action) {

}

let msg = {
    request:ENUMS.ClientRequests.APPLY_ACTION_EFFECT,
    targetId:"",
    modifier:"",
    amount:0
}

function modifyTargetHP(target, change, typeKey) {
    let hp = target.getStatus(ENUMS.ActorStatus.HP);
    let maxHP = target.getStatus(ENUMS.ActorStatus.MAX_HP);
    let newHP = Math.ceil(MATH.clamp(hp +change, 0, maxHP ));

    if (target.actorText) {
        if (change < 0) {
            target.actorText.pieceTextPrint(Math.abs(change), ENUMS.Message.DAMAGE_NORMAL_TAKEN, 3)
        } else {
            target.actorText.pieceTextPrint(change, ENUMS.Message.HEALING_GAINED, 3)
        }
    } else {
        target.setStatusKey(ENUMS.ActorStatus.HP, newHP)
        target.setStatusKey(ENUMS.ActorStatus[typeKey], hp - newHP)
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
    console.log('processStatisticalActionApplied', target, modifier, amount)

    //    if (target.getStatus(ENUMS.ActorStatus.CLIENT_STAMP) === 'server') {
            msg.targetId = target.id; // getStatus(ENUMS.ActorStatus.ACTOR_ID);
            msg.modifier = modifier;
            msg.amount = amount;
            evt.dispatch(ENUMS.Event.SEND_SOCKET_MESSAGE, msg)
    //    }
}

export {
    processActionStatus,
    processStatisticalActionApplied
}