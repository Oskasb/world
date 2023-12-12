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
    actor.setStatusKey(ENUMS.ActorStatus.IN_COMBAT, false);
    actor.setStatusKey(ENUMS.ActorStatus.HAS_TURN, false);
    actor.setStatusKey(ENUMS.ActorStatus.SELECTED_TARGET, '');
    actor.setStatusKey(ENUMS.ActorStatus.SEQUENCER_SELECTED, false);
    actor.setStatusKey(ENUMS.ActorStatus.RETREATING, '');
    actor.setStatusKey(ENUMS.ActorStatus.EXIT_ENCOUNTER, '');
    actor.setStatusKey(ENUMS.ActorStatus.ACTIVATING_ENCOUNTER, '');
    actor.setStatusKey(ENUMS.ActorStatus.ACTIVATED_ENCOUNTER, '');
    actor.setStatusKey(ENUMS.ActorStatus.SELECTED_ENCOUNTER, '');
}

export {
    getActorBySelectedTarget,
    hasHostileTarget,
    clearTargetSelection,
    clearActorEncounterStatus
}