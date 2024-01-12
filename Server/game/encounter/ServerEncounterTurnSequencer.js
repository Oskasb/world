import {ENUMS} from "../../../client/js/application/ENUMS.js";
import {MATH} from "../../../client/js/application/MATH.js";
import {
    checkActorTurnDone,
    passSequencerTurnToActor,
    sequencerTurnActiveActor,
} from "./ServerEncounterFunctions.js";

class ServerEncounterTurnSequencer {
    constructor(serverEncounter) {
        this.serverEncounter = serverEncounter;

        function sendActorUpdate(actor) {
            serverEncounter.sendActorStatusUpdate(actor)
        }

        function setStatusKey(key, status) {
            return serverEncounter.status.setStatusKey(key, status)
        }

        function getStatus(key) {
            return serverEncounter.status.getStatusByKey(key)
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

        this.actors = [];
        this.activeActor = null;
        this.turnIndex = 0;
        this.turnTime = 0;

        let actorTurnEnded = function() {
            this.turnTime = 0;
            this.activeActor = null;
        }.bind(this)

        let sequencerTurnEnded = function () {
                this.turnIndex++
                setStatusKey(ENUMS.EncounterStatus.TURN_INDEX, this.turnIndex)
        }.bind(this);

        let updateTurnSequencer = function() {

            this.call.updateEncounterActorStatus(this.actors);

            if (playersEngaged === 0) {
                console.log("No active players")
                return;
            }

            let actor = sequencerTurnActiveActor(this);

            if (!actor) {
                console.log("No Actor")
                return;
            }

            if (this.activeActor !== actor) {
                passSequencerTurnToActor(this, actor);
                setStatusKey(ENUMS.EncounterStatus.TURN_ACTOR_INITIATIVE, actor.getStatus(ENUMS.ActorStatus.SEQUENCER_INITIATIVE))
            } else {
                let turnDone = checkActorTurnDone(this, actor);
                if (turnDone) {
                    console.log("Determine actor turn done")
                    this.call.actorTurnEnded();
                } else {
                    setStatusKey(ENUMS.EncounterStatus.TURN_ACTOR_TARGET, actor.getStatus(ENUMS.ActorStatus.SELECTED_TARGET))
                    setStatusKey(ENUMS.EncounterStatus.TURN_ACTOR_ACTION, actor.getStatus(ENUMS.ActorStatus.SELECTED_ACTION))
                    setStatusKey(ENUMS.EncounterStatus.TURN_ACTION_STATE, actor.getStatus(ENUMS.ActorStatus.ACTION_STATE_KEY))
                }
            }

            sendActorUpdate(actor)
            serverEncounter.sendEncounterStatusUpdate()

        }.bind(this);



        this.call = {
            actorTurnEnded:actorTurnEnded,
            sequencerTurnEnded:sequencerTurnEnded,
            updateEncounterActorStatus:updateEncounterActorStatus,
            updateTurnSequencer:updateTurnSequencer,
            setStatusKey:setStatusKey,
            getStatus:getStatus
        }

    }

    addEncounterActor(actor) {

        actor.setStatusKey(ENUMS.ActorStatus.TRAVEL_MODE, ENUMS.TravelMode.TRAVEL_MODE_BATTLE);
        actor.setStatusKey(ENUMS.ActorStatus.IN_COMBAT, true);

        this.actors.push(actor);

        let statusActors = this.call.getStatus(ENUMS.EncounterStatus.ENCOUNTER_ACTORS);
        MATH.emptyArray(statusActors);
        for (let i = 0; i < this.actors.length; i++) {
            statusActors.push(this.actors[i].id);
        }
        this.call.setStatusKey(ENUMS.EncounterStatus.ENCOUNTER_ACTORS, statusActors)
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




    closeTurnSequencer() {

        while(this.actors.length) {
            let actor = this.actors.pop();
            actor.setStatusKey(ENUMS.ActorStatus.SEQUENCER_SELECTED, false);
            actor.setStatusKey(ENUMS.ActorStatus.PARTY_SELECTED, false);
            actor.setStatusKey(ENUMS.ActorStatus.SELECTED_TARGET, '');
            actor.setStatusKey(ENUMS.ActorStatus.IN_COMBAT, false);
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

export { ServerEncounterTurnSequencer }