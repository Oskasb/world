import { ConfigData } from "./ConfigData.js";
import {ENUMS} from "../ENUMS.js";

let deletedByIndex = [];
let deletedConfigs = {};
let savedConfigs = {};
let editIndex = {};
let requestListeners = [];
let bufferListeners = [];
let requestedLoads = [];
let savedImageBuffers = {};
let configKeyMap = null;
let activeSaves = [];

function processLoadedBuffer(id) {
    for (let i = 0; i < bufferListeners.length; i++) {
        if (bufferListeners[i].id === id) {
            let entry = bufferListeners[i];
            entry.callback(savedImageBuffers[id]);
        }
    }

}

let index = 0;

function generateEditId() {
    index++;
    return new Date().getTime()+"_"+index;
}

function generateSaveId() {
    return client.getStamp() + "_"+new Date().getTime();
}

function processLoadedFile(id) {

    if (typeof(deletedConfigs[id]) === 'object') {
        console.log("Block load of deleted config")
        return;
    }

    if (savedConfigs[id]['DELETED'] === true) {
        console.log("Is deleted..")
        return;
    }

    for (let i = 0; i < requestListeners.length; i++) {
        if (requestListeners[i].id === id) {
            let entry = requestListeners[i];
            entry.callback(savedConfigs[id], savedConfigs[id].edit_id);
        }
    }


    let indexEntry = editIndex[id];
    console.log("Load from index", id, indexEntry);
    if (!indexEntry) {
        console.log("No index entry", id, editIndex);
        return;
    }

    let root = indexEntry.root;
    let folder = indexEntry.folder;
    let format = indexEntry.format

    if (format === 'json') {
        if (root === 'model') {
            GameAPI.worldModels.setLoadedConfig(root, folder, id, savedConfigs[id]);
        } else if (root === 'encounter') {
            GameAPI.worldModels.setLoadedConfig(root, folder, id, savedConfigs[id]);
        } else {
            console.log("Unsupported Config root Folder")
        }
    }

    if (format === "buffer") {
        console.log("Load saved image buffer")
    }


}

function requestFileRead(id) {

    if (typeof(deletedConfigs[id]) === 'object') {
        console.log("Block load of deleted config", id)

        return;
    }



    if (requestedLoads.indexOf(id) === -1) {
        requestedLoads.push(id);
        evt.dispatch(ENUMS.Event.SEND_SOCKET_MESSAGE, {
            request:ENUMS.ClientRequests.READ_FILE,
            id:id,
            root:editIndex[id].root,
            folder:editIndex[id].folder,
            dir:editIndex[id].dir,
            path:editIndex[id].path,
            format:editIndex[id].format
        })
    }
}

function streamLoadEditsFromIndexInit() {

    let loadStrem = [];

    for (let id in editIndex) {
        if (editIndex.deleted === true) {
            deletedByIndex.push(id);
        } else {
            if (requestedLoads.indexOf(id) === -1) {
                loadStrem.push(id)
            }
        }
    }

    console.log("Deleted by index: ", deletedByIndex);
    let hold = 0;
    function processStream(tpf) {
        hold += tpf;
        if (hold < 0.1) {
            return;
        }
        hold = 0;
        let id = loadStrem.pop()
        requestFileRead(id);
        GuiAPI.screenText('EDITS', ENUMS.Message.SYSTEM, loadStrem.length);
        if (loadStrem.length === 0) {
            ThreeAPI.unregisterPrerenderCallback(processStream)
        }
    }

    if (loadStrem.length !== 0) {
        ThreeAPI.registerPrerenderCallback(processStream)
    }

}

function processIndexEntry(id, indexEntry) {
    if (indexEntry.format === 'json') {
        for (let i = 0; i < requestListeners.length; i++) {
            if (requestListeners[i].id === id) {
                let entry = requestListeners[i];
                loadSavedConfig(id, entry.callback)
            }
        }
    }
    if (indexEntry.format === 'buffer') {
        requestFileRead(id)
    }
}

function setEditIndexClient(eIndex) {
    console.log("Loaded Edit Index: ", [[eIndex], [requestListeners]]);
    editIndex = eIndex;
    for (let key in eIndex) {
        processIndexEntry(key, eIndex[key]);

    }
    streamLoadEditsFromIndexInit()
}

function remoteUpdateEditIndex(id, root, folder, entry, operation, message) {
    console.log("Register new index entry", message.id, message);

    if (operation === 'add') {
        if (editIndex[id]) {
            console.log("entry already loaded, return to creator")
        }
        editIndex[id] = entry;
        processIndexEntry(id, entry)
    }

}

let configDataList = function(root, folder, onData) {
    let storeList = {};

    let storeData = function(data) {
        storeList[data.id] = data.data;
    }

    let initData = function(config) {
        for (let i = 0; i < config.length;i++) {
            storeData(config[i]);
        }
        onData(storeList);
    }

    new ConfigData(root, folder, null, null, null, initData)
}

function parseConfigDataKey(root, folder, dataId, id, callback) {
    let configData =  new ConfigData(root, folder, dataId, 'data_key', 'config')
    configData.addUpdateCallback(callback);
    configData.parseConfig(id, callback)
    configKeyMap = configData.getConfigKeyMap();
}

function loadSavedBuffer(id, callback) {
    let add = true;
    for (let i = 0; i < bufferListeners.length; i++) {
        if (bufferListeners[i].callback === callback) {
            bufferListeners[i].id = id;
            add = false;
        }
    }
    if (add === true) {
        bufferListeners.push({id:id, callback:callback});
    }
    if (savedImageBuffers[id]) {
        callback(savedImageBuffers[id])
    }
}

function loadSavedConfig(id, callback) {
//    console.log("Request", id)

    if (typeof(deletedConfigs[id]) === 'object') {
        console.log("Block load of deleted config")
        return;
    }

    if (typeof (savedConfigs[id]) === 'object') {
        callback(savedConfigs[id], savedConfigs[id].edit_id)
    } else {
        let add = true;
        for (let i = 0; i < requestListeners.length; i++) {
            if (requestListeners[i].id === id) {
                add = false;
            }
        }
        if (add === true) {
            requestListeners.push({id:id, callback:callback});
        }
        if (typeof(editIndex[id]) === 'object') {
            requestFileRead(id);

        //    console.log("Load from index", id);
        } else {
            // console.log("Not in Index", id, editIndex);
            callback(null);
        }
    }
}


function applyRemoteConfigMessage(message) {
    let id = message.id;
    let data = message.data;

    if (message.save) {
        if (activeSaves.indexOf(message.save) !== -1) {
            MATH.splice(activeSaves, message.save);
            return;
        }
    }

    if (data['DELETED'] === true) {
        console.log("Not loading deleted config", id, message)
        deletedConfigs[id] = data
    } else {
        if (message.format === 'index_entry') {
            console.log("Add Index by Remote ", message);
            remoteUpdateEditIndex(message.id, message.root, message.folder, message.data, message.operation, message)
        }

        if (message.format === 'json') {
            savedConfigs[id] = data;
            processLoadedFile(id);
        }
        if (message.format === 'buffer') {
            let array = [];
        //    console.log(data);
            for (let key in data) {
                array.push(data[key]);
            }
        //    console.log(array);
            savedImageBuffers[id] = new Uint8ClampedArray(array);
            processLoadedBuffer(id);
        }
    }
}

function saveConfigEdits(root, folder, id, editedConfig) {
    if (!editedConfig.edit_id) {
        editedConfig.edit_id = generateEditId();
    }
    let saveId = generateSaveId();
    activeSaves.push(saveId)
    let json = JSON.stringify(editedConfig);
    savedConfigs[id] = JSON.parse(json);

    evt.dispatch(ENUMS.Event.SEND_SOCKET_MESSAGE, {
        request:ENUMS.ClientRequests.WRITE_FILE,
        id:editedConfig.edit_id,
        root:root,
        folder:folder,
        dir:"configs",
        format:"json",
        path: "configs/",
        save:saveId,
        data:json,
    })
    GuiAPI.screenText("SAVE: "+editedConfig.edit_id,  ENUMS.Message.SAVE_STATUS, 1.5)
    return savedConfigs[id].edit_id;
}

function detachConfig(config) {
    if (!config.edit_id) {
        config.edit_id = generateEditId();
    }
    return JSON.parse(JSON.stringify(config));
}

function saveEncounterEdits(encounter) {
    let worldLevel = GameAPI.getPlayer().getStatus(ENUMS.PlayerStatus.PLAYER_WORLD_LEVEL)
    encounter.id = saveConfigEdits("encounter", worldLevel, encounter.id, encounter.config)
    console.log("Save Enc config ", encounter);
}

function saveWorldModelEdits(wModel) {
    let worldLevel = GameAPI.getPlayer().getStatus(ENUMS.PlayerStatus.PLAYER_WORLD_LEVEL)
    wModel.id = saveConfigEdits("model", worldLevel, wModel.id, wModel.config)
    console.log("Save World Model config ", wModel);
}




function saveDataTexture(root, folder, id, buffer) {
    savedImageBuffers[id] = buffer;
//    console.log("saveDataTexture", root, folder, id)
    let saveId = generateSaveId();
    activeSaves.push(saveId)
    evt.dispatch(ENUMS.Event.SEND_SOCKET_MESSAGE, {
        request:ENUMS.ClientRequests.WRITE_FILE,
        id:id,
        root:root,
        folder:folder,
        dir:"images",
        format:"buffer",
        path: "images/",
        save:saveId,
        data:JSON.stringify(buffer)
    })
    GuiAPI.screenText("SAVE: "+id,  ENUMS.Message.SAVE_STATUS, 1.5)

}

let reverseMap = null;
function mappedConfigKey(key) {
    if (reverseMap === null) {
        reverseMapConfigs();
    }
    if (typeof (reverseMap[key]) !== 'object') {
        console.log("Key not in map", key, [reverseMap])
        return null;
    }
    return reverseMap[key];
}

let configList = {};

function addToReverseMap(configKey, root, folder) {
    if (!reverseMap[configKey]) {
        reverseMap[configKey] = [];
    }

    if (!configList[root]) {
        configList[root] = {};
    }

    if (!configList[root][folder]) {
        configList[root][folder] = []
    }

    configList[root][folder].push(configKey);

    reverseMap[configKey].push({source:"config", root:root, folder:folder});
}

function reverseMapConfigs() {
    let configs = window.CONFIGS;
    reverseMap = {};
    for (let root in configs) {
        for (let folder in configs[root]) {
            let entry =configs[root][folder]
            if (Array.isArray(entry[0])) {
                entry = entry[0]
            }

            if (Array.isArray(entry)) {
                let list = entry
                for (let i = 0; i < list.length; i++) {
                    if (typeof (list[i].id) === 'string') {
                        addToReverseMap(list[i].id, root, folder)
                    } else if (typeof (list[i]) === 'number') {
                        addToReverseMap(list[i], root, folder)
                    } else if (Array.isArray(list[i])) {
                        console.log("Figure out Array entry:", i, list[i], root, folder)

                    //    addToReverseMap(list[i], root, folder)
                    } else {

                        if (typeof(entry[i]) === 'object') {
                            if (typeof (entry[i].id) === 'string') {
                                addToReverseMap(entry[i].id, root, folder)
                            } else {
                      //          console.log("No id for object entry:", root, folder, entry[i])
                            }
                        } else {
                     //       console.log("Not reverse mapped:", root, folder, entry[i])
                        }

                    }
                }
            } else {
                if (typeof(entry) === 'object') {
                    if (typeof (entry.id) === 'string') {
                        addToReverseMap(entry.id, root, folder)
                    } else {
                //        console.log("No id for object entry:", root, folder , entry)
                    }
                } else {
                //    console.log("Not reverse mapped:", root, folder, entry)
                }

            }
        }
    }
    console.log("Reverse Map ", reverseMap);
}

function getReversedConfigs() {
    if (reverseMap === null) {
        reverseMapConfigs();
    }
    return reverseMap;
}

function getConfigListAt(root, folder) {
    if (!configList[root]) {
        reverseMapConfigs();
    }
    return configList[root][folder]
}

export {
    detachConfig,
    setEditIndexClient,
    configDataList,
    parseConfigDataKey,
    loadSavedConfig,
    loadSavedBuffer,
    applyRemoteConfigMessage,
    saveConfigEdits,
    saveEncounterEdits,
    saveWorldModelEdits,
    saveDataTexture,
    mappedConfigKey,
    getReversedConfigs,
    getConfigListAt
 }
