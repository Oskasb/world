


class EncounterTurnSequencer {
    constructor() {
        this.turnActorIndex = 0;
        this.actors = [];
        this.activeActor = null;
        this.turnIndex = 0;
        this.turnTime = 0;

        let turnEnded = function(actorObj3d) {
            this.turnTime = 0;
            this.activeActor = null;
            this.turnActorIndex++

            if (this.turnActorIndex === this.actors.length) {
                this.turnActorIndex = 0;
                this.turnIndex++
            }
            console.log("turnEnded", this.turnActorIndex, this.turnIndex)
        }.bind(this)

        this.call = {
            turnEnded:turnEnded
        }

    }

    getSequencerActors() {
        return this.actors;
    }

    addEncounterActor(actor) {
        actor.setStatusKey('hp', actor.getStatus('maxHP'))
        this.actors.push(actor);
    }

    getSequencerSelection() {
        for (let i = 0; i < this.actors.length; i++) {
            let actor = this.actors[i];
            if (actor.getStatus('sequencer_selected')) {
                return actor;
            }
        }
        return null;
    }

    getOpposingActors(actor, actorList) {
        let isPlayer = actor.isPlayerActor();

        for (let i = 0; i < this.actors.length; i++) {
            let encActor = this.actors[i];
            if (encActor.isPlayerActor() !== isPlayer) {
                actorList.push(encActor);
            }
        }
    }

    updateTurnSequencer() {
        let actor = this.actors[this.turnActorIndex];
        if (this.activeActor !== actor) {
            this.activeActor = actor;
            if (actor.isPlayerActor()) {
                actor.startPlayerTurn(this.call.turnEnded, this.turnIndex)
            } else {
                actor.getActorTurnSequencer().startActorTurn(this.call.turnEnded, this.turnIndex);
            }

        }
    }

    closeTurnSequencer() {
        this.turnActorIndex = 0;
        MATH.emptyArray(this.actors);
        this.activeActor.getActorTurnSequencer().exitSequence();
        this.activeActor = null;
        this.turnIndex = 0;
        this.turnTime = 0;

    }

}

export { EncounterTurnSequencer }