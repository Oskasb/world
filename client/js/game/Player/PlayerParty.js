

class PlayerParty {
    constructor() {
        this.actors = [];
    }

    addPartyActor(actor) {


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

        if (actor.call.getRemote()) {
            let selectedActor = GameAPI.getGamePieceSystem().selectedActor;
            selectedActor.actorText.say("Poke You")

        } else {
            GameAPI.getGamePieceSystem().setSelectedGameActor(actor);
        }

    }

    getPartyActors() {
        return this.actors;
    }

    removePartyActor(actor) {
        MATH.splice(this.actors, actor);
    }

}

export {PlayerParty}