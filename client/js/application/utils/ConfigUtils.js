import { ConfigData } from "./ConfigData.js";

let savedConfigs = {};
let editIndex = {};

function setEditIndexClient(eIndex) {
    console.log("Loaded Edit Index: ", eIndex);
    editIndex = eIndex;
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

let requestQueue = []

function loadSavedConfig(id, callback) {
    if (typeof (savedConfigs[id]) === 'object') {
        callback(savedConfigs[id])
    } else {
        if (typeof(editIndex[id]) === 'object') {
            requestQueue.push({id:id, callback:callback});
            evt.dispatch(ENUMS.Event.SEND_SOCKET_MESSAGE, {
                request:ENUMS.ClientRequests.READ_FILE,
                id:id,
                file:editIndex[id].file,
                format:editIndex[id].format
            })
            console.log("Request edit from index", id);
        } else {
            console.log("Not in Index", id, editIndex);
            callback(null);
        }
    }
}

function applyRemoteConfigMessage(message) {
    let id = message.id;
    let file = message.file;
    let format = message.format;
    let data = message.data;
    savedConfigs[id] = data;
        console.log("applyRemoteConfigMessage", message, savedConfigs, requestQueue);
    for (let i = 0; i < requestQueue.length; i++) {
        if (requestQueue[i].id === id) {
            let entry =requestQueue[i];
            MATH.splice(requestQueue, entry);
            i++;
            entry.callback(savedConfigs[id]);
        }
    }
}

function saveConfigEdits(root, folder, id, editedConfig) {
    let json = JSON.stringify(editedConfig);
    savedConfigs[id] = JSON.parse(json);

    evt.dispatch(ENUMS.Event.SEND_SOCKET_MESSAGE, {
        request:ENUMS.ClientRequests.WRITE_FILE,
        id:id,
        file:"edits/configs/"+root+"/"+folder+"/"+id+".json",
        format:"JSON",
        data:json,
    })

    return savedConfigs[id];
}

export {
    setEditIndexClient,
    configDataList,
    parseConfigDataKey,
    loadSavedConfig,
    applyRemoteConfigMessage,
    saveConfigEdits
 }
