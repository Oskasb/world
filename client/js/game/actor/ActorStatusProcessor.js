import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";
import {notifyCameraStatus} from "../../3d/camera/CameraFunctions.js";

function processCameraStatus(actor) {
    let travelMode = actor.getStatus(ENUMS.ActorStatus.TRAVEL_MODE);

    let statusKey = ENUMS.CameraStatus.CAMERA_MODE;
    let controlKey = ENUMS.CameraControls.CAM_AUTO;

    let partySelected = actor.getStatus(ENUMS.ActorStatus.PARTY_SELECTED);
    let sequencerSelected = actor.getStatus(ENUMS.ActorStatus.SEQUENCER_SELECTED);
    let hasTurn = actor.getStatus(ENUMS.ActorStatus.HAS_TURN);
    let selectedTarget = actor.getStatus(ENUMS.ActorStatus.SELECTED_TARGET);

    if (travelMode === ENUMS.TravelMode.TRAVEL_MODE_FLY) {
        controlKey = ENUMS.CameraControls.CAM_ORBIT;
    }

    if (travelMode === ENUMS.TravelMode.TRAVEL_MODE_INACTIVE) {
        controlKey = ENUMS.CameraControls.CAM_AUTO;
    }

    if (travelMode === ENUMS.TravelMode.TRAVEL_MODE_WALK) {


        if (partySelected) {
            controlKey = ENUMS.CameraControls.CAM_MOVE;
            notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_AHEAD, null)
            notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_PARTY, null)
        } else {
            controlKey = ENUMS.CameraControls.CAM_GRID;
            notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_AHEAD, null)
            notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_HIGH, null)
        }

    }

    if (travelMode === ENUMS.TravelMode.TRAVEL_MODE_JETPACK) {
        controlKey = ENUMS.CameraControls.CAM_AUTO;
    }

    if (travelMode === ENUMS.TravelMode.TRAVEL_MODE_BATTLE) {
        controlKey = ENUMS.CameraControls.CAM_AUTO;
    }

    notifyCameraStatus( statusKey, controlKey, null)

}

class ActorStatusProcessor {
    constructor() {
        this.indicators = {};
        this.actorIndicator = null;
        this.partySelectIndicator = null;
        this.sequencerSelectIndicator = null;
        this.turnActiveIndicator = null;
    }

    attachIndicator(indicatorKey, actor, spriteX, spriteY, spin, scale, pulsate, rate) {
        let alignment = actor.getStatus(ENUMS.ActorStatus.ALIGNMENT) || 'NEUTRAL'
        this.indicators[indicatorKey] = poolFetch('VisualIndicator');
        this.indicators[indicatorKey].indicateActor(actor, alignment, spriteX, spriteY, spin, scale, pulsate, rate)
    }

    detachIndicator(indicatorKey) {
        let indicator = this.indicators[indicatorKey];
        if (indicator) {
            this.indicators[indicatorKey] = null;
            indicator.removeIndicatorFx()
            poolReturn(indicator);
        }
    }


    indicateSelectionStatus(actor) {

        if (!this.indicators['actor']) {
            this.attachIndicator('actor', actor, 0, 4)
        }

        if (actor.getStatus(ENUMS.ActorStatus.PARTY_SELECTED)) {
            if (!this.indicators[ENUMS.ActorStatus.PARTY_SELECTED]) {
                this.attachIndicator(ENUMS.ActorStatus.PARTY_SELECTED, actor, 1, 3, 0, 0.85, 0.05, 6)
            }
        } else {
            if (this.indicators[ENUMS.ActorStatus.PARTY_SELECTED]) {
                this.detachIndicator(ENUMS.ActorStatus.PARTY_SELECTED)
            }
        }

        if (actor.getStatus(ENUMS.ActorStatus.SEQUENCER_SELECTED)) {

            if (!this.indicators[ENUMS.ActorStatus.SEQUENCER_SELECTED]) {
                this.attachIndicator(ENUMS.ActorStatus.SEQUENCER_SELECTED, actor, 1, 3, 0, 1.3, 0.07, 8)
            }
        } else {
            if (this.indicators[ENUMS.ActorStatus.SEQUENCER_SELECTED]) {
                this.detachIndicator(ENUMS.ActorStatus.SEQUENCER_SELECTED)
            }
        }

        if (actor.getStatus(ENUMS.ActorStatus.HAS_TURN)) {

            if (!this.indicators[ENUMS.ActorStatus.HAS_TURN]) {
                this.attachIndicator(ENUMS.ActorStatus.HAS_TURN, actor, 0, 6, 0.5, 1.12, 0, 0)
            }
        } else {
            if (this.indicators[ENUMS.ActorStatus.HAS_TURN]) {
                this.detachIndicator(ENUMS.ActorStatus.HAS_TURN)
            }
        }

    }



    processActorStatus(actor) {
        if (actor.isPlayerActor()) {
            processCameraStatus(actor)
        }
        this.indicateSelectionStatus(actor)
    }

    clearActorStatus(actor) {
        for (let key in this.indicators) {
            this.detachIndicator(key);
        }
    }

}

export {ActorStatusProcessor}