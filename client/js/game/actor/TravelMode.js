import {configDataList} from "../../application/utils/ConfigUtils.js";
import {PlayerMovementInputs} from "../Player/PlayerMovementInputs.js";
import {ControlFunctions} from "../piece_functions/ControlFunctions.js";
import {SpatialTransition} from "../piece_functions/SpatialTransition.js";

let controlFunctions = new ControlFunctions();
let spatialTransition = new SpatialTransition()

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

function activateTravelMode(actr, mode, activateCB, deactivateCB) {
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



    if (mode === ENUMS.TravelMode.TRAVEL_MODE_JETPACK) {
        //    evt.dispatch(ENUMS.Event.SET_CAMERA_MODE, {mode:'world_viewer'})

        let isUp = function(pos) {
        //    evt.dispatch(ENUMS.Event.SET_CAMERA_MODE, {mode:'game_travel'})
            playerMovementControls.applyInputSamplingConfig(config[mode], actor);
            playerMovementControls.activatePlayerMovementControls()
            activateCB()
        }

        spatialTransition.targetPos.copy(actor.getPos());
        spatialTransition.targetPos.y += 4;
        spatialTransition.targetPos.add(actor.getForward());
        spatialTransition.initSpatialTransition(actor.getPos(), spatialTransition.targetPos, 1.3, isUp, 1)
        deactivateCB()
    }

    if (mode === ENUMS.TravelMode.TRAVEL_MODE_FLY) {
    //    evt.dispatch(ENUMS.Event.SET_CAMERA_MODE, {mode:'world_viewer'})
        deactivateCB()
        actor.hideGameActor()

        if (draken) {
            GameAPI.registerGameUpdateCallback(stickToActor)
        } else {
            let addModelInstance = function(instance) {
                draken = instance;
                GameAPI.registerGameUpdateCallback(stickToActor)
                playerMovementControls.applyInputSamplingConfig(config[mode], actor);
                playerMovementControls.activatePlayerMovementControls()
                activateCB()
            }

            client.dynamicMain.requestAssetInstance("asset_j35draken", addModelInstance)
        }

    }

    if (mode === ENUMS.TravelMode.TRAVEL_MODE_WALK) {
        evt.dispatch(ENUMS.Event.SET_CAMERA_MODE, {mode:'game_travel'})
        if (draken) {
            GameAPI.unregisterGameUpdateCallback(stickToActor)
        }
        activateCB()
        playerMovementControls.applyInputSamplingConfig(config[mode], actor);
        playerMovementControls.activatePlayerMovementControls()
    }

    if (mode === ENUMS.TravelMode.TRAVEL_MODE_BATTLE) {
        playerMovementControls.applyInputSamplingConfig(config[mode], actor);
        playerMovementControls.activatePlayerMovementControls()
    }

}


function applyActorControls(actor) {
    controlFunctions.SAMPLE_STATUS(actor);
    let controlKeys = playerMovementControls.getInputSamplers()
    for (let i = 0; i < controlKeys.length; i++) {
        let key = controlKeys[i];
        controlFunctions[key](actor.getControl(key), actor)
    }
}

class TravelMode {
    constructor() {
        this.mode = null;

        let active = false;

        let activateControls = function() {
            active = true;
        }

        let deactivateControls = function() {
            active = false;
        }

        let isActive = function() {
            return active;
        }

        this.call = {
            isActive:isActive,
            deactivateControls:deactivateControls,
            activateControls:activateControls
        }

    }

    updateTravelMode(actor) {
        let mode = actor.getStatus(ENUMS.ActorStatus.TRAVEL_MODE);
        if (mode !== this.mode) {
            this.mode = mode;
            activateTravelMode(actor, mode, this.call.activateControls, this.call.deactivateControls);
        }

        if (this.call.isActive()) {
            applyActorControls(actor);
        }

    }
}

export { TravelMode }