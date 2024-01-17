function getActorBySelectedTarget(actor) {
    return GameAPI.getActorById(actor.getStatus(ENUMS.ActorStatus.SELECTED_TARGET))
}

function hasHostileTarget(actor) {
    let target = getActorBySelectedTarget(actor);
    if (target) {
        if (target.getStatus(ENUMS.ActorStatus.ALIGNMENT) === 'HOSTILE') {
            return true;
        }
    }
}

function clearTargetSelection(actor) {
    actor.setStatusKey(ENUMS.ActorStatus.SELECTED_TARGET, '')
}

function clearActorEncounterStatus(actor) {
    actor.actorText.say("Clearing Encounter Status")
    actor.setStatusKey(ENUMS.ActorStatus.DEAD, false);
    actor.setStatusKey(ENUMS.ActorStatus.TRAVEL_MODE, ENUMS.TravelMode.TRAVEL_MODE_WALK);
    actor.setStatusKey(ENUMS.ActorStatus.HAS_TURN, false);
    actor.setStatusKey(ENUMS.ActorStatus.HAS_TURN_INDEX, -1);
    actor.setStatusKey(ENUMS.ActorStatus.SELECTED_TARGET, '');
    actor.setStatusKey(ENUMS.ActorStatus.SEQUENCER_SELECTED, false);
    actor.setStatusKey(ENUMS.ActorStatus.PARTY_SELECTED, false);
    actor.setStatusKey(ENUMS.ActorStatus.REQUEST_PARTY, '');
    actor.setStatusKey(ENUMS.ActorStatus.RETREATING, '');
    actor.setStatusKey(ENUMS.ActorStatus.EXIT_ENCOUNTER, '');
    actor.setStatusKey(ENUMS.ActorStatus.ACTIVATING_ENCOUNTER, '');
    actor.setStatusKey(ENUMS.ActorStatus.ACTIVATED_ENCOUNTER, '');
    actor.setStatusKey(ENUMS.ActorStatus.SELECTED_ENCOUNTER, '');
    actor.setStatusKey(ENUMS.ActorStatus.DAMAGE_APPLIED, 0);
}

export {
    getActorBySelectedTarget,
    hasHostileTarget,
    clearTargetSelection,
    clearActorEncounterStatus
}