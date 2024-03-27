import { ConfigData } from "./ConfigData.js";
import {ENUMS} from "../ENUMS.js";

let savedConfigs = {};
let editIndex = {};
let requestListeners = [];

function setEditIndexClient(eIndex) {
    console.log("Loaded Edit Index: ", eIndex, requestListeners);
    editIndex = eIndex;
    for (let key in eIndex) {
        for (let i = 0; i < requestListeners.length; i++) {
            if (requestListeners[i].id === key) {
                let entry = requestListeners[i];
                console.log("Preloaded call triggeres: ", key);
                loadSavedConfig(key, entry.callback)
            }
        }
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
}



function loadSavedConfig(id, callback) {
//    console.log("Request", id)
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
            evt.dispatch(ENUMS.Event.SEND_SOCKET_MESSAGE, {
                request:ENUMS.ClientRequests.READ_FILE,
                id:id,
                file:editIndex[id].file,
                format:editIndex[id].format
            })
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
    savedConfigs[id] = data;
//    console.log("applyRemoteConfigMessage", message, savedConfigs, requestListeners);
    for (let i = 0; i < requestListeners.length; i++) {
        if (requestListeners[i].id === id) {
            let entry =requestListeners[i];
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

export {
    detachConfig,
    setEditIndexClient,
    configDataList,
    parseConfigDataKey,
    loadSavedConfig,
    applyRemoteConfigMessage,
    saveConfigEdits,
    saveEncounterEdits,
    saveWorldModelEdits
 }
