import {updateStoresDbVersion} from "./Database.js";

let dbs = {};

function onAbort(e) {
    console.log("DB Aborting...", e);
}

function onError(e) {
    console.log("DB Error...", e);
}

function vChange(event) {
    console.log("version change event ", event)
    //    onResumeCB(db, key, event);
}

function openIndexedDB(dbSettings, version, key, openSuccessCB, openErrorCB, onInitCB, onResumeCB, onUpgradeCB, onClose) {

    let openRequest = indexedDB.open(dbSettings.name, version);
//   console.log("openRequest: ", dbSettings.name, version, openRequest);
    openRequest.onblocked = function(event) {
        console.error("Blocked", event);
        openErrorCB(dbs[dbSettings.name], dbSettings);
    };

    openRequest.onerror = function(event) {
        let db = event.target.result;
        console.error("Error", dbs[dbSettings.name], dbSettings, version, key, event, openRequest);
        openErrorCB(dbs[dbSettings.name], dbSettings);
    };

    openRequest.onsuccess = function(event) {
        let db = event.target.result;
        //    dbSettings.version = db.version;
     //   console.log("db success", db);




        db.onclose = onClose

        openSuccessCB(db, key, openRequest);
        // continue working with database using db object
    };



    openRequest.onupgradeneeded = function(event) {
        // the existing database version is less than version (or it doesn't exist)

        let db = event.target.result;



   //     console.log("db onupgradeneeded", openRequest, event, db);
        if (version === 1) {


            db.addEventListener('close', onClose, false)


            db.onversionchange = vChange;
            db.onabort = onAbort;
            db.onerror = onError;
            dbs[dbSettings.name] = db;
            if (event.oldVersion === 0) {
                console.log("Init new DB", db, event, openRequest);
                onInitCB(db, key);
            } else {
                console.log("Start existing DB Session", db, event, openRequest);
            }

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



}

function storeDbKeyValue(db, settings, putQueue, onSuccess, onError) {
    let key = putQueue.shift();
    let value = putQueue.shift();
 //   console.log("transaction", db,  key, value);
    let transaction = db.transaction(key, "readwrite"); // (1)

// get an object store to operate on it
    let stores = transaction.objectStore(key); // (2)

    let request = stores.put(value, key); // (3)

    request.onsuccess = function() { // (4)
     //   console.log("transaction added to the store", request.result);
    //    db.close();
        onSuccess(request.result, settings, putQueue)
    };

    request.onerror = function() {
        console.log("Error", request.error);
    //    db.close();
        onError(request.result, settings, putQueue)
    };


    function complete(e) {
     //   console.log("transaction complete", db, e);

        db.close();
     //   console.log("transaction closed", db);
        settings.version = db.version;
        updateStoresDbVersion(settings.name, settings.version)
//        setTimeout(function() {
            if (putQueue.length !== 0) {
                initWriteTransaction(settings, putQueue);
            } else {
        //        console.log("DB Put queue completed", settings, db);
            }
  //      }, 10)


    //
    }

    transaction.oncomplete = complete
}

function transactionSuccessCB(res, settings, putQueue) {
    if (putQueue.length === 0) {
    //    console.log("transaction queue successfully stored", res, dbs[settings.name]);
    } else {
    //    console.log("transaction queue entry stored", res, settings, putQueue);
    }

}

function transactionFailCB(res, settings, putQueue) {
    console.log("transaction fail", res);
}

function attachKeyObjectStoreToDb(db, key) {
    if (db.objectStoreNames.contains(key) === false) {
        const objectStore = db.createObjectStore(key);
     //   console.log("attachKeyObjectStoreToDb", db, key, objectStore)
    } else {
        console.log("key store already attached", db, key)
    }
}

function initWriteTransaction(settings, putQueue) {

    if (settings.version === -1) {
    //    console.log("settings are upgrading, await callback chain", settings);
        return;
    } else {
    //    console.log("transaction initialize", settings, putQueue);
    }

    let key = putQueue[0];
    let value = putQueue[1];
    let db = dbs[settings.name] || {};
    let currentVersion = db.version || 0;
 //   if (settings.index.indexOf(key) === -1) {

        function initCB(db, initKey) {
        //    console.log("initCB", db);



            attachKeyObjectStoreToDb(db, initKey)
        //    db.addEventListener('close', callOnClose, false)

        }

        function resumeCB(db, initKey, event) {
        //    console.log("resumeCB", event, initKey, key, putQueue[0], settings.version, settings);

            if (event) {
                console.log("resumeCB before upgrade event", event, initKey, event);

                if (putQueue.length !== 0) {
                    settings.version = db.version+1;
                    initWriteTransaction(settings, putQueue)
                }
            //    attachKeyObjectStoreToDb(db, putQueue[0])
            //    initWriteTransaction(settings, putQueue)
            } else {
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

        }

        function upgradeCB(db, initKey) {
        //    console.log("upgradeCB", db, initKey);
            attachKeyObjectStoreToDb(db, initKey)
            if (initKey === putQueue[0]) {
            //    storeDbKeyValue(db, settings, putQueue, transactionSuccessCB, transactionFailCB)
            }
        }

        function onOpenOK(res, initKey, openRequest) {
         //   console.log("openOK", res, initKey, openRequest, putQueue[0]);
            if (settings.index.indexOf(initKey) === -1) {
                settings.index.push(initKey);
            }
            if (putQueue[0] === initKey) {
                storeDbKeyValue(res, settings, putQueue, transactionSuccessCB, transactionFailCB)
            } else {
                console.log("open on other initKey")
            }

        }

    function onClose(evt) {
        console.log("unexpected DB close", evt, db, settings, putQueue.length);
        if (putQueue.length !== 0) {
            initWriteTransaction(settings, putQueue);
        } else {
            console.log("DB Put queue completed", settings, db);
        }
    }


        function onOpenFail(db, dbSettings) {
            console.log("openFail", db);
        }

    if (settings.index.indexOf(key) === -1) {
        settings.version++;
     //   console.log("Increment DB version", settings.version)
    }

        let v = settings.version;
        settings.version = -1;
        openIndexedDB(settings, v, putQueue[0], onOpenOK, onOpenFail, initCB, resumeCB, upgradeCB, onClose);

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

    get(key, callback) {

    }



}

export { Storage }