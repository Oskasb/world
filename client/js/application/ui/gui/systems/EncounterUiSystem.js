
let encounterTurnSequencer = null;
let actors = null;

function debugDrawActorIndex(actor, index) {
    actor.actorText.pieceTextPrint(""+index)
}

function renderEncounterActorUi(actor, tpf, time) {
    debugDrawActorIndex(actor, actors.indexOf(actor))
}

let updateDynamicEncounterUiSystem = function(tpf, time) {
    actors = encounterTurnSequencer.getSequencerActors();
 //   MATH.forAll(actors, renderEncounterActorUi, tpf, time)
}
class EncounterUiSystem {
    constructor() {


    }

    setEncounterSequencer(sequencer) {
        encounterTurnSequencer = sequencer;
        GuiAPI.addGuiUpdateCallback(updateDynamicEncounterUiSystem)
    }

    closeEncounterUi() {
        GuiAPI.removeGuiUpdateCallback(updateDynamicEncounterUiSystem)
    }




}

export { EncounterUiSystem }