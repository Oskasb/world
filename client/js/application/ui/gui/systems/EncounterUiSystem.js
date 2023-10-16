import {GuiExpandingContainer} from "../widgets/GuiExpandingContainer.js";
import {GuiCharacterPortrait} from "../widgets/GuiCharacterPortrait.js";

let playerPortraitLayoutId = 'widget_companion_sequencer_button'
let hostilePortraitLayoutId = 'widget_hostile_sequencer_button'

let encounterTurnSequencer = null;
let actors = null;
let portraits = []
let container = null;
let selectedActor = null;

function debugDrawActorIndex(actor, index) {
    actor.setStatusKey('hp', Math.ceil(Math.random() * actor.getStatus('maxHP')))
   // actor.actorText.pieceTextPrint(""+index)
}
let testActive = function(actor) {
    if (actor.getStatus('sequencer_selected')) {
        return true;
    } else {
        return false;
    }
}

let onActivate = function(actor) {
    console.log("Button Pressed, onActivate:", actor)

    if (selectedActor) {
        selectedActor.actorText.say('Unselected')
        selectedActor.setStatusKey('sequencer_selected', false)
    }
    if (actor === selectedActor) {
        selectedActor = null;
        return;
    }
    selectedActor = actor;
    actor.setStatusKey('sequencer_selected', true)
    actor.actorText.say('Sequencer Selected')
    let partyActor = GameAPI.getGamePieceSystem().getPlayerParty().getPartySelection()

    if (partyActor) {
        partyActor.setStatusKey('selected_target', selectedActor);
    }

}

let fitTimeout = null;

let onReady = function(portrait) {
    console.log("onReady", portrait)
    portrait.actor.setStatusKey('sequencer_selected', false)
    container.addChildWidgetToContainer(portrait.guiWidget)

    clearTimeout(fitTimeout);
    fitTimeout = setTimeout(function() {
        container.fitContainerChildren()
    },0)
}

function addActorPortrait(actor) {
    let count = actors.length;
    let seqIndex = actors.indexOf(actor);
    let frac = MATH.calcFraction(0, count, seqIndex) * 0.4;
    let portraitLayoutId = hostilePortraitLayoutId;
    if (actor.isPlayerActor()) {
        portraitLayoutId = playerPortraitLayoutId;
    }
    portraits[actor.index] = new GuiCharacterPortrait(actor, portraitLayoutId, onActivate, testActive, 0, 0, onReady)
}

function renderEncounterActorUi(actor, tpf, time) {
    if (actor.getStatus('has_turn')) {
    //    debugDrawActorIndex(actor, actors.indexOf(actor))
    }

    if (!portraits[actor.index]) {
        addActorPortrait(actor);
    }

}

let updateDynamicEncounterUiSystem = function(tpf, time) {
    actors = encounterTurnSequencer.getSequencerActors();
   MATH.forAll(actors, renderEncounterActorUi, tpf, time)

    let currentTurnIndex = encounterTurnSequencer.turnIndex;

    for (let i = 0; i < portraits.length; i++) {
        let portrait = portraits[i]
        if (portrait) {
            portrait.updateCharacterPortrait(tpf, currentTurnIndex)
        }
    }
}

class EncounterUiSystem {
    constructor() {

    }

    setEncounterSequencer(sequencer) {

        let containerReady = function(widget) {
            console.log(widget)
            //    container = widget;
            widget.attachToAnchor('top_q_left');
        }

        if (!container) {
            container = new GuiExpandingContainer()
            container.initExpandingContainer('widget_encounter_sequencer_expanding_container', containerReady)
        }

        encounterTurnSequencer = sequencer;
        ThreeAPI.addPrerenderCallback(updateDynamicEncounterUiSystem)
    }

    closeEncounterUi() {

        while (portraits.length) {
            let portrait = portraits.pop()
            if (portrait) {
                portrait.closeCharacterPortrait()
            }
        }
        ThreeAPI.unregisterPrerenderCallback(updateDynamicEncounterUiSystem)
    }

}

export { EncounterUiSystem }