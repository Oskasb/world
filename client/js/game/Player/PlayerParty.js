

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

        let remote = actor.call.getRemote();
        let selectedActor = GameAPI.getGamePieceSystem().selectedActor;

        if (current) {
            current.setStatusKey(ENUMS.ActorStatus.PARTY_SELECTED, false);
            if (current.call.getRemote()) {
                actor.actorText.say("Drop Me")
                selectedActor.setStatusKey(ENUMS.ActorStatus.SELECTED_TARGET, "");
            }
            if (current === actor) {
                return;
            }
        }

        if (actor === null) {
            return;
        }

        actor.setStatusKey(ENUMS.ActorStatus.PARTY_SELECTED, true);

        if (remote) {
            let selectedActor = GameAPI.getGamePieceSystem().selectedActor;
            actor.actorText.say("Picked Me")
            selectedActor.actorText.say("Poke You")
            selectedActor.setStatusKey(ENUMS.ActorStatus.SELECTED_TARGET, actor.id);
        } else {
            GameAPI.getGamePieceSystem().setSelectedGameActor(actor);
        }
    }

    getPartyActors() {
        return this.actors;
    }

    clearPartyMemebers() {
        MATH.emptyArray(this.actors);
        this.actors.push(GameAPI.getGamePieceSystem().selectedActor);
    }

    removePartyActor(actor) {
        return MATH.splice(this.actors, actor);
    }

}

export {PlayerParty}