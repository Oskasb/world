import {ENUMS} from "../../application/ENUMS.js";
import {MATH} from "../../application/MATH.js";
import {evt} from "../../application/event/evt.js";
import {applyServerAction} from "../../../../Server/game/action/ServerActionFunctions.js";
import {getStatusPosition} from "../../../../Server/game/actor/ActorStatusFunctions.js";



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
         //   let actorMovement = target.actorMovement;
        //    let walkGrid = actorMovement.gameWalkGrid;
         //   let tileSelector = target.getTileSelector();
            let tPos = getStatusPosition(sourceActor);
        //    tileSelector.setPos(tPos);
        //    actorMovement.tileSelectionActive(target);
            //    let fromPos = getStatusPosition(target);
        //    target.transitionTo(tPos, 1)
        }

        target.actorText.say("on it")
    } else if  (modifier === ENUMS.StatusModifiers.APPLY_LEAP) {
        //    modifyTargetHP(target, amount)
        console.log("Apply leap -- TRANSITION", target, modifier, value, sourceActor)

        let tPos = getStatusPosition(sourceActor);
        target.transitionTo(tPos, 0.6)

        target.actorText.say("whoosch")
    }



}

function processStatisticalActionApplied(target, modifiers, sourceActor) {
    for (let i = 0; i < modifiers.length;i++) {
        let modifier = modifiers[i];
        i++;
        let value = modifiers[i];
        processActionStatusEffects(target, modifier, value, sourceActor)
    }

}

export {
    processStatisticalActionApplied,
    processActionStatusEffects
}