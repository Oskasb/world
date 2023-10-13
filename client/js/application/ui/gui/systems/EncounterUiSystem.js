
import {GuiCharacterPortrait} from "../widgets/GuiCharacterPortrait.js";

let playerPortraitLayoutId = 'widget_companion_sequencer_button'
let hostilePortraitLayoutId = 'widget_hostile_sequencer_button'

let encounterTurnSequencer = null;
let actors = null;
let portraits = []

function debugDrawActorIndex(actor, index) {
    actor.setStatusKey('hp', Math.ceil(Math.random() * actor.getStatus('maxHP')))
   // actor.actorText.pieceTextPrint(""+index)
}
let testActive = function(actor) {
    if (actor.getStatus('has_turn')) {
        return true;
    } else {
        return false;
    }
}

let onActivate = function(actor) {
    console.log("Button Pressed, onActivate:", actor)
}

let onReady = function(portrait) {
    console.log("onReady", portrait)
}
function addActorPortrait(actor) {
    let count = actors.length;
    let seqIndex = actors.indexOf(actor);
    let frac = MATH.calcFraction(0, count, seqIndex) * 0.4;
    let portraitLayoutId = hostilePortraitLayoutId;
    if (actor.isPlayerActor()) {
        portraitLayoutId = playerPortraitLayoutId;
    }
    portraits[actor.index] = new GuiCharacterPortrait(actor, portraitLayoutId, onActivate, testActive, -0.17 + seqIndex*0.065, 0.34, onReady)
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

    for (let i = 0; i < portraits.length; i++) {
        let portrait = portraits[i]
        if (portrait) {
            portrait.updatePortraitInteractiveState()
        }
    }

}
class EncounterUiSystem {
    constructor() {


    }

    setEncounterSequencer(sequencer) {
        encounterTurnSequencer = sequencer;
        GuiAPI.addGuiUpdateCallback(updateDynamicEncounterUiSystem)
    }

    closeEncounterUi() {

        while (portraits.length) {
            let portrait = portraits.pop()
            if (portrait) {
                portrait.closeCharacterPortrait()
            }
        }

        GuiAPI.removeGuiUpdateCallback(updateDynamicEncounterUiSystem)
    }




}

export { EncounterUiSystem }