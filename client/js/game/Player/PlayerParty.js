

class PlayerParty {
    constructor() {
        this.actors = [];
    }

    addPartyActor(actor) {
        if (this.isMember(actor)) {
            return;
        }
        this.actors.push(actor);
    }

    isMember(actor) {
        if (this.actors.indexOf(actor) !== -1) {
            return true;
        } else {
            return false;
        }
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
            if (current.id === actor.id) {
                return;
            }
        }
        actor.setStatusKey(ENUMS.ActorStatus.PARTY_SELECTED, true);

        if (actor.call.getRemote()) {
            let selectedActor = GameAPI.getGamePieceSystem().selectedActor;
            selectedActor.actorText.say("Poke You")

        } else {
            if (actor === null) {
                return;
            }
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