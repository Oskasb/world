import {
    buildEncounterActorStatus,
    dispatchMessage, dispatchPartyMessage, getServerActorByActorId, messageFromStatusMap,
    registerGameServerUpdateCallback,
    unregisterGameServerUpdateCallback
} from "../utils/GameServerFunctions.js";
import {ENUMS} from "../../../client/js/application/ENUMS.js";
import {EncounterStatus} from "../../../client/js/game/encounter/EncounterStatus.js";
import {handlePlayMessage} from "./ServerEncounterMessageFunctions.js";
import {MATH} from "../../../client/js/application/MATH.js";
import {ServerGrid} from "./ServerGrid.js";
import {ServerActor} from "../actor/ServerActor.js";
import {getRandomWalkableTiles} from "../utils/GameServerFunctions.js";
import {EncounterTurnSequencer} from "../../../client/js/game/encounter/EncounterTurnSequencer.js";
import {SimpleUpdateMessage} from "../utils/SimpleUpdateMessage.js";

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
        if (Math.random() < 0.1) {
            console.log("Random position enc actor")
            let randomId = MATH.getRandomArrayEntry(encounter.getStatus(ENUMS.EncounterStatus.ENCOUNTER_ACTORS));
            let actor = encounter.getServerActorById(randomId);
            let tile = getRandomWalkableTiles(encounter.serverGrid.gridTiles, 1)[0];
            let pos = tile.getPos();
            actor.setStatusKey(ENUMS.ActorStatus.POS_X, pos.x);
            actor.setStatusKey(ENUMS.ActorStatus.POS_Y, pos.y);
            actor.setStatusKey(ENUMS.ActorStatus.POS_Z, pos.z);
            actorMessage.stamp = actor.getStatus(ENUMS.ActorStatus.CLIENT_STAMP);
            actorMessage.status = messageFromStatusMap(actor.getStatusMap(), ENUMS.ActorStatus.ACTOR_ID);
            encounter.call.messageParticipants(actorMessage);
        }
        encounter.sendEncounterStatusUpdate();
    } else  {
        console.log("ProcessEncActivationState", encounter.getStatus(ENUMS.EncounterStatus.ACTIVATION_STATE))
    }



}

class ServerEncounter {
    constructor(message, closeEncounterCB) {

        console.log("New ServerEncounter", message);

        this.simpleUpdateMessage = new SimpleUpdateMessage();

        this.encounterTurnSequencer = new EncounterTurnSequencer()
        this.serverGrid = new ServerGrid();
        this.spawn = message.spawn;
        this.encounterActors = [];
        this.id = message.encounterId;
        this.status = new EncounterStatus(message.encounterId, message.worldEncounterId);
        this.setStatusKey(ENUMS.EncounterStatus.GRID_ID, message.grid_id)
        this.setStatusKey(ENUMS.EncounterStatus.GRID_POS, message.pos)
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

        this.call = {
            updateServerEncounter:updateServerEncounter,
            messageParticipants:messageParticipants
        }

        registerGameServerUpdateCallback(this.call.updateServerEncounter);
    }

    getStatus(key) {
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

    getServerActorById(actorId) {
        for (let i = 0; i < this.encounterActors.length;i++) {
            if (this.encounterActors[i].id === actorId) {
                return this.encounterActors[i];
            }
        }
    }

    spawnServerEncounterActors() {
        let actors = this.spawn.actors;
        console.log("Spawn: ", actors, this.spawn);
        let faces = ['face_1', 'face_2', 'face_3', 'face_5', 'face_6', 'face_7', 'face_8']
        let encActors = [];
        for (let i = 0; i < actors.length; i++) {
            let templateId = actors[i].actor;
            let rot = actors[i].rot;
            let tileI = actors[i].tile[0];
            let tileJ = actors[i].tile[1];
            let tile = this.serverGrid.getTileByColRow(tileI, tileJ)
            let id = 'server_enc_actor_'+actorCount;
            actorCount++
            let statusMap = buildEncounterActorStatus(id, templateId, rot, tile);
            let actor = new ServerActor(id, statusMap)
            actor.setStatusKey(ENUMS.ActorStatus.ALIGNMENT, ENUMS.Alignment.HOSTILE)
            actor.setStatusKey(ENUMS.ActorStatus.ICON_KEY, MATH.getRandomArrayEntry(faces));
            encActors.push(actor.id);
            this.encounterActors.push(actor);
            this.combatants.push(actor);
            let message = actor.buildServerActorStatusMessage(ENUMS.ClientRequests.ENCOUNTER_PLAY, ENUMS.ServerCommands.ACTOR_INIT);
            this.call.messageParticipants(message);
        }
        this.setStatusKey(ENUMS.EncounterStatus.ENCOUNTER_ACTORS, encActors);

    }

    rollEncounterCombatantsInitiative() {
          for (let i = 0; i < this.combatants.length; i++) {
              this.combatants[i].rollInitiative();
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

    sendEncounterStatusUpdate() {
        let message = this.simpleUpdateMessage.call.buildMessage(ENUMS.EncounterStatus.ENCOUNTER_ID, this.getStatus(), ENUMS.ClientRequests.ENCOUNTER_PLAY)
        if (message) {
            message.command = ENUMS.ServerCommands.ENCOUNTER_UPDATE;
            this.call.messageParticipants(message);
        }
    }

    closeServerEncounter() {
        while (this.onCloseCallbacks.length) {
            this.onCloseCallbacks.pop()(this.hostStamp);
        }
        unregisterGameServerUpdateCallback(this.call.updateServerEncounter)
    }

}

export {ServerEncounter}