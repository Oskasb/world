

function getActiveEncounter() {
    return GameAPI.call.getDynamicEncounter()
}

function setStatusKey(key, status) {
    return getActiveEncounter().setStatusKey(key, status)
}

function getStatus(key) {
    return getActiveEncounter().status.call.getStatus(key)
}

let statusActors = [];
class EncounterTurnSequencer {
    constructor() {
        this.turnActorIndex = 0;
        this.actors = [];
        this.activeActor = null;
        this.turnIndex = 0;
        this.turnTime = 0;


        let turnEnded = function() {
            this.turnTime = 0;
            this.activeActor = null;
            this.turnActorIndex++

            if (this.turnActorIndex === this.actors.length) {
                this.turnActorIndex = 0;
                this.turnIndex++
                setStatusKey(ENUMS.EncounterStatus.TURN_INDEX, this.turnIndex)
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

    getActiveSequencerActor() {
        return this.activeActor;
    }

    addEncounterActor(actor) {
        actor.setStatusKey(ENUMS.ActorStatus.HP, actor.getStatus(ENUMS.ActorStatus.MAX_HP))
    //    actor.setStatusKey(ENUMS.ActorStatus.TRAVEL_MODE, ENUMS.TravelMode.TRAVEL_MODE_BATTLE);
        actor.setStatusKey(ENUMS.ActorStatus.IN_COMBAT, true);
        if (actor === GameAPI.getGamePieceSystem().selectedActor) {
        //    actor.setStatusKey(ENUMS.ActorStatus.PARTY_SELECTED, true);
        }
        this.actors.push(actor);

        let statusActors = getStatus(ENUMS.EncounterStatus.ENCOUNTER_ACTORS);
        MATH.emptyArray(statusActors);
        for (let i = 0; i < this.actors.length; i++) {
            statusActors.push(this.actors[i].id);
        }
        setStatusKey(ENUMS.EncounterStatus.ENCOUNTER_ACTORS, statusActors)
    }

    getSequencerSelection() {
        for (let i = 0; i < this.actors.length; i++) {
            let actor = this.actors[i];
            if (actor.getStatus(ENUMS.ActorStatus.SEQUENCER_SELECTED)) {
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
            setStatusKey(ENUMS.EncounterStatus.HAS_TURN_ACTOR, actor.id);

            if (actor.isPlayerActor()) {
                GuiAPI.screenText("Your turn as host", ENUMS.Message.HINT, 4)
                actor.startPlayerTurn(this.call.turnEnded, this.turnIndex)
            } else if (actor.call.getRemote()) {
                GuiAPI.screenText("Joined Payer Turn", ENUMS.Message.HINT, 4)
            } else {
                GuiAPI.screenText("Enemy Turn", ENUMS.Message.HINT, 4)
                actor.getActorTurnSequencer().startActorTurn(this.call.turnEnded, this.turnIndex);
            }

        } else {

            if (actor.call.getRemote()) {

                let hasTurnId = getStatus(ENUMS.EncounterStatus.HAS_TURN_ACTOR);

                if (hasTurnId === actor.id) {
                    let turnDone = actor.getStatus(ENUMS.ActorStatus.TURN_DONE);
                    if (turnDone === this.turnIndex) {
                        console.log("Detect remote player turn done")
                        this.call.turnEnded();
                    }
                }
            }
        }
    }

    closeTurnSequencer() {
        this.turnActorIndex = 0;
        while(this.actors.length) {
            let actor = this.actors.pop();
            actor.setStatusKey(ENUMS.ActorStatus.SEQUENCER_SELECTED, false);
            actor.setStatusKey(ENUMS.ActorStatus.PARTY_SELECTED, false);
            actor.setStatusKey(ENUMS.ActorStatus.SELECTED_TARGET, '');
            actor.setStatusKey(ENUMS.ActorStatus.IN_COMBAT, false);
            actor.setStatusKey(ENUMS.ActorStatus.RETREATING, '');
            actor.setStatusKey(ENUMS.ActorStatus.EXIT_ENCOUNTER, '');
            GameAPI.getGamePieceSystem().playerParty.clearPartyMemebers()
        }
        this.activeActor.getActorTurnSequencer().exitSequence();
        this.activeActor = null;
        this.turnIndex = 0;
        this.turnTime = 0;

    }

}

export { EncounterTurnSequencer }