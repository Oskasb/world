import {
    buildEncounterActorStatus,
    dispatchMessage, dispatchPartyMessage, getGameServer, getServerActorByActorId, messageFromStatusMap,
    registerGameServerUpdateCallback, spawnServerEncounterActor,
    unregisterGameServerUpdateCallback
} from "../utils/GameServerFunctions.js";
import {ENUMS} from "../../../client/js/application/ENUMS.js";
import {EncounterStatus} from "../../../client/js/game/encounter/EncounterStatus.js";
import {handlePlayMessage} from "./ServerEncounterMessageFunctions.js";
import {MATH} from "../../../client/js/application/MATH.js";
import {ServerGrid} from "./ServerGrid.js";
import {ServerActor} from "../actor/ServerActor.js";
import {getRandomWalkableTiles} from "../utils/GameServerFunctions.js";
import {SimpleUpdateMessage} from "../utils/SimpleUpdateMessage.js";

import {ServerEncounterTurnSequencer} from "./ServerEncounterTurnSequencer.js";
import {enterEncounter, exitEncounter} from "../actor/ActorStatusFunctions.js";

let actorCount = 0;
let actorMessage = {
    request:ENUMS.ClientRequests.ENCOUNTER_PLAY,
    command:ENUMS.ServerCommands.ACTOR_UPDATE
}

function processActivationState(encounter) {

    if (encounter.getStatus(ENUMS.EncounterStatus.ACTIVATION_STATE) === ENUMS.ActivationState.INIT) {
        if (encounter.encounterTime > 2) {
            encounter.setStatusKey(ENUMS.EncounterStatus.ACTIVATION_STATE, ENUMS.ActivationState.ACTIVATING);
            let message = {
                stamp : encounter.hostStamp,
                request:ENUMS.ClientRequests.ENCOUNTER_PLAY,
                command:ENUMS.ServerCommands.ENCOUNTER_START,
                encounterId:encounter.getStatus(ENUMS.EncounterStatus.ENCOUNTER_ID),
                worldEncounterId: encounter.getStatus(ENUMS.EncounterStatus.WORLD_ENCOUNTER_ID)
            }
            MATH.copyArrayValues(encounter.partyMembers, encounter.memberResponseQueue);
            encounter.call.messageParticipants(message);
        }
    } else if (encounter.getStatus(ENUMS.EncounterStatus.ACTIVATION_STATE) === ENUMS.ActivationState.ACTIVATING) {
        console.log("Party queue for encounter active, await dynamic encounter activation from ", encounter.memberResponseQueue.length)
    } else if (encounter.getStatus(ENUMS.EncounterStatus.ACTIVATION_STATE) === ENUMS.ActivationState.ACTIVE) {
        // Run the turn sequencer here...
        /*
        if (Math.random() < 0.1) {
            console.log("Random position enc actor")
            let actor = MATH.getRandomArrayEntry(encounter.encounterActors);
            let tile = getRandomWalkableTiles(encounter.serverGrid.gridTiles, 1)[0];
            let pos = tile.getPos();
            actor.setStatusKey(ENUMS.ActorStatus.POS_X, pos.x);
            actor.setStatusKey(ENUMS.ActorStatus.POS_Y, pos.y);
            actor.setStatusKey(ENUMS.ActorStatus.POS_Z, pos.z);
            encounter.sendActorStatusUpdate(actor);
        }
        */
        encounter.serverEncounterTurnSequencer.call.updateTurnSequencer()
        encounter.sendEncounterStatusUpdate();
    } else  {
        console.log("ProcessEncActivationState", encounter.getStatus(ENUMS.EncounterStatus.ACTIVATION_STATE))
    }

}

class ServerEncounter {
    constructor(message, closeEncounterCB) {

        console.log("New ServerEncounter", message);
        this.ticks = 0;

        this.simpleUpdateMessage = new SimpleUpdateMessage();

        this.serverEncounterTurnSequencer = new ServerEncounterTurnSequencer(this)
        this.serverGrid = new ServerGrid();
        this.spawn = message.spawn;
        this.encounterActors = [];
        this.id = message.encounterId;console.log("New Server Enc ", message.encounterId, message.worldEncounterId);
        this.status = new EncounterStatus(message.encounterId, message.worldEncounterId);
        this.setStatusKey(ENUMS.EncounterStatus.GRID_ID, message.grid_id)
        this.setStatusKey(ENUMS.EncounterStatus.GRID_POS, message.pos)
        this.setStatusKey(ENUMS.EncounterStatus.TURN_STATE, ENUMS.TurnState.TURN_CLOSE)
        this.encounterTime = 0;
        this.hostStamp = message.stamp;
        this.onCloseCallbacks = [closeEncounterCB];
        this.partyMembers = message.playerParty;
        this.reportedTiles = null;

        this.combatants = [];

        this.memberResponseQueue = [];
        MATH.copyArrayValues(this.partyMembers, this.memberResponseQueue)
        let msg = {
            stamp : this.hostStamp,
            request:ENUMS.ClientRequests.ENCOUNTER_INIT,
            command:ENUMS.ServerCommands.ENCOUNTER_TRIGGER,
            encounterId:message.encounterId,
            playerParty: message.playerParty,
            worldEncounterId: message.worldEncounterId
        }

        console.log("PLAYER PARTY MEMBERS: ",  this.partyMembers);

        for (let i = 0; i < this.partyMembers.length; i++) {
            let actor = getServerActorByActorId(this.partyMembers[i]);
            console.log("partyMembers", actor, this.partyMembers[i])
            let clientStamp = actor.getStatus(ENUMS.ActorStatus.CLIENT_STAMP)
            let player = getGameServer().getConnectedPlayerByStamp(clientStamp)
            player.serverEncounter = this;
            this.combatants.push(actor);
        }

        dispatchPartyMessage(msg,  this.partyMembers);

        let updateServerEncounter = function(tpf) {
            this.encounterTime+=tpf;
            processActivationState(this)
        }.bind(this);

        let messageParticipants = function(message) {
            dispatchPartyMessage(message,  this.partyMembers);
        }.bind(this)


        let getOpposingActors = function(actor, actorList) {
            let alignment = actor.getStatus(ENUMS.ActorStatus.ALIGNMENT);

            for (let i = 0; i < this.combatants.length; i++) {
                let encActor = this.combatants[i];
                if (encActor.getStatus(ENUMS.ActorStatus.DEAD) === false) {
                    if (encActor.getStatus(ENUMS.ActorStatus.ALIGNMENT) !== alignment) {
                        actorList.push(encActor);
                    }
                }
            }
        }.bind(this)

        this.call = {
            updateServerEncounter:updateServerEncounter,
            messageParticipants:messageParticipants,
            getOpposingActors:getOpposingActors
        }

        registerGameServerUpdateCallback(this.call.updateServerEncounter);
    }

    getStatus(key) {
        if (!key) {
            return this.status.statusMap;
        }
        return this.status.call.getStatus(key)
    }

    setStatusKey(key, status) {
        if (!key) {
            return this.status.statusMap;
        }
        return this.status.call.getStatus(key)
    }

    clientTilesReported(tiles) {
        if (this.reportedTiles === null) {
            this.reportedTiles = tiles;
        } else {
            let checksumA = MATH.stupidChecksumArray(this.reportedTiles);
            let checksumB = MATH.stupidChecksumArray(tiles);
            if (checksumA !== checksumB) {
                console.log("Reported tiles failed checksum test", tiles, this.reportedTiles);
            }
        }
    }

    getEncounterCombatantById(actorId) {
        for (let i = 0; i < this.combatants.length;i++) {
            if (this.combatants[i].id === actorId) {
                return this.combatants[i];
            }
        }
    }

    spawnServerEncounterActors() {
        let actors = this.spawn.actors;
        console.log("Spawn: ", actors, this.spawn);
        let encActors = [];
        for (let i = 0; i < actors.length; i++) {
            let actor = spawnServerEncounterActor(actors[i], this.serverGrid)
            encActors.push(actor.id);
            this.encounterActors.push(actor);
            this.combatants.push(actor);
            let message = actor.buildServerActorStatusMessage(ENUMS.ClientRequests.ENCOUNTER_PLAY, ENUMS.ServerCommands.ACTOR_INIT);
            if (message) {
                this.call.messageParticipants(message);
            }
        }


        let randomPos = function() {
            this.encounterPrepareFirstTurn()
        }.bind(this);

        setTimeout(randomPos, 200)


    }

    encounterPrepareFirstTurn() {

            for (let i = 0; i < this.encounterActors.length; i++) {
                console.log("Random position enc actor")
                let actor = this.encounterActors[i];
                let tile = getRandomWalkableTiles(this.serverGrid.gridTiles, 1)[0];
                let pos = tile.getPos();
                actor.setStatusKey(ENUMS.ActorStatus.HP, actor.getStatus(ENUMS.ActorStatus.MAX_HP));
                actor.setStatusKey(ENUMS.ActorStatus.POS_X, pos.x);
                actor.setStatusKey(ENUMS.ActorStatus.POS_Y, pos.y);
                actor.setStatusKey(ENUMS.ActorStatus.POS_Z, pos.z);
                actor.setStatusKey(ENUMS.ActorStatus.HAS_TURN, false);
                this.sendActorStatusUpdate(actor);
            }

    }

    enrollEncounterCombatants() {
        for (let i = 0; i < this.combatants.length; i++) {
            enterEncounter(this, this.combatants[i]);
        }
    }

    setStatusKey(key, status) {
        this.status.call.setStatus(key, status);
    }

    applyPlayerPlayMessage(message) {
        handlePlayMessage(message, this);
    }

    handleHostActorRemoved() {
        this.closeServerEncounter();
    }

    actorIsPlayer(actor) {
        if (this.partyMembers.indexOf(actor.id) !== -1) {
            return true;
        }
    }

    sendEncounterStatusUpdate() {
        let message = this.simpleUpdateMessage.call.buildMessage(ENUMS.EncounterStatus.ENCOUNTER_ID, this.getStatus(), ENUMS.ClientRequests.ENCOUNTER_PLAY)
        if (message) {
            message.command = ENUMS.ServerCommands.ENCOUNTER_UPDATE;
        //    console.log("Message Enc Status: ", message)
            this.call.messageParticipants(message);
        }
    }

    sendActorStatusUpdate(actor) {

        let msg = actor.buildServerActorStatusMessage(actorMessage.request, actorMessage.command)
        if (msg) {
        //    this.call.messageParticipants(msg);
            actorMessage.stamp = actor.getStatus(ENUMS.ActorStatus.CLIENT_STAMP);
            actorMessage.status = messageFromStatusMap(actor.getStatusMap(), ENUMS.ActorStatus.ACTOR_ID);
            this.call.messageParticipants(actorMessage);
        }

    }

    sendActionStatusUpdate(serverAction) {
        let message = serverAction.buildActionMessage()
        if (message) {
            this.call.messageParticipants(message);
        }
    }


    getRandomExitTile() {
        return getRandomWalkableTiles(this.serverGrid.gridTiles, 1, 'isExit')[0];
    }

    closeServerEncounter(victory) {
        this.setStatusKey(ENUMS.EncounterStatus.PLAYER_VICTORY, victory);
        this.setStatusKey(ENUMS.EncounterStatus.ACTIVATION_STATE, ENUMS.ActivationState.DEACTIVATING);

        while (this.encounterActors.length) {
            let actor = this.encounterActors.pop();
            actor.removeServerActor(this);
        }

        for (let i = 0; i < this.partyMembers.length; i++) {
            let actor = getServerActorByActorId(this.partyMembers[i]);
            exitEncounter(this, actor, victory);
        }

        unregisterGameServerUpdateCallback(this.call.updateServerEncounter)

        while (this.onCloseCallbacks.length) {
            this.onCloseCallbacks.pop()(this);
        }

    }

}

export {ServerEncounter}