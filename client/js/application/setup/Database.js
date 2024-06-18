import {getPlayerActor} from "../utils/ActorUtils.js";

let db = {};

db.account= {};
db.players = {};
db.actors = {};
db.items = {};

function initLocalDB() {
//    resetDatabase()
    for (let key in db) {
        let localData = localStorage.getItem(key);
        if (localData === '[object Object]')
            localData = null;
        if (typeof (localData) === 'string') {
            db[key] = JSON.parse(localData);
            console.log("Load Local DB", key, db[key]);
        } else {
            localStorage.setItem(key, JSON.stringify(db[key]));
            console.log("Init Local DB", key, db[key]);
        }
    }
}

function resetDatabase() {
    for (let key in db) {
        localStorage.setItem(key, JSON.stringify({}));
        console.log("Reset Local DB", db);
    }
}

function storeLocalAccountStatus(key, value) {
    db.account[key] = value;
    localStorage.setItem('account', JSON.stringify(db.account));
    console.log("Store Account Data ", db.account);
}

function getLocalAccountStatus(key) {
    return db.account[key] || null;
}


function getLocalAccount() {
    initLocalDB();
    if (typeof (db.account[ENUMS.PlayerStatus.PLAYER_ID])=== 'string') {
        return db.account;
    } else {
        return null;
    }

}

function saveActorStatus(statusMap) {
    let id = statusMap[ENUMS.ActorStatus.ACTOR_ID];
    db.actors[id] = statusMap;
    localStorage.setItem('actors', JSON.stringify(db.actors));
}

function saveItemStatus(statusMap) {
    let id = statusMap[ENUMS.ItemStatus.ITEM_ID];
    db.items[id] = statusMap;
    localStorage.setItem('items', JSON.stringify(db.items));
}

function savePlayerStatus(statusMap) {
    let id = statusMap[ENUMS.PlayerStatus.PLAYER_ID];
    if (!id) {
        console.log("No id set yet", statusMap);
        return;
    }
    db.players[id] = statusMap;
    console.log("savePlayerStatus", db.players, statusMap);
    localStorage.setItem('players', JSON.stringify(db.players));
}

function loadActorStatus(actorId) {
    return db.actors[actorId] || null;
}

function loadItemStatus(itemId) {
    return db.items[itemId] || null;
}

function loadPlayerStatus(playerId) {
    return db.players[playerId] || null;
}

function storePlayerActorStatus() {
    let actor = getPlayerActor();
    if (!actor.actorStatus) {
        console.log("No ok actor", actor);
        return;
    }
    let statusMap = actor.actorStatus.statusMap;
    saveActorStatus(statusMap);
}

function storePlayerStatus() {
    let player = GameAPI.getPlayer();
    let statusMap = player.status.statusMap;
    savePlayerStatus(statusMap);
}

export {
    resetDatabase,
    storeLocalAccountStatus,
    getLocalAccount,
    saveActorStatus,
    saveItemStatus,
    savePlayerStatus,
    loadActorStatus,
    loadItemStatus,
    loadPlayerStatus,
    storePlayerActorStatus,
    storePlayerStatus
}