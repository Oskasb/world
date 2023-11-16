import {configDataList} from "../../application/utils/ConfigUtils.js";
import {PlayerMovementInputs} from "../Player/PlayerMovementInputs.js";
import {ControlFunctions} from "../piece_functions/ControlFunctions.js";
import {SpatialTransition} from "../piece_functions/SpatialTransition.js";

let controlFunctions = new ControlFunctions();
let spatialTransition = new SpatialTransition()

let draken;
let actor;
let playerMovementControls;
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

    }

    deactivateCB()

    console.log("activate TravelMode: ", mode, actor);

    actor = actr;
    
    if (draken) {
        GameAPI.unregisterGameUpdateCallback(stickToActor)
        actor.showGameActor()
    }



    if (mode === ENUMS.TravelMode.TRAVEL_MODE_JETPACK) {
        //    evt.dispatch(ENUMS.Event.SET_CAMERA_MODE, {mode:'world_viewer'})
        actor.getGameWalkGrid().dynamicWalker.attachFrameLeapTransitionFx(actor.actorObj3d)
        let isUp = function(pos) {
        //    evt.dispatch(ENUMS.Event.SET_CAMERA_MODE, {mode:'game_travel'})
            actor.getGameWalkGrid().dynamicWalker.attachFrameLeapTransitionFx(actor.actorObj3d)
            activateCB(config[mode], actor)
        }

        let onFrameUpdate = function(pos) {
            actor.getGameWalkGrid().dynamicWalker.isLeaping = true;
            actor.getGameWalkGrid().dynamicWalker.attachFrameLeapEffect(actor.actorObj3d)
        }

        spatialTransition.targetPos.copy(actor.getPos());
        spatialTransition.targetPos.y += 4;
        spatialTransition.targetPos.add(actor.getForward().multiplyScalar(0.1));
        spatialTransition.initSpatialTransition(actor.getPos(), spatialTransition.targetPos, 1.3, isUp, 1, null, onFrameUpdate)
        deactivateCB()
    }

    if (mode === ENUMS.TravelMode.TRAVEL_MODE_FLY) {
    //    evt.dispatch(ENUMS.Event.SET_CAMERA_MODE, {mode:'world_viewer'})

        actor.hideGameActor()

        if (draken) {
            GameAPI.registerGameUpdateCallback(stickToActor)
            activateCB(config[mode], actor)
        } else {
            let addModelInstance = function(instance) {
                draken = instance;
                GameAPI.registerGameUpdateCallback(stickToActor)
                activateCB(config[mode], actor)
            }

            client.dynamicMain.requestAssetInstance("asset_j35draken", addModelInstance)
        }

    }

    if (mode === ENUMS.TravelMode.TRAVEL_MODE_WALK) {
        evt.dispatch(ENUMS.Event.SET_CAMERA_MODE, {mode:'game_travel'})
        activateCB(config[mode], actor)
    }

    if (mode === ENUMS.TravelMode.TRAVEL_MODE_BATTLE) {
    //    activateCB(config[mode], actor)
    }

    if (mode === ENUMS.TravelMode.TRAVEL_MODE_INACTIVE) {

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

        let activateControls = function(modeConfig, actor) {
            playerMovementControls.applyInputSamplingConfig(modeConfig, actor);
            playerMovementControls.activatePlayerMovementControls()
            active = true;
        }

        let deactivateControls = function() {
            playerMovementControls.deactivatePlayerMovementControls();
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