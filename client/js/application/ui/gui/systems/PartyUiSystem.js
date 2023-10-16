import {GuiExpandingContainer} from "../widgets/GuiExpandingContainer.js";
import {GuiCharacterPortrait} from "../widgets/GuiCharacterPortrait.js";

let playerPortraitLayoutId = 'widget_party_portrait_actor_button'

let container = null;
let actors = null;
let playerParty = null;
let portraits = []
let selectedActor = null;

function debugDrawActorIndex(actor, index) {
    actor.setStatusKey('hp', Math.ceil(Math.random() * actor.getStatus('maxHP')))
   // actor.actorText.pieceTextPrint(""+index)
}
let testActive = function(actor) {
    if (actor.getStatus('party_selected')) {
        return true;
    } else {
        return false;
    }
}

let onActivate = function(actor) {
    console.log("Button Pressed, onActivate:", actor)

    if (selectedActor) {
        selectedActor.actorText.say('Unselected')
        selectedActor.setStatusKey('party_selected', false)
    }
    if (actor === selectedActor) {
        selectedActor = null;
        return;
    } else {
        playerParty.selectPartyActor(actor);
    }
    selectedActor = actor;
    actor.setStatusKey('party_selected', true)
    actor.actorText.say('Party Selected')
}

let onReady = function(portrait) {
    console.log("onReady", portrait)
    container.addChildWidgetToContainer(portrait.guiWidget)
    portrait.actor.setStatusKey('party_selected', false)
    setTimeout(function() {
        container.fitContainerChildren()
    },0)
}
function addActorPortrait(actor) {
    let seqIndex = actors.indexOf(actor);
    portraits[actor.index] = new GuiCharacterPortrait(actor, playerPortraitLayoutId, onActivate, testActive, 0.0, 0.0, onReady)
}

function renderPartyActorUi(actor, tpf, time) {
    if (actor.getStatus('has_turn')) {
    //    debugDrawActorIndex(actor, actors.indexOf(actor))
    }

    if (!portraits[actor.index]) {
        addActorPortrait(actor);
    }

}

class PartyUiSystem {
    constructor() {

        let updatePartyUiSystem = function(tpf) {
            playerParty = GameAPI.getGamePieceSystem().getPlayerParty();
            actors = playerParty.getPartyActors();

            MATH.forAll(actors, renderPartyActorUi, tpf)

        //    let currentTurnIndex = encounterTurnSequencer.turnIndex;

            for (let i = 0; i < portraits.length; i++) {
                let portrait = portraits[i]
                if (portrait) {
                    portrait.updateCharacterPortrait(tpf)
                }
            }
        }.bind(this)

        this.call = {
            updatePartyUiSystem:updatePartyUiSystem
        }

    }

    setEncounterSequencer(sequencer) {

    }

    activatePartyUiSystem() {

        let containerReady = function(widget) {
            console.log(widget)
        //    container = widget;
            widget.attachToAnchor('mid_left');
        }

        if (!container) {
            container = new GuiExpandingContainer()
            container.initExpandingContainer('widget_party_portrait_expanding_container', containerReady)
        }

        ThreeAPI.addPrerenderCallback(this.call.updatePartyUiSystem)
    }

    closePartyUi() {

        while (portraits.length) {
            let portrait = portraits.pop()
            if (portrait) {
                portrait.closeCharacterPortrait()
            }
        }
        ThreeAPI.unregisterPrerenderCallback(this.call.updatePartyUiSystem)
    }

}

export { PartyUiSystem }