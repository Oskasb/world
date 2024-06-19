let cache = {};
let callbacks = {};
let paramsMap = {};
if (typeof (window) !== 'undefined') {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    const entries = urlParams.entries();


    for (const entry of entries) {
        if (entry[1] === 'true') {
            paramsMap[entry[0]] = true;
        } else {
            paramsMap[entry[0]] = entry[1];
        }
    }
    console.log("urlParams:", paramsMap);
}



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



function getAllSceneNodes() {
    let scene = ThreeAPI.getScene();
    return scene.children;
}

function createDebugButton(text, onActivate, testActive, parent, x, y) {
    //   console.log("Debug Button: ", text, onActivate, testActive, parent, x, y);
    let buttonReady = function(button) {
        //      console.log("DEbug Button Ready: ", button);
    }

    let opts = {
        widgetClass:'GuiSimpleButton',
        widgetCallback:buttonReady,
        configId: 'button_big_blue',
        onActivate: onActivate,
        testActive: testActive,
        interactive: true,
        text: text,
        offset_x: x,
        offset_y: y
    };

    if (typeof(parent) === 'string') {
        opts.anchor = parent;
    }
    if (typeof(parent) === 'object') {
        opts.container = parent;
    }

    evt.dispatch(ENUMS.Event.BUILD_GUI_ELEMENT, opts)

}

function isDev() { // set from URL Param ? dev=true
    if (paramsMap['dev'] === true) {
        return true
    } else {
        return false
    }
}

function applyVariation(id) {
    return getUrlParam(id)
}

function getUrlParam(param) {
    if (paramsMap[param] === true) {
        return true
    } else {
        return false
    }
}

export {
    createDebugButton,
    getAllSceneNodes,
    isDev,
    applyVariation,
    trackDebugConfig,
    debugTrackStatusMap,
    indicateActiveInstances,
    getUrlParam
}