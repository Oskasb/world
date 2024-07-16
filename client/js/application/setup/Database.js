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


    localStorage.setItem('account', JSON.stringify(db.account));
    console.log("Store Account Data ", db.account);
    dbs['account'].set(db.account['PLAYER_ID'], db.account);
}

function getLocalAccountStatus(key) {
    return db.account[key] || null;
}


function getLocalAccount(accountCallback) {
    initLocalDB();
    getLoadedAccount(accountCallback)
}

function getLoadedAccount(accountCallback) {
    if (typeof (db.account[ENUMS.PlayerStatus.PLAYER_ID])=== 'string') {
        setTimeout(function() {
            accountCallback(db.account)
        }, 10)

        //    return db.account;
    } else {
        accountCallback(null)
    }
}

function saveActorStatus(statusMap) {
    let id = statusMap[ENUMS.ActorStatus.ACTOR_ID];

    db.actors[id] = statusMap;
 //   statusMap[ENUMS.ActorStatus.EQUIP_REQUESTS] = [];
 //   statusMap[ENUMS.ActorStatus.EQUIPPED_ITEMS] = [];
    if (typeof (statusMap['undefined']) !== 'undefined') {
        console.log("Status map containes undefined", statusMap['undefined'], [statusMap]);
        delete statusMap['undefined']
    }
    localStorage.setItem('actors', JSON.stringify(db.actors));
    dbs['actors'].set(id, statusMap);
}

function saveItemStatus(statusMap) {
    let id = statusMap[ENUMS.ItemStatus.ITEM_ID];

   // console.log("Save Item Status ", id, [db.items]);
    db.items[id] = statusMap;
    if (typeof (statusMap['undefined']) !== 'undefined') {
        console.log("Status map containes undefined", statusMap['undefined'], [statusMap]);
        delete statusMap['undefined']
    }
    localStorage.setItem('items', JSON.stringify(db.items));
    dbs['items'].set(id, statusMap);
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

    console.log("savePlayerStatus", db.players, statusMap);
    localStorage.setItem('players', JSON.stringify(db.players));
    dbs['players'].set(id, statusMap);
}

function loadActorStatus(actorId, aStatusCB) {
    setTimeout(function() {
        aStatusCB(db.actors[actorId] || null);
    }, 100)

}

function loadItemStatus(itemId, iStatusCB) {
    setTimeout(function() {
        iStatusCB(db.items[itemId] || null);
    }, 100)
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

function loadPlayerStatus(playerId, statusCb) {
    setTimeout(function() {
        if (db.players[playerId]) {
            statusCb(db.players[playerId])
        } else {
            statusCb(null)
        }
    }, 10)

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

    console.log("storeBufferImage", id, db.images);
    clearTimeout(imgTimeout);
    imgTimeout = setTimeout(function() {
        localStorage.setItem('images', JSON.stringify(db.images));
        dbs['images'].set(id, bufferData);
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