import { ConfigData } from "./ConfigData.js";
import {ENUMS} from "../ENUMS.js";

let deletedByIndex = [];
let deletedConfigs = {};
let savedConfigs = {};
let editIndex = {};
let requestListeners = [];
let requestedLoads = [];
let savedImageBuffers = {};

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
            let entry =requestListeners[i];
            entry.callback(savedConfigs[id]);
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

function setEditIndexClient(eIndex) {
    console.log("Loaded Edit Index: ", [[eIndex], [requestListeners]]);
    editIndex = eIndex;
    for (let key in eIndex) {
        if (eIndex[key].format === 'json') {
            for (let i = 0; i < requestListeners.length; i++) {
                if (requestListeners[i].id === key) {
                    let entry = requestListeners[i];
                    loadSavedConfig(key, entry.callback)
                }
            }
        }
        if (eIndex[key].format === 'buffer') {
            requestFileRead(key)
        }
    }
    streamLoadEditsFromIndexInit()
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
}

function loadSavedConfig(id, callback) {
//    console.log("Request", id)

    if (typeof(deletedConfigs[id]) === 'object') {
        console.log("Block load of deleted config")
        return;
    }

    if (typeof (savedConfigs[id]) === 'object') {
        callback(savedConfigs[id])
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
    if (data['DELETED'] === true) {
        console.log("Not loading deleted config", id, message)
        deletedConfigs[id] = data
    } else {
        savedConfigs[id] = data;
        processLoadedFile(id);
    }

}

function saveConfigEdits(root, folder, id, editedConfig) {
    let json = JSON.stringify(editedConfig);
    savedConfigs[id] = JSON.parse(json);

    evt.dispatch(ENUMS.Event.SEND_SOCKET_MESSAGE, {
        request:ENUMS.ClientRequests.WRITE_FILE,
        id:id,
        root:root,
        folder:folder,
        dir:"edits/configs/",
        format:"json",
        data:json,
    })

    return savedConfigs[id];
}

function detachConfig(config) {
    return JSON.parse(JSON.stringify(config));
}

function saveEncounterEdits(encounter) {
    let worldLevel = GameAPI.getPlayer().getStatus(ENUMS.PlayerStatus.PLAYER_WORLD_LEVEL)
    saveConfigEdits("encounter", worldLevel, encounter.id, encounter.config)
    console.log("Save Enc config ", encounter);
}

function saveWorldModelEdits(wModel) {
    let worldLevel = GameAPI.getPlayer().getStatus(ENUMS.PlayerStatus.PLAYER_WORLD_LEVEL)
    saveConfigEdits("model", worldLevel, wModel.id, wModel.config)
    console.log("Save World Model config ", wModel);
}




function saveDataTexture(root, folder, id, buffer) {
    savedImageBuffers[id] = buffer;

    let maxLength = 2048*16;
    let slices = buffer.length / maxLength;
    let sent = 0;

    function streamBufferSlice() {
        return;
        let data = buffer.slice(sent*maxLength, (sent+1)*maxLength)
        console.log(data)
        evt.dispatch(ENUMS.Event.SEND_SOCKET_MESSAGE, {
            request:ENUMS.ClientRequests.WRITE_FILE,
            id:id+"_"+sent,
            root:root,
            folder:folder,
            dir:"edits/",
            format:"buffer",
            data:data
        })
        sent++
        if (sent === slices) {
            ThreeAPI.unregisterPrerenderCallback(streamBufferSlice);
        }
    }

    ThreeAPI.registerPrerenderCallback(streamBufferSlice);

}

export {
    detachConfig,
    setEditIndexClient,
    configDataList,
    parseConfigDataKey,
    loadSavedConfig,
    applyRemoteConfigMessage,
    saveConfigEdits,
    saveEncounterEdits,
    saveWorldModelEdits,
    saveDataTexture
 }
