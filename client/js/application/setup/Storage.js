
let dbs = {};


function openIndexedDB(dbSettings, version, key, openSuccessCB, openErrorCB, onInitCB, onResumeCB, onUpgradeCB) {

    let openRequest = indexedDB.open(dbSettings.name, version);

    console.log("openRequest: ", dbSettings.name, version, openRequest);

    openRequest.onupgradeneeded = function(event) {
        // the existing database version is less than version (or it doesn't exist)

        let db = openRequest.result;



        console.log("db onupgradeneeded", openRequest, event, db);
        if (event.oldVersion === 0) {

        //    const db = event.target.result;
            // Create an objectStore for this database
        //    const objectStore = db.createObjectStore(name);

            function vChange(event) {
                console.log("version change event ", event, dbSettings)
                onResumeCB(db, key, event);
            }

            console.log("Init new DB", db);
            db.onversionchange = vChange;
            dbs[dbSettings.name] = db;
            onInitCB(db, key);
        } else if (event.newVersion === event.oldVersion === version) {
            console.log("open at same version", event.newVersion, db, event);
            onResumeCB(db, key);
        } else {
            console.log("open at other version", event.newVersion, db, event);
            if (typeof (onUpgradeCB) === "function") {
                onUpgradeCB(db, key)
            }
        }

    };

    openRequest.onerror = function() {
        console.error("Error", openRequest.error);
        openErrorCB(dbs[dbSettings.name], dbSettings);
    };

    openRequest.onsuccess = function() {
        let db = openRequest.result;
    //    dbSettings.version = db.version;

        console.log("db success", db);
        openSuccessCB(db, key);

        // continue working with database using db object
    };

}

function storeDbKeyValue(db, settings, putQueue, onSuccess, onError) {
    let key = putQueue.shift();
    let value = putQueue.shift();
    console.log("transaction", db,  key, value);
    let transaction = db.transaction(key, "readwrite"); // (1)

// get an object store to operate on it
    let stores = transaction.objectStore(key); // (2)

    let request = stores.put(value, key); // (3)

    request.onsuccess = function() { // (4)
        console.log("transaction added to the store", request.result);
    //    db.close();
        onSuccess(request.result, settings, putQueue)
    };

    request.onerror = function() {
        console.log("Error", request.error);
    //    db.close();
        onError(request.result, settings, putQueue)
    };


    function complete(e) {
        console.log("transaction complete", db, e);
        settings.version = db.version;
        if (putQueue.length !== 0) {
            initWriteTransaction(settings, putQueue);
        } else {
            console.log("DB Put queue completed", settings, db);
        }
    //    db.close();
    }

    transaction.oncomplete = complete
}

function transactionSuccessCB(res, settings, putQueue) {
    if (putQueue.length === 0) {
        console.log("transaction queue successfully stored", res);
    } else {
        console.log("transaction queue entry stored", res, settings, putQueue);
    }

}

function transactionFailCB(res, settings, putQueue) {
    console.log("transaction fail", res);
}

function attachKeyObjectStoreToDb(db, key) {
    if (db.objectStoreNames.contains(key) === false) {
        const objectStore = db.createObjectStore(key);
        console.log("attachKeyObjectStoreToDb", db, key, objectStore)
    } else {
        console.log("key store already attached", db, key)
    }
}

function initWriteTransaction(settings, putQueue) {

    if (settings.version === -1) {
        console.log("settings are upgrading, await callback chain", settings);
        return;
    } else {
        console.log("transaction initialize", settings, putQueue);
    }

    let key = putQueue[0];
    let value = putQueue[1];
    let db = dbs[settings.name] || {};
    let currentVersion = db.version || 0;
 //   if (settings.index.indexOf(key) === -1) {

        function initCB(db, initKey) {
            console.log("initCB", db);

            let callOnClose = function(evt) {
                console.log("callOnClose", evt, db, settings, putQueue.length);
                if (putQueue.length !== 0) {
                    initWriteTransaction(settings, putQueue);
                } else {
                    console.log("DB Put queue completed", settings, db);
                }
            }

            db.onclose = callOnClose

            attachKeyObjectStoreToDb(db, initKey)
        //    db.addEventListener('close', callOnClose, false)

        }

        function resumeCB(db, initKey, event) {
            console.log("resumeCB", event, initKey, key, putQueue[0], settings.version, settings);
            attachKeyObjectStoreToDb(db, initKey)
            if (initKey === putQueue[0]) {
                storeDbKeyValue(db, settings, putQueue, transactionSuccessCB, transactionFailCB)
            } else {
                if (putQueue.length !== 0) {
                    settings.version = db.version;
                    initWriteTransaction(settings, putQueue)
                }
            }

        }

        function upgradeCB(db, initKey) {
            console.log("upgradeCB", db, initKey);
            attachKeyObjectStoreToDb(db, initKey)
            if (initKey === putQueue[0]) {
                storeDbKeyValue(db, settings, putQueue, transactionSuccessCB, transactionFailCB)
            }
        }

        function onOpenOK(res, initKey) {
            console.log("openOK", res, initKey, putQueue[0]);
            if (settings.index.indexOf(initKey) === -1) {
                settings.index.push(initKey);
            }
            if (putQueue[0] === initKey) {
                storeDbKeyValue(res, settings, putQueue, transactionSuccessCB, transactionFailCB)
            } else {
                console.log("open on other initKey")
            }

        }

        function onOpenFail(db, dbSettings) {
            console.log("openFail", db);
        }

    if (settings.index.indexOf(key) === -1) {
        settings.version++;
        console.log("Increment DB version", settings.version)
    }



    if (currentVersion === settings.version) {
        settings.version = -1;
        storeDbKeyValue(dbs[settings.name], settings, putQueue, transactionSuccessCB, transactionFailCB)
    } else {
        let v = settings.version;
        settings.version = -1;
        openIndexedDB(settings, v, putQueue[0], onOpenOK, onOpenFail, initCB, resumeCB, upgradeCB);
    }

 //   } else {
    //    if (putQueue.length === 2) {
  //          storeDbKeyValue(dbs[settings.name], settings, putQueue, transactionSuccessCB, transactionFailCB)

  //  }
}

class Storage {
    constructor(settings) {
        this.settings = settings;
        this.putQueue = [];
    //    this.name = settings.name;
    //    this.pathKey = settings.pathKey;
    //    storedKeys[this.name] = [];
    //    this.version = settings.version;
//        openIndexedDB(this.settings);
    }

    clearAllData() {
        indexedDB.deleteDatabase(this.settings.name)
    }

    set(key, value) {
    //    console.log("DB set", this.settings.name, key, value)
        let settings = this.settings;
        let putQueue = this.putQueue;
        putQueue.push(key)
        putQueue.push(value)
        initWriteTransaction(settings, putQueue)
    }

    get(key) {

    }



}

export { Storage }