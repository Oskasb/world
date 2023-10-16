

class PlayerParty {
    constructor() {
        this.actors = [];
    }

    addPartyActor(actor) {

        actor.activateGameActor();
        actor.setStatusKey('hp', actor.getStatus('maxHP'))
        if (this.actors.length === 0) {
            this.selectPartyActor(actor);
        }

        this.actors.push(actor);
    }

    selectPartyActor(actor) {
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