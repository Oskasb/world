import {ENUMS} from "../../../client/js/application/ENUMS.js";
import {MATH} from "../../../client/js/application/MATH.js";
import {
    checkActorTurnDone,
    endEncounterTurn, getHasTurnActor, getNextActorInTurnSequence,
    passSequencerTurnToActor,
    startEncounterTurn,
} from "./ServerEncounterFunctions.js";
import {endActorTurn} from "../actor/ActorStatusFunctions.js";

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
        this.turnTime = 0;

        let actorTurnEnded = function() {
            this.turnTime = 0;
            endActorTurn(this.serverEncounter)
        }.bind(this)

        let sequencerTurnEnded = function () {
            endEncounterTurn(this.serverEncounter)
        }.bind(this);


        let updateTurnSequencer = function() {

            this.call.updateEncounterActorStatus(this.actors);

            if (playersEngaged === 0) {
                console.log("No active players")
                return;
            }

            let turnState = getStatus(ENUMS.EncounterStatus.TURN_STATE);

            if (turnState === ENUMS.TurnState.TURN_CLOSE) {
                console.log("Update TURN_CLOSE")
                startEncounterTurn(this.serverEncounter)
            }


            if (turnState === ENUMS.TurnState.TURN_INIT) {
                let actor = getNextActorInTurnSequence(this)

                if (!actor) {
                    sequencerTurnEnded()
                    console.log("sequencerTurnEnded TURN_INIT")
                    serverEncounter.sendEncounterStatusUpdate()
                    return;
                }
                console.log("Update TURN_INIT", actor.id)
                passSequencerTurnToActor(this, actor);
                sendActorUpdate(actor)
            }

            if (turnState === ENUMS.TurnState.TURN_MOVE) {
            //
                let actor = getHasTurnActor(this.serverEncounter);

                let turnDone = checkActorTurnDone(this, actor);
                console.log("Update TURN_MOVE", actor.id, turnDone)
                if (turnDone) {
                    console.log("Determine actor turn done", actor.id)
                    this.call.actorTurnEnded();
                } else {
                    setStatusKey(ENUMS.EncounterStatus.TURN_ACTOR_TARGET, actor.getStatus(ENUMS.ActorStatus.SELECTED_TARGET))
                    setStatusKey(ENUMS.EncounterStatus.TURN_ACTOR_ACTION, actor.getStatus(ENUMS.ActorStatus.SELECTED_ACTION))
                    setStatusKey(ENUMS.EncounterStatus.TURN_ACTION_STATE, actor.getStatus(ENUMS.ActorStatus.ACTION_STATE_KEY))
                    sendActorUpdate(actor)
                }

            }

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

        console.log("Close server encounter sequencer")

        while(this.actors.length) {
            let actor = this.actors.pop();
            actor.setStatusKey(ENUMS.ActorStatus.SEQUENCER_SELECTED, false);
            actor.setStatusKey(ENUMS.ActorStatus.PARTY_SELECTED, false);
            actor.setStatusKey(ENUMS.ActorStatus.SELECTED_TARGET, '');
            actor.setStatusKey(ENUMS.ActorStatus.IN_COMBAT, false);
            actor.setStatusKey(ENUMS.ActorStatus.RETREATING, '');
            actor.setStatusKey(ENUMS.ActorStatus.EXIT_ENCOUNTER, '');
        //    GameAPI.getGamePieceSystem().playerParty.clearPartyMemebers()
        }
    }

}

export { ServerEncounterTurnSequencer }