import {ENUMS} from "../../../client/js/application/ENUMS.js";
import {MATH} from "../../../client/js/application/MATH.js";

class ServerEncounterTurnSequencer {
    constructor(serverEncounter) {
        this.serverEncounter = serverEncounter;

        function getActiveEncounter() {
            return serverEncounter
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

        let statusActors = [];

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

        let updateTurnSequencer = function() {

            this.call.updateEncounterActorStatus(this.actors);

            if (playersEngaged === 0) {
                console.log("No active players")
                return;
            }

            let actor = this.actors[this.turnActorIndex];

            if (this.activeActor !== actor) {

                setStatusKey(ENUMS.EncounterStatus.TURN_INDEX, this.turnIndex)
                this.activeActor = actor;
                setStatusKey(ENUMS.EncounterStatus.HAS_TURN_ACTOR, actor.id);
                console.log("pass turn to new actor",  actor.id)
                if (actor.getStatus(ENUMS.ActorStatus.DEAD)) {
                    this.call.turnEnded();
                    return;
                }

                let actorIsPlayer = serverEncounter.actorIsPlayer(actor)

                if (actorIsPlayer) {
                    setStatusKey(ENUMS.EncounterStatus.ACTIVE_TURN_SIDE, "PARTY PLAYER");
                //    GuiAPI.screenText("Your turn", ENUMS.Message.HINT, 3)

                    actor.setStatusKey(ENUMS.ActorStatus.HAS_TURN, true);
                    actor.setStatusKey(ENUMS.ActorStatus.PARTY_SELECTED, true);
                    actor.setStatusKey(ENUMS.ActorStatus.HAS_TURN_INDEX, this.turnIndex)

                //    actor.startPlayerTurn(this.call.turnEnded, this.turnIndex)
                } else {
                    setStatusKey(ENUMS.EncounterStatus.ACTIVE_TURN_SIDE, "OPPONENTS");
                    //    console.log("HOST: Opponent turn start")
                //    GuiAPI.screenText("Hosting Enemy ", ENUMS.Message.SYSTEM, 3)
                    actor.turnSequencer.startActorTurn(this.call.turnEnded, this.turnIndex);
                }

            } else {

            //    if (actor.call.getRemote()) {

                    let hasTurnId = getStatus(ENUMS.EncounterStatus.HAS_TURN_ACTOR);
                console.log("hasTurnId", hasTurnId)
                    if (hasTurnId === actor.id) {
                        let turnDone = actor.getStatus(ENUMS.ActorStatus.TURN_DONE);
                        if (turnDone === this.turnIndex) {
                        //    GuiAPI.screenText("REMOTE DONE",  ENUMS.Message.SYSTEM, 2.2)

                            console.log("Determine actor urn done")
                            this.call.turnEnded();
                            return;
                        }
                    }
            //    }
            }

            if (actor) {
                setStatusKey(ENUMS.EncounterStatus.TURN_ACTOR_INITIATIVE, actor.getStatus(ENUMS.ActorStatus.SEQUENCER_INITIATIVE))
                setStatusKey(ENUMS.EncounterStatus.TURN_ACTOR_TARGET, actor.getStatus(ENUMS.ActorStatus.SELECTED_TARGET))
                setStatusKey(ENUMS.EncounterStatus.TURN_ACTOR_ACTION, actor.getStatus(ENUMS.ActorStatus.SELECTED_ACTION))
                setStatusKey(ENUMS.EncounterStatus.TURN_ACTION_STATE, actor.getStatus(ENUMS.ActorStatus.ACTION_STATE_KEY))
            }

        }.bind(this);


        this.call = {
            turnEnded:turnEnded,
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