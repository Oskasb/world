import {getPlayerActor} from "../utils/ActorUtils.js";
import {getUrlParam} from "../utils/DebugUtils.js";
import {saveDataTexture} from "../utils/ConfigUtils.js";
import {Storage} from "./Storage.js";



let stores = [
    {name:'account', keyPath:'PLAYER_ID', version:0, index:[]},
    {name:'players', keyPath:'PLAYER_ID', version:0, index:[]},
    {name:'actors',  keyPath:'ACTOR_ID',  version:0, index:[]},
    {name:'items',   keyPath:'ITEM_ID',   version:0, index:[]},
    {name:'images',  keyPath:'id',        version:0, index:[]}
]

let dbs = {};

for (let i = 0; i < stores.length; i++) {
    dbs[stores[i].name] = new Storage(stores[i]);
}

let db = {};

db.account= {};
db.players = {};
db.actors = {};
db.items = {};
db.images = {};

function initLocalDB() {
    if (getUrlParam('reset_db') === true) {
        resetDatabase()
    }

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
        dbs[key].clearAllData();
        localStorage.setItem(key, JSON.stringify({}));
        console.log("Reset Local DB", db);
    }
}

function storeLocalAccountStatus(key, value) {
    db.account[key] = value;
    dbs['account'].set(db.account['PLAYER_ID'], db.account);

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

function getLoadedAccount() {
    if (typeof (db.account[ENUMS.PlayerStatus.PLAYER_ID])=== 'string') {
        return db.account;
    } else {
        return null;
    }
}

function saveActorStatus(statusMap) {
    let id = statusMap[ENUMS.ActorStatus.ACTOR_ID];
    dbs['actors'].set(id, statusMap);
    db.actors[id] = statusMap;
 //   statusMap[ENUMS.ActorStatus.EQUIP_REQUESTS] = [];
 //   statusMap[ENUMS.ActorStatus.EQUIPPED_ITEMS] = [];
    if (typeof (statusMap['undefined']) !== 'undefined') {
        console.log("Status map containes undefined", statusMap['undefined'], [statusMap]);
        delete statusMap['undefined']
    }
    localStorage.setItem('actors', JSON.stringify(db.actors));
}

function saveItemStatus(statusMap) {
    let id = statusMap[ENUMS.ItemStatus.ITEM_ID];
    dbs['items'].set(id, statusMap);
   // console.log("Save Item Status ", id, [db.items]);
    db.items[id] = statusMap;
    if (typeof (statusMap['undefined']) !== 'undefined') {
        console.log("Status map containes undefined", statusMap['undefined'], [statusMap]);
        delete statusMap['undefined']
    }
    localStorage.setItem('items', JSON.stringify(db.items));
}

function savePlayerStatus(statusMap) {
    let id = statusMap[ENUMS.PlayerStatus.PLAYER_ID];
    if (!id) {
        console.log("No id set yet", statusMap);
        return;
    }
    db.players[id] = statusMap;
    if (typeof (statusMap['undefined']) !== 'undefined') {
        console.log("Status map containes undefined", statusMap['undefined'], [statusMap]);
        delete statusMap['undefined']
    }
    dbs['players'].set(id, statusMap);
    console.log("savePlayerStatus", db.players, statusMap);
    localStorage.setItem('players', JSON.stringify(db.players));
}

function loadActorStatus(actorId) {
    return db.actors[actorId] || null;
}

function loadItemStatus(itemId) {
    return db.items[itemId] || null;
}


function applyBufferImageByKey(playerId, key, bufferData) {
    let playerComps = playerId.split('_');
    let components = key.split('_');

    let root = "terrain";
    let folder = components[0];
 //   let worldLevel = components{1};
    let xIndex = 2;
    let zIndex = 3;

    if (components[1] === playerComps[0]) {
   //     worldLevel = playerId;
        if (components[2] === playerComps[1]) {
            xIndex++;
            zIndex++
        } else {
            console.log("Not Loading some other players buffer data")
            return;
        }

    }
    let array = []

    for (let key in bufferData) {
        array.push(bufferData[key])
    }

    saveDataTexture(root, folder, key, new Uint8ClampedArray(array))
}

function loadStoredImages(playerId) {
    let images = db.images;

    for (let key in images) {
        applyBufferImageByKey(playerId, key, images[key])
    }
}

function loadPlayerStatus(playerId) {

    if (db.players[playerId]) {
    //    loadStoredImages(playerId);
    } else {
        return null;
    }
    return db.players[playerId]
}

function storePlayerActorStatus() {
    let actor = getPlayerActor();
    if (actor === null) {
        console.log("no player actor to store");
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

let imgTimeout;

function storeBufferImage(id, bufferData) {
    db.images[id] = bufferData;
    dbs['images'].set(id, bufferData);
    console.log("storeBufferImage", id, db.images);
    clearTimeout(imgTimeout);
    imgTimeout = setTimeout(function() {
        localStorage.setItem('images', JSON.stringify(db.images));
    }, 500)
}

export {
    resetDatabase,
    storeLocalAccountStatus,
    getLocalAccountStatus,
    getLocalAccount,
    getLoadedAccount,
    saveActorStatus,
    saveItemStatus,
    savePlayerStatus,
    loadActorStatus,
    loadItemStatus,
    loadPlayerStatus,
    loadStoredImages,
    storePlayerActorStatus,
    storePlayerStatus,
    storeBufferImage
}