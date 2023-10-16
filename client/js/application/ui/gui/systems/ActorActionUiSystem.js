import {GuiCharacterPortrait} from "../widgets/GuiCharacterPortrait.js";

let playerPortraitLayoutId = 'widget_actor_action_portrait_button'
let actor = null;

let portrait = null;

let testActive = function(actor) {
    if (actor.getStatus('party_selected')) {
        return true;
    } else {
        return false;
    }
}

let onActivate = function(actor) {
    console.log("Button Pressed, onActivate:", actor)
    actor.actorText.say('Yes Me')
}

let onReady = function(portrait) {
    console.log("onReady", portrait)
  //  portrait.guiWidget.attachToAnchor('center');
}


let setupActionUi = function() {
    portrait = new GuiCharacterPortrait(actor, playerPortraitLayoutId, onActivate, testActive, -0.13, -0.3, onReady, 'widget_actor_action_portrait_frame', 'progress_indicator_action_portrait_hp')
}

let clearActionUi = function() {
    portrait.closeCharacterPortrait()
}

let updateActiveActorUi = function(tpf) {

    let activeActor = GameAPI.getGamePieceSystem().getSelectedGameActor();
    if (actor !== activeActor) {
        if (actor) {
            clearActionUi()
        }
        actor = activeActor;
        setupActionUi()
    }
    if (portrait) {
        portrait.updateCharacterPortrait(tpf)
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