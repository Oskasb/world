import { ConfigData } from "./ConfigData.js";

let savedConfigs = {};

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


function loadSavedConfig(id) {
    if (typeof (savedConfigs[id]) === 'object') {
        return savedConfigs[id];
    }
    return null;
}

function saveConfigEdits(id, editedConfig) {
    let json = JSON.stringify(editedConfig);
    savedConfigs[id] = JSON.parse(json);
    return savedConfigs[id];
}

export {
    configDataList,
    parseConfigDataKey,
    loadSavedConfig,
    saveConfigEdits
 }
