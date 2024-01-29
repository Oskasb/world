import {configDataList} from "../../application/utils/ConfigUtils.js";
import {PlayerMovementInputs} from "../Player/PlayerMovementInputs.js";
import {ControlFunctions} from "../piece_functions/ControlFunctions.js";
import {SpatialTransition} from "../piece_functions/SpatialTransition.js";
import {PathPoint} from "../gameworld/PathPoint.js";
import {poolFetch} from "../../application/utils/PoolUtils.js";
import {getStatusPosition, setDestination} from "../../../../Server/game/actor/ActorStatusFunctions.js";

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
 //   console.log("Travel Mode Configs: ", config);
}

setTimeout(function() {
    configDataList("GAME_ACTORS", "TRAVEL_MODES", configUpdated)
}, 2000)


let activateDraken = function(actor, callback) {
        let addModelInstance = function(instance) {
            callback(instance)
        }
        client.dynamicMain.requestAssetInstance("asset_j35draken", addModelInstance)
}


function registerPathPoints(actor) {
    if (!actor.isPlayerActor()) {
    //    return;
    }
    let walkGrid = actor.getGameWalkGrid();
    let pathTiles = walkGrid.getActivePathTiles();

    let pathPoints = actor.getStatus(ENUMS.ActorStatus.PATH_POINTS);

    while (pathPoints.length) {
        pathPoints.pop()
    }

    for (let i = 0; i < pathTiles.length; i++) {
        let pathPoint = pathTiles[i].pathPoint;
        pathPoints.push(pathPoint.point);
    }

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
    actor = actr;

    setDestination(actor, getStatusPosition(actor))

    //   console.log("activate TravelMode: ", mode, actor);

    if (mode === ENUMS.TravelMode.TRAVEL_MODE_PASSIVE) {
        //    evt.dispatch(ENUMS.Event.SET_CAMERA_MODE, {mode:'game_travel'})
        activateCB(config[mode], actor)
    }

    if (mode === ENUMS.TravelMode.TRAVEL_MODE_LEAP) {
        //    evt.dispatch(ENUMS.Event.SET_CAMERA_MODE, {mode:'game_travel'})
    //    actor.getGameWalkGrid().dynamicWalker.attachFrameLeapTransitionFx(actor)
        activateCB(config[mode], actor)
    }

    if (mode === ENUMS.TravelMode.TRAVEL_MODE_JETPACK) {
        //    evt.dispatch(ENUMS.Event.SET_CAMERA_MODE, {mode:'world_viewer'})
        actor.getGameWalkGrid().dynamicWalker.attachFrameLeapTransitionFx(actor)
        let isUp = function(pos) {
        //    evt.dispatch(ENUMS.Event.SET_CAMERA_MODE, {mode:'game_travel'})
            actor.getGameWalkGrid().dynamicWalker.attachFrameLeapTransitionFx(actor)
            activateCB(config[mode], actor)
        }

        let onFrameUpdate = function(pos) {
            actor.setStatusKey(ENUMS.ActorStatus.IS_LEAPING, true)
            actor.getGameWalkGrid().dynamicWalker.attachFrameLeapEffect(actor)
        }

        spatialTransition.targetPos.copy(actor.getSpatialPosition());
        spatialTransition.targetPos.y += 4;
        spatialTransition.targetPos.add(actor.getForward().multiplyScalar(0.1));
        spatialTransition.initSpatialTransition(actor.getSpatialPosition(), spatialTransition.targetPos, 1.3, isUp, 1, null, onFrameUpdate)
        deactivateCB()
    }

    if (mode === ENUMS.TravelMode.TRAVEL_MODE_FLY) {
    //    evt.dispatch(ENUMS.Event.SET_CAMERA_MODE, {mode:'world_viewer'})

        ThreeAPI.getCameraCursor().setZoomDistance(12);
        ThreeAPI.getCameraCursor().getLookAroundPoint().copy(getStatusPosition(actor))
        ThreeAPI.getCameraCursor().getPos().copy(getStatusPosition(actor))
    //    actor.setSpatialPosition(ThreeAPI.getCameraCursor().getLookAroundPoint())
    //    actor.getSpatialPosition()
        activateCB(config[mode], actor)

    }



    if (mode === ENUMS.TravelMode.TRAVEL_MODE_WALK) {
            //    evt.dispatch(ENUMS.Event.SET_CAMERA_MODE, {mode:'game_travel'})
        activateCB(config[mode], actor)
    }

    if (mode === ENUMS.TravelMode.TRAVEL_MODE_BATTLE) {

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

        this.vehicle = null;

        let active = false;
        let hasTurn = false;

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

        let setActorTurn = function(bool) {
            hasTurn = bool;
        }

        let getHasTurn = function() {
            return hasTurn;
        }

        let activateVehicle = function(actor, callback) {
            activateDraken(actor, callback)
        }

        this.call = {
            activateVehicle:activateVehicle,
            isActive:isActive,
            deactivateControls:deactivateControls,
            activateControls:activateControls,
            getHasTurn:getHasTurn,
            setActorTurn:setActorTurn
        }

    }

    updateTravelMode(actor) {
        registerPathPoints(actor)
        let mode = actor.getStatus(ENUMS.ActorStatus.TRAVEL_MODE);
        if (mode !== this.mode) {
            this.mode = mode;
            activateTravelMode(actor, mode, this.call.activateControls, this.call.deactivateControls);
        }

        if (mode === ENUMS.TravelMode.TRAVEL_MODE_BATTLE) {
            if (actor.getStatus(ENUMS.ActorStatus.HAS_TURN) === true && this.call.getHasTurn() === false) {
                this.call.setActorTurn(true)
                this.call.activateControls(config[mode], actor)
            }

            if (actor.getStatus(ENUMS.ActorStatus.HAS_TURN) === false && this.call.getHasTurn() === true) {
                this.call.setActorTurn(false)
                this.call.deactivateControls()
            }

        }

        if (this.call.isActive()) { // should be only player actor
            applyActorControls(actor);
        }

    }
}

export { TravelMode }