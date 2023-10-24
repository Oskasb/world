

class PlayerParty {
    constructor() {
        this.actors = [];
    }

    addPartyActor(actor) {

        actor.activateGameActor();
        actor.setStatusKey(ENUMS.ActorStatus.HP, actor.getStatus(ENUMS.ActorStatus.MAX_HP))
        if (this.actors.length === 0) {
            this.selectPartyActor(actor);
        }

        this.actors.push(actor);
    }

    getPartySelection() {
        for (let i = 0; i < this.actors.length; i++) {
            let actor = this.actors[i];
            if (actor.getStatus(ENUMS.ActorStatus.PARTY_SELECTED)) {
                return actor;
            }
        }
        return null;
    }

    selectPartyActor(actor) {
        let current = this.getPartySelection();
        if (current) {
            current.setStatusKey(ENUMS.ActorStatus.PARTY_SELECTED, false);
        }
        actor.setStatusKey(ENUMS.ActorStatus.PARTY_SELECTED, true);
        GameAPI.getGamePieceSystem().setSelectedGameActor(actor);
    }

    getPartyActors() {
        return this.actors;
    }

    removePartyActor(actor) {
        MATH.splice(this.actors, actor);
        actor.deactivateGameActor();
    }

}

export {PlayerParty}