


function activateTravelMode(actor, mode) {
    console.log("activate TravelMode: ", mode, actor);

    if (mode === ENUMS.TravelMode.TRAVEL_MODE_FLY) {
        evt.dispatch(ENUMS.Event.SET_CAMERA_MODE, {mode:'world_viewer'})
    }
    if (mode === ENUMS.TravelMode.TRAVEL_MODE_WALK) {
        evt.dispatch(ENUMS.Event.SET_CAMERA_MODE, {mode:'game_travel'})
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