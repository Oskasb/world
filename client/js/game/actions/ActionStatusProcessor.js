import {ENUMS} from "../../application/ENUMS.js";
import {MATH} from "../../application/MATH.js";
import {evt} from "../../application/event/evt.js";
import {applyServerAction} from "../../../../Server/game/action/ServerActionFunctions.js";



function modifyTargetHP(target, change, typeKey) {

    if (change < 0) {
    //    target.actorText.pieceTextPrint(Math.abs(change), ENUMS.Message.DAMAGE_NORMAL_TAKEN, 3)
        target.actorText.say("ouch")
    } else {
    //    target.actorText.pieceTextPrint(change, ENUMS.Message.HEALING_GAINED, 3)
        target.actorText.say("nice")
    }

}

function processActionStatusEffects(target, modifier, amount, sourceActor) {
    if (modifier === ENUMS.StatusModifiers.APPLY_DAMAGE) {
        modifyTargetHP(target, -amount)
    } else if  (modifier === ENUMS.StatusModifiers.APPLY_HEAL) {
        modifyTargetHP(target, amount)
    }

    sourceActor.actorText.say("I did it")

}

function processStatisticalActionApplied(target, modifiers, sourceActor) {
    for (let i = 0; i < modifiers.length;i++) {
        let modifier = modifiers[i];
        i++;
        let amount = modifiers[i];
        processActionStatusEffects(target, modifier, amount, sourceActor)
    }

}

export {
    processStatisticalActionApplied,
    processActionStatusEffects
}