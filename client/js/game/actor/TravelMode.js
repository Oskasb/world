import {configDataList} from "../../application/utils/ConfigUtils.js";
import {PlayerMovementInputs} from "../Player/PlayerMovementInputs.js";
import {ControlFunctions} from "../piece_functions/ControlFunctions.js";

let controlFunctions = new ControlFunctions();

let draken;
let actor;
let playerMovementControls = null;
let config = {};
let travelMode = null;
let configUpdated = function(cfg) {
    config = cfg;
    if (playerMovementControls) {
        playerMovementControls.deactivatePlayerMovementControls();
        playerMovementControls.applyInputSamplingConfig(config[travelMode]);
        playerMovementControls.activatePlayerMovementControls()
    }
    console.log("Travel Mode Configs: ", config);
}

setTimeout(function() {
    configDataList("GAME_ACTORS", "TRAVEL_MODES", configUpdated)
}, 2000)

let stickToActor = function() {
    draken.getSpatial().stickToObj3D(actor.actorObj3d);
}

function activateTravelMode(actr, mode) {
    travelMode = mode;
    if (!actr.isPlayerActor()) {
        return;
    }

    if (!playerMovementControls) {
        playerMovementControls = new PlayerMovementInputs();
    } else {
        playerMovementControls.deactivatePlayerMovementControls();
    }

    console.log("activate TravelMode: ", mode, actor);

    actor = actr;
    
    if (draken) {
        GameAPI.unregisterGameUpdateCallback(stickToActor)
        actor.showGameActor()
    }

    playerMovementControls.applyInputSamplingConfig(config[mode], actor);
    playerMovementControls.activatePlayerMovementControls()
    if (mode === ENUMS.TravelMode.TRAVEL_MODE_FLY) {
        evt.dispatch(ENUMS.Event.SET_CAMERA_MODE, {mode:'world_viewer'})

        actor.hideGameActor()

        if (draken) {
            GameAPI.registerGameUpdateCallback(stickToActor)
        } else {
            let addModelInstance = function(instance) {
                draken = instance;
                GameAPI.registerGameUpdateCallback(stickToActor)
            }

            client.dynamicMain.requestAssetInstance("asset_j35draken", addModelInstance)
        }

    }

    if (mode === ENUMS.TravelMode.TRAVEL_MODE_WALK) {
        evt.dispatch(ENUMS.Event.SET_CAMERA_MODE, {mode:'game_travel'})
        if (draken) {
            GameAPI.unregisterGameUpdateCallback(stickToActor)
        }
    }

    if (mode === ENUMS.TravelMode.TRAVEL_MODE_BATTLE) {

    }

}


function applyActorControls(actor) {
    let controlKeys = ENUMS.Controls;
    for (let key in controlKeys) {
        controlFunctions[key](actor.getControl(key), actor)
    }
}

class TravelMode {
    constructor() {
        this.mode = null;
    }

    updateTravelMode(actor) {
        let mode = actor.getStatus(ENUMS.ActorStatus.TRAVEL_MODE);
        if (mode !== this.mode) {
            this.mode = mode;
            activateTravelMode(actor, mode);
        }
        applyActorControls(actor);
    }
}

export { TravelMode }