import {ENUMS} from "../../application/ENUMS.js";
import {MATH} from "../../application/MATH.js";
import {evt} from "../../application/event/evt.js";
import {applyServerAction} from "../../../../Server/game/action/ServerActionFunctions.js";
import {
    getStatusPosition,
    registerCombatStatus,
    setDestination, unregisterCombatStatus
} from "../../../../Server/game/actor/ActorStatusFunctions.js";



function modifyTargetHP(target, change, typeKey) {

    if (change < 0) {
    //    target.actorText.pieceTextPrint(Math.abs(change), ENUMS.Message.DAMAGE_NORMAL_TAKEN, 3)
        target.actorText.say("ouch")
    } else {
    //    target.actorText.pieceTextPrint(change, ENUMS.Message.HEALING_GAINED, 3)
        target.actorText.say("nice")
    }

}

function processActionStatusEffects(target, modifier, value, sourceActor) {
    if (modifier === ENUMS.StatusModifiers.APPLY_DAMAGE) {
        modifyTargetHP(target, -value)
        sourceActor.actorText.say("got you")
    } else if  (modifier === ENUMS.StatusModifiers.APPLY_HEAL) {
        modifyTargetHP(target, value)
        sourceActor.actorText.say("welcome")
    } else if  (modifier === ENUMS.StatusModifiers.SELECT_LEAP) {
    //    modifyTargetHP(target, amount)
        console.log("Select leap -- DRAW TRAJECTORY", target, modifier, value, sourceActor)

        if (value === "MELEE_POS") {
            let tPos = getStatusPosition(sourceActor);
            setDestination(target, tPos);
            registerCombatStatus(target, ENUMS.CombatStatus.LEAPING);
        }

        target.actorText.say("on it")
    } else if  (modifier === ENUMS.StatusModifiers.APPLY_LEAP) {
        //    modifyTargetHP(target, amount)
        console.log("Apply leap -- TRANSITION", target, modifier, value, sourceActor)
        unregisterCombatStatus(target, ENUMS.CombatStatus.LEAPING);
        let tPos = getStatusPosition(sourceActor);
        target.transitionTo(tPos, 0.5)
    //    target.setStatusKey(ENUMS.ActorStatus.TRAVEL_MODE, ENUMS.TravelMode.TRAVEL_MODE_PASSIVE);
        target.actorText.say("whoosch")
    }

}

function processStatisticalActionApplied(target, modifiers, sourceActor) {
    for (let i = 0; i < modifiers.length;i++) {
        let modifier = modifiers[i];
        i++;
        let value = modifiers[i];
    //    console.log("processActionStatusEffects")
        processActionStatusEffects(target, modifier, value, sourceActor)
    }

}

export {
    processStatisticalActionApplied,
    processActionStatusEffects
}