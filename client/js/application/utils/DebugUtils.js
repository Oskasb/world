let cache = {};
let callbacks = {};

function trackDebugConfig(folder, key, value) {
    if (!cache['DEBUG']) {
        cache = PipelineAPI.getCachedConfigs();
        if (!cache['DEBUG']) {
            cache.DEBUG = {};
        }
    }
    if (!cache.DEBUG[folder]) {
        cache.DEBUG[folder] = {}
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

function debugTrackStatusMap(folder, statusMap) {
    for (let key in statusMap) {
        trackDebugConfig(folder, key, statusMap[key])
    }
}

let e = {};

function indicateActiveInstances() {
    let dynMain = client.dynamicMain;
    let instances = dynMain.instances;
    let cpos = ThreeAPI.getCameraCursor().getPos();
    for (let i = 0; i < instances.length; i++) {
        let pos = instances[i].getSpatial().getPos();
        e.from = cpos;
        e.to = pos;
        e.color = 'GREEN';
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, e);
    }
}


export {
    trackDebugConfig,
    debugTrackStatusMap,
    indicateActiveInstances
}