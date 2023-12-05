import {GuiCharacterPortrait} from "../widgets/GuiCharacterPortrait.js";
import { GuiActorActionButton } from "../widgets/GuiActorActionButton.js";
import { TargetSelector} from "../../../../game/actor/TargetSelector.js";

let targetSelector = new TargetSelector();
let playerPortraitLayoutId = 'widget_actor_action_portrait_button'
let actor = null;
let actionButtons = [];
let portrait = null;

let testActive = function(actor) {
    if (actor.getStatus(ENUMS.ActorStatus.HAS_TURN)) {
        return true;
    } else {
        return false;
    }
}

let onActivate = function(actor) {
 //   console.log("Button Pressed, onActivate:", actor)
    actor.actorText.say('Me '+actor.index)
}

let onReady = function(portrait) {
  //  console.log("onReady", portrait)
  //  portrait.guiWidget.attachToAnchor('center');
}

let onActionButtonReady = function(widget) {


};

let activatedAction = null;
let selectedTarget = null;

let onActionActivate = function(action, actionId) {

    let actor = GameAPI.getGamePieceSystem().selectedActor;
    if (actor.isPlayerActor()) {
        let partySelected = GameAPI.getGamePieceSystem().getPlayerParty().getPartySelection();
        if (partySelected !== actor) {
            GuiAPI.screenText("Not party selected")
            return;
        }
    } else {
        GuiAPI.screenText("Not your button")
        return;
    }



 //   console.log("onActionActivate:", action)

    action.initAction(actor);
    activatedAction = action;

    let inCombat = actor.getStatus(ENUMS.ActorStatus.IN_COMBAT)

    if (inCombat) {
        let targetId = actor.getStatus(ENUMS.ActorStatus.SELECTED_TARGET);
        if (!targetId) {
            targetId = targetSelector.selectActorActionTargetId(actor, action)
        }
    //    selectedTarget = GameAPI.getActorById(targetId);
        action.setActionTargetId(targetId)
        action.activateAttack(action.actor.call.turnEnd)
        //action.call.advanceState();
    /*
        setTimeout(function() {

            activatedAction = null;
            selectedTarget = null;
        }, 1000)
     */
    } else {
        console.log("Non combat action", [action])
    }

    if (selectedTarget) {

    } else {
    //    actor.actorText.say('Pick a target')
    }
}



let actionTestActive = function(action) {
//    console.log("actionTestActive:", action)
}
let addActionButton = function(actor, actionId) {
    let actionButton = new GuiActorActionButton(actor, actionId, 'widget_companion_sequencer_button', onActionActivate, actionTestActive, -0.07+actionButtons.length*0.064, -0.33, onActionButtonReady);
  //  actionButton.initActionButton('widget_action_button', onActionButtonReady);
    actionButtons.push(actionButton);
}

let setupActionUi = function() {
    portrait = new GuiCharacterPortrait(actor, playerPortraitLayoutId, onActivate, testActive, -0.16, -0.3, onReady, 'widget_actor_action_portrait_frame', 'progress_indicator_action_portrait_hp')
}

let setupActionButtons = function(actor, actorStatusKey) {
    let actions = actor.getStatus(ENUMS.ActorStatus[actorStatusKey]);
    for (let i = 0; i < actions.length; i++) {
        addActionButton(actor, actions[i]);
    }
}

let removeActionButtons = function() {
    while (actionButtons.length) {
        actionButtons.pop().removeGuiWidget();
    }
    activatedAction = null;
    selectedTarget = null;
}


let clearActionUi = function() {
    if (portrait) {
        portrait.closeCharacterPortrait()
    }
    portrait = null;
    removeActionButtons();
}

let updateActiveActorUi = function(tpf) {

    let activeActor = GameAPI.getGamePieceSystem().getPlayerParty().getPartySelection();

    if (actor !== activeActor) {
        if (actor) {
            clearActionUi()
        }
        actor = activeActor;
        if (activeActor) {
            setupActionUi()
        }
    }


    if (portrait) {
        if (!actor) {
            clearActionUi();
        } else {
            portrait.updateCharacterPortrait(tpf)

            if (actor.getStatus(ENUMS.ActorStatus.IN_COMBAT)) {
                if (actor.getStatus(ENUMS.ActorStatus.HAS_TURN)) {
                    if (actionButtons.length === 0) {
                        setupActionButtons(actor, ENUMS.ActorStatus.ACTIONS);
                    }
                }
            } else {
                if (actionButtons.length === 0) {
                    setupActionButtons(actor, ENUMS.ActorStatus.TRAVEL);
                }
            }
        }
    }

}

class ActorActionUiSystem {
    constructor() {

        this.call = {
            updateActiveActorUi:updateActiveActorUi
        }

    }

    activateActorActionUiSystem() {
        ThreeAPI.addPrerenderCallback(this.call.updateActiveActorUi)
    }


    closeActorActionUi() {
        ThreeAPI.unregisterPrerenderCallback(this.call.updateActiveActorUi)
    }


}

export {ActorActionUiSystem}