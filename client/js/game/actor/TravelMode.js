
let draken;
let actor;

let stickToActor = function() {
    draken.getSpatial().stickToObj3D(actor.actorObj3d);
}

function activateTravelMode(actr, mode) {
    if (!actr.isPlayerActor()) {
        return;
    }
    console.log("activate TravelMode: ", mode, actor);

    actor = actr;
    
    if (draken) {
        GameAPI.unregisterGameUpdateCallback(stickToActor)
    }

    if (mode === ENUMS.TravelMode.TRAVEL_MODE_FLY) {
        evt.dispatch(ENUMS.Event.SET_CAMERA_MODE, {mode:'world_viewer'})

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
    }

}

export { TravelMode }