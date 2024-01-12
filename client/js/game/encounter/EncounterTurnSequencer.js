

function getActiveEncounter() {
    return GameAPI.call.getDynamicEncounter()
}

function setStatusKey(key, status) {
    return getActiveEncounter().setStatusKey(key, status)
}

function getStatus(key) {
    return getActiveEncounter().status.call.getStatus(key)
}

let hostilesList = [];
let friendliesList = [];

let playerCount = 0;
let playersEngaged = 0;
let playersDead = 0;

let opponentCount = 0;
let opponentsEngaged = 0;
let opponentsDead = 0;


function updateEncounterActorStatus(actors) {
    MATH.emptyArray(hostilesList);
    MATH.emptyArray(friendliesList);
    playerCount = 0;
    playersEngaged = 0;
    playersDead = 0;

    opponentCount = 0;
    opponentsEngaged = 0;
    opponentsDead = 0;

    for (let i = 0; i < actors.length; i++) {
        let encActor = actors[i];
        if (encActor.getStatus(ENUMS.ActorStatus.ALIGNMENT) === 'HOSTILE') {
            if (encActor.getStatus(ENUMS.ActorStatus.DEAD)) {
                opponentsDead++
            } else {
                opponentsEngaged++
            }
            opponentCount++
            hostilesList.push(encActor);
        } else {
            if (encActor.getStatus(ENUMS.ActorStatus.DEAD)) {
                playersDead++
            } else {
                playersEngaged++
            }

            playerCount++
            friendliesList.push(encActor);
        }
    }

    setStatusKey(ENUMS.EncounterStatus.ACTOR_COUNT, actors.length);

    setStatusKey(ENUMS.EncounterStatus.PLAYER_COUNT, playerCount);
    setStatusKey(ENUMS.EncounterStatus.PLAYERS_ENGAGED, playersEngaged);
    setStatusKey(ENUMS.EncounterStatus.PLAYERS_DEAD, playersDead);

    setStatusKey(ENUMS.EncounterStatus.OPPONENT_COUNT, opponentCount);
    setStatusKey(ENUMS.EncounterStatus.OPPONENTS_ENGAGED, opponentsEngaged);
    setStatusKey(ENUMS.EncounterStatus.OPPONENTS_DEAD, opponentsDead);
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
    //        console.log("turnEnded", this.turnActorIndex, this.turnIndex)
        }.bind(this)

        this.call = {
            turnEnded:turnEnded
        }

    }


    addEncounterActor(actor) {
        actor.setStatusKey(ENUMS.ActorStatus.HP, actor.getStatus(ENUMS.ActorStatus.MAX_HP))
    //    actor.setStatusKey(ENUMS.ActorStatus.TRAVEL_MODE, ENUMS.TravelMode.TRAVEL_MODE_BATTLE);
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
        let alignment = actor.getStatus(ENUMS.ActorStatus.ALIGNMENT);

        for (let i = 0; i < this.actors.length; i++) {
            let encActor = this.actors[i];
            if (encActor.getStatus(ENUMS.ActorStatus.DEAD) === false) {
                if (encActor.getStatus(ENUMS.ActorStatus.ALIGNMENT) !== alignment) {
                    actorList.push(encActor);
                }
            }
        }
    }

    updateTurnSequencer() {

    }

    closeTurnSequencer() {
        this.turnActorIndex = 0;
        while(this.actors.length) {
            let actor = this.actors.pop();
            actor.setStatusKey(ENUMS.ActorStatus.SEQUENCER_SELECTED, false);
            actor.setStatusKey(ENUMS.ActorStatus.PARTY_SELECTED, false);
            actor.setStatusKey(ENUMS.ActorStatus.SELECTED_TARGET, '');
            actor.setStatusKey(ENUMS.ActorStatus.RETREATING, '');
            actor.setStatusKey(ENUMS.ActorStatus.EXIT_ENCOUNTER, '');
            GameAPI.getGamePieceSystem().playerParty.clearPartyStatus()
        //    GameAPI.getGamePieceSystem().playerParty.clearPartyMemebers()
        }
        if (this.activeActor) {
            this.activeActor.getActorTurnSequencer().exitSequence();
        }
        this.activeActor = null;
        this.turnIndex = 0;
        this.turnTime = 0;

    }

}

export { EncounterTurnSequencer }