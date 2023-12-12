let cache = {};
let callbacks = {};

function trackDebugConfig(folder, key, value) {
    if (!cache['DEBUG']) {
        cache = PipelineAPI.getCachedConfigs();
        if (!cache['DEBUG']) {
            cache.DEBUG = {};
        }
        if (!cache.DEBUG[folder]) {
            cache.DEBUG[folder] = {}
        }
    }
    cache.DEBUG[folder][key] = value;
}

function registerTrackUpdateCallback(folder, key, callback) {
    if (!callbacks[folder]) {
        callbacks[folder] = {};
        if (!callbacks[folder][key]) {
            callbacks[folder][key] = [];
        }
    }

    //if (callbacks[folder][key].indexOf(callback) === -1) {
        callbacks[folder][key][0] = callback;
    //}
}



export {
    trackDebugConfig
}