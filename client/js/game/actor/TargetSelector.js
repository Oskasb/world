let actorList = []

class TargetSelector {
    constructor() {}

    getActorEncounterTargetCandidates(actor) {
        MATH.emptyArray(actorList);
        let encounterSequencer = GameAPI.call.getGameEncounterSystem().getEncounterTurnSequencer()
        encounterSequencer.getOpposingActors(actor, actorList);
        return actorList;
    }

    selectActorEncounterTarget(actor, candidates) {
        let target = MATH.getRandomArrayEntry(candidates);
        return target;
    }

    selectActorActionTargetId(actor, action) {
        // if action is "helpful" select friendlies instead...
        let opponentList = GameAPI.getGamePieceSystem().listCombatActorOpponents(actor);
        return MATH.getRandomArrayEntry(opponentList);
    }

}

export {TargetSelector}