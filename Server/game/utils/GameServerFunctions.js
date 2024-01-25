import {MATH} from "../../../client/js/application/MATH.js";
import {ENUMS} from "../../../client/js/application/ENUMS.js";
import {evt} from "../../../client/js/application/event/evt.js";
import {ServerActor} from "../actor/ServerActor.js";

import {Vector2} from "../../../client/libs/three/math/Vector2.js";
import {registerTilePathPoints, setStatusPosition} from "../actor/ActorStatusFunctions.js";

let tempVec2D = new Vector2();
let gameServer = null;
let serverActors = [];
let serverItems = []

function setGameServer(gs) {
    evt.setEventKeys(ENUMS.Event);
    gameServer = gs;
}

function getServerStamp() {
    return gameServer.stamp;
}


function getGameServer() {
    return gameServer;
}

function getServerConfig(folder) {
    let configs = gameServer.getServerConfigs();
    if (!configs[folder]) {
        console.log("No server configs for folder ", folder, configs);
        return false;
    }
    return configs[folder];
}

function parseConfigData(configData, id) {
    for (let i = 0; i < configData.length; i++) {
        if (configData[i].id === id) {
            return configData[i].data
        }
    }
}

function registerServerActor(serverActor) {
    serverActors.push(serverActor);
}

function getRegisteredActors() {
    return serverActors;
}

function unregisterServerActor(serverActor) {
    MATH.splice(serverActors, serverActor);
}

function getServerActorByActorId(actorId) {
    for (let i = 0; i < serverActors.length; i++) {

        if (serverActors[i].id !== serverActors[i].getStatus(ENUMS.ActorStatus.ACTOR_ID)) {
            console.log("Actor Id missmatch", serverActors[i]);
        }

        if (serverActors[i].id === actorId) {
            return serverActors[i];
        }

    }

    /*
    console.log("Server actor not found ", actorId)
    for (let i = 0; i < serverActors.length; i++) {
        console.log("Actor ID", serverActors[i].id);
    }
    */
}

function registerServerItem(serverItem) {
    serverItems.push(serverItem);
}

function removeServerItem(serverItem) {
    MATH.splice(serverItems, serverItem);
}

function getServerItemByItemId(itemId) {
    for (let i = 0; i < serverItems.length; i++) {
        if (serverItems[i].id === itemId) {
            return serverItems[i];
        }
    }
}

function getServerItems() {
    return serverItems;
}

function getGameServerWorld() {
    return gameServer.gameServerWorld;
}

function registerGameServerUpdateCallback(callback) {
    if (gameServer.onUpdateCallbacks.indexOf(callback) === -1) {
        gameServer.onUpdateCallbacks.push(callback);
    } else {
        console.log("GameServerCB already added", callback);
    }

}

function unregisterGameServerUpdateCallback(callback) {
    MATH.splice(gameServer.onUpdateCallbacks, callback);
}

let msgData = {
    stamp:-1,
    msg:"json"
}


function dispatchPartyMessage(messageData, playerParty) {

    for (let i = 0; i < playerParty.length; i++) {
        let partyActorId = playerParty[i];
        let partyActor = getServerActorByActorId(partyActorId);
        partyActor.messageClient(messageData);
    }

}

function dispatchMessage(messageData) {
  //  console.log("Dispatch Msg ", messageData);
    getGameServer().messageWorldClients(messageData)
}

function applyMessageToClient(messageDate) {
    postMessage([ENUMS.Protocol.MESSAGE_RELAYED, messageDate]);
}

function getStatusFromMsg(key, msg) {
    let keyIndex = msg.indexOf(key);
    if (keyIndex !== -1) {
        return msg[keyIndex+1]
    } else {
        return 'no_value'
    }

}

function statusMapFromMsg(msg) {
    let statusMap = {}
    applyStatusMessageToMap(msg, statusMap)
    return statusMap
}

function applyStatusMessageToMap(status, statusMap) {
    for (let i = 0; i < status.length; i++) {
        let statusKey = status[i]
        i++;
        let newValue =  status[i]
        statusMap[statusKey] = newValue;
    }
}

let message = [];

function messageFromStatusMap(statusMap, zeroKey) {
    MATH.emptyArray(message);
    message[0] = zeroKey;
    message[1] = statusMap[zeroKey];
    for (let key in statusMap) {
        if (key !== zeroKey) {
            message.push(key);
            message.push(statusMap[key])
        }
    }
    return message;
}


function equipActorItem(actor, itemTemplate) {

}

function applyStatusToMap(status, targetMap) {
    for (let key in status) {
        targetMap[key] = status[key]
    }
}

function getClientStampFromStatusMessage(status) {
    let stamp = getStatusFromMsg(ENUMS.ActorStatus.CLIENT_STAMP, status)

    if (stamp === 'no_value') {
    //    console.log("No client stamp in message... spatial update")
        if (status[0] === ENUMS.ActorStatus.ACTOR_ID) {
            let actor = GameAPI.getActorById(status[1])
            if (!actor) {
                console.log("No actor either... exiting")
                return;
            } else {
                stamp = actor.getStatus(ENUMS.ActorStatus.CLIENT_STAMP)
            }
        } else {
            console.log("Not trying to get stamp from status: ", status);
            return;
        }

    }
    return stamp;
}

function buildEncounterActorStatus(id, templateId, rot, tile) {
    let quat = MATH.quatFromRotArray(rot);
    let pos = tile.getPos();
    let statusMap = {};
    statusMap[ENUMS.ActorStatus.CLIENT_STAMP] = 'server';
    statusMap[ENUMS.ActorStatus.ACTOR_ID] = id;
    statusMap[ENUMS.ActorStatus.CONFIG_ID] = templateId;
    statusMap[ENUMS.ActorStatus.QUAT_X] = quat.x;
    statusMap[ENUMS.ActorStatus.QUAT_Y] = quat.y;
    statusMap[ENUMS.ActorStatus.QUAT_Z] = quat.z;
    statusMap[ENUMS.ActorStatus.QUAT_W] = quat.w;
    statusMap[ENUMS.ActorStatus.POS_X] = pos.x;
    statusMap[ENUMS.ActorStatus.POS_Y] = pos.y;
    statusMap[ENUMS.ActorStatus.POS_Z] = pos.z;
    return statusMap;
}

let tileStore = [];
function filterForWalkableTiles(gridTiles, key) {

    let tileKey = key || 'walkable'

    while (tileStore.length) {
        tileStore.pop();
    }

    for (let i = 0; i < gridTiles.length; i++) {

        for (let j = 0; j < gridTiles[i].length; j++) {
            let tile = gridTiles[i][j];
            if (tile[tileKey]) {
                if (key !== 'walkable') {
                    if (tile['walkable']) {
                        tileStore.push(tile);
                    }
                } else {
                    tileStore.push(tile);
                }

            }
        }
    }

    return tileStore
}

let walkableTiles = [];

function getRandomWalkableTiles(gridTiles, count, key) {
    let tiles = filterForWalkableTiles(gridTiles, key);

    if (tiles.length < count) {
        console.log("Not enough tiles", tiles)
    }

    MATH.emptyArray(walkableTiles)

    for (let i = 0; i < count; i++) {
        let tile = MATH.getRandomArrayEntry(tiles);
        MATH.splice(tiles, tile)
        walkableTiles.push(tile);
    }
    return walkableTiles;

}

let actorCount = 0;
let faces = ['face_1', 'face_2', 'face_3', 'face_5', 'face_6', 'face_7', 'face_8']

function spawnServerEncounterActor(spawnInfo, serverGrid) {

    let templateId = spawnInfo.actor;
    let rot = spawnInfo.rot;
    let centerTile = serverGrid.getCenterTile();
    let originPos = centerTile.getPos();
    let tileI = spawnInfo.tile[0];
    let tileJ = spawnInfo.tile[1];
    let tile = serverGrid.getTileByColRow(tileI, tileJ)
    let pos = tile.getPos();
    let id = 'server_enc_actor_'+actorCount;
    actorCount++
    let statusMap = buildEncounterActorStatus(id, templateId, rot, tile);
    let actor = new ServerActor(id, statusMap)
    setStatusPosition(actor, originPos);
    serverGrid.selectTilesBeneathPath(centerTile, tile, serverGrid.gridTiles, actor.tilePath);
    actor.setStatusKey(ENUMS.ActorStatus.ALIGNMENT, ENUMS.Alignment.HOSTILE)
    actor.setStatusKey(ENUMS.ActorStatus.DEAD, false)
    actor.setStatusKey(ENUMS.ActorStatus.ICON_KEY, MATH.getRandomArrayEntry(faces));
    actor.setStatusKey(ENUMS.ActorStatus.TURN_STATE, ENUMS.TurnState.NO_TURN);
    actor.setStatusKey(ENUMS.ActorStatus.SELECTED_TARGET, "");
    actor.setStatusKey(ENUMS.ActorStatus.SELECTED_ACTION, "");
    actor.setStatusKey(ENUMS.ActorStatus.PATH_POINTS, []);
    actor.setStatusKey(ENUMS.ActorStatus.ENGAGED_TARGETS, []);
    actor.setStatusKey(ENUMS.ActorStatus.SELECTED_DESTINATION, [pos.x, pos.y, pos.z]);
    actor.setStatusKey(ENUMS.ActorStatus.DAMAGE_APPLIED, 0);
    actor.setStatusKey(ENUMS.ActorStatus.HEALING_APPLIED, 0);
    actor.setStatusKey(ENUMS.ActorStatus.ENGAGE_COUNT, 0);
    actor.setStatusKey(ENUMS.ActorStatus.HAS_TURN, false);
    registerTilePathPoints(actor);
    return actor;

}

function getNearbyWalkableTile(gridTiles, posVec3, minDistance) {
    return getTileForPosition(gridTiles, posVec3, 'walkable', minDistance);
}

function getTileForPosition(gridTiles, posVec3, filter, minDistance) {
    let selectedTile = null;
    let nearestTileDist = MATH.bigSafeValue();

 //   console.log("Find nearest tile", posVec3)

    let min = minDistance*minDistance || -1;

    let filterOut = false;

    for (let i = 0; i < gridTiles.length; i++) {

        for (let j = 0; j < gridTiles[i].length; j++) {
            let tile = gridTiles[i][j];

            if (filter) {
                if (tile[filter]) {
                    filterOut = false;
                } else {
                    filterOut = true;
                }
            }

            if (!filterOut) {
                let pos = tile.getPos();
                tempVec2D.set(pos.x - posVec3.x, pos.z - posVec3.z);
                let lengthSq = tempVec2D.lengthSq();
                if (lengthSq < nearestTileDist && lengthSq > min) {
                    selectedTile = tile;
                    nearestTileDist = lengthSq;
                    if (nearestTileDist === 0) {
                        //    console.log("nearestTileDist", nearestTileDist, tile.getPos())

                        return selectedTile;

                    }
                }
            }

        }
    }

    return selectedTile
}

export {
    getNearbyWalkableTile,
    getTileForPosition,
    filterForWalkableTiles,
    getRandomWalkableTiles,
    getServerStamp,
    getServerActorByActorId,
    getRegisteredActors,
    registerServerActor,
    unregisterServerActor,
    setGameServer,
    getGameServer,
    getServerConfig,
    parseConfigData,
    getGameServerWorld,
    registerGameServerUpdateCallback,
    unregisterGameServerUpdateCallback,
    dispatchPartyMessage,
    dispatchMessage,
    applyMessageToClient,
    equipActorItem,
    getStatusFromMsg,
    statusMapFromMsg,
    messageFromStatusMap,
    registerServerItem,
    removeServerItem,
    getServerItems,
    getServerItemByItemId,
    applyStatusToMap,
    getClientStampFromStatusMessage,
    applyStatusMessageToMap,
    buildEncounterActorStatus,
    spawnServerEncounterActor

}