import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";
import {notifyCameraStatus} from "../../3d/camera/CameraFunctions.js";
import {Vector3} from "../../../libs/three/math/Vector3.js";

let tempVec = new Vector3()
let tempVec2 = new Vector3();

function processCameraStatus(actor) {

    actor.getSpatialPosition(ThreeAPI.getCameraCursor().getPos())
    let travelMode = actor.getStatus(ENUMS.ActorStatus.TRAVEL_MODE);

    let statusKey = ENUMS.CameraStatus.CAMERA_MODE;
    let controlKey = ENUMS.CameraControls.CAM_AUTO;

    let partySelected = actor.getStatus(ENUMS.ActorStatus.PARTY_SELECTED);
    let sequencerSelected = actor.getStatus(ENUMS.ActorStatus.SEQUENCER_SELECTED);
    let hasTurn = actor.getStatus(ENUMS.ActorStatus.HAS_TURN);
    let selectedTarget = GameAPI.getActorByIndex(actor.getStatus(ENUMS.ActorStatus.SELECTED_TARGET))

    if (travelMode === ENUMS.TravelMode.TRAVEL_MODE_FLY) {
        controlKey = ENUMS.CameraControls.CAM_ORBIT;
        notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_AHEAD, null)
        notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_SHOULDER, null)
    }

    if (travelMode === ENUMS.TravelMode.TRAVEL_MODE_INACTIVE) {
        controlKey = ENUMS.CameraControls.CAM_AUTO;
    }

    if (travelMode === ENUMS.TravelMode.TRAVEL_MODE_LEAP) {
        controlKey = ENUMS.CameraControls.CAM_MOVE;
        notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_AHEAD, true)
        notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_PARTY, true)
    }

    if (travelMode === ENUMS.TravelMode.TRAVEL_MODE_WALK) {
        let moveControlActive = actor.getControl(ENUMS.Controls.CONTROL_MOVE_ACTION)
        if (partySelected) {
            if (moveControlActive === 1) {
                controlKey = ENUMS.CameraControls.CAM_GRID;
                notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_AHEAD, null)
                notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_HIGH, null)
            } else {
                controlKey = ENUMS.CameraControls.CAM_MOVE;
                notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_AHEAD, null)
                notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_PARTY, null)
            }
        } else {
            controlKey = ENUMS.CameraControls.CAM_GRID;
            notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_AHEAD, null)
            notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_HIGH, null)
        }
    }

    if (travelMode === ENUMS.TravelMode.TRAVEL_MODE_JETPACK) {
        controlKey = ENUMS.CameraControls.CAM_MOVE;
        notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_AHEAD, true)
        notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_PARTY, true)
        notifyCameraStatus( ENUMS.CameraStatus.POINTER_ACTION, ENUMS.CameraControls.CAM_MOVE, null)
    }

    if (travelMode === ENUMS.TravelMode.TRAVEL_MODE_BATTLE) {

        let turnActiveActor = GameAPI.call.getTurnActiveSequencerActor()
        if (!turnActiveActor) {
            return;
        }
        let selectedActor = GameAPI.getActorByIndex(turnActiveActor.getStatus(ENUMS.ActorStatus.SELECTED_TARGET))
        let moveControlActive = actor.getControl(ENUMS.Controls.CONTROL_MOVE_ACTION)
        let partySelected = actor.getStatus(ENUMS.ActorStatus.PARTY_SELECTED)
        if (turnActiveActor !== actor) {
            if (turnActiveActor.getStatus(ENUMS.ActorStatus.SELECTED_TARGET)) {
                controlKey = ENUMS.CameraControls.CAM_ENCOUNTER;
                notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_TARGET, null)
                notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_SHOULDER, null)
            } else {
                controlKey = ENUMS.CameraControls.CAM_GRID;
                notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_AHEAD, null)
                notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_HIGH, null)
            }

        } else {

            if (selectedActor) {
                if (selectedActor !== turnActiveActor) {

                    if (moveControlActive === 1) {
                        controlKey = ENUMS.CameraControls.CAM_GRID;
                        notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_AHEAD, null)
                        if (partySelected) {
                            notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_PARTY, null)
                        } else {
                            notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_HIGH, null)
                        }

                    } else {
                        controlKey = ENUMS.CameraControls.CAM_ENCOUNTER;
                        if (partySelected) {
                            notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_TARGET, null)
                            notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_SHOULDER, null)
                        } else {
                            notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_AHEAD, null)
                            notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_PARTY, null)
                        }


                    }

                } else {

                    if (partySelected) {

                        if (moveControlActive === 1) {
                            controlKey = ENUMS.CameraControls.CAM_GRID;
                            notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_TARGET, null)
                            notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_PARTY, null)
                        } else {
                            controlKey = ENUMS.CameraControls.CAM_MOVE;
                            notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_AHEAD, null)
                            notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_PARTY, null)
                        }

                    } else {

                        if (moveControlActive === 1) {
                            controlKey = ENUMS.CameraControls.CAM_GRID;
                            notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_TARGET, null)
                            notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_HIGH, null)
                        } else {
                            controlKey = ENUMS.CameraControls.CAM_GRID;
                            notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_AHEAD, null)
                            notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_HIGH, null)
                        }

                    }

                }

            } else {

                let partySelected = actor.getStatus(ENUMS.ActorStatus.PARTY_SELECTED)
                if (partySelected) {

                    if (moveControlActive === 1) {
                        controlKey = ENUMS.CameraControls.CAM_GRID;
                        notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_AHEAD, null)
                        notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_PARTY, null)
                    } else {
                        controlKey = ENUMS.CameraControls.CAM_MOVE;
                        notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_AHEAD, null)
                        notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_PARTY, null)
                    }

                } else {
                    controlKey = ENUMS.CameraControls.CAM_GRID;
                    if (selectedActor) {
                        notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_TARGET, null)
                    } else {
                        notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_AHEAD, null)
                    }

                    notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_HIGH, null)
                }
            }
        }



    }

    notifyCameraStatus( statusKey, controlKey, null)

}

function registerPathPoints(actor) {
    let pathPoints = actor.getStatus(ENUMS.ActorStatus.PATH_POINTS);

    MATH.emptyArray(pathPoints);

    let walkGrid = actor.getGameWalkGrid();
    let pathTiles = walkGrid.getActivePathTiles();

    if (pathTiles.length > 1) {
        for (let i = 0; i < pathTiles.length; i++) {
            let pathPoint = pathTiles[i].pathPoint;
            pathPoints[i] = pathPoint.point;
        }
    }
}

function updatePathPointVisuals(actor) {
    let pathPoints = actor.getStatus(ENUMS.ActorStatus.PATH_POINTS);
    tempVec.copy(actor.getSpatialPosition());
        for (let i = 0; i < pathPoints.length; i++) {
            let pathPoint = pathPoints[i];
            MATH.vec3FromArray(tempVec2, pathPoint)
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:tempVec2, color:'WHITE', size:0.3});
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:tempVec, to:tempVec2, color:'WHITE', drawFrames:4});
            tempVec.copy(tempVec2);
    }

}


function processAnimationState(actor) {

    let isLeaping = actor.getStatus(ENUMS.ActorStatus.IS_LEAPING)
    if (isLeaping) {
        actor.setStatusKey(ENUMS.ActorStatus.MOVE_STATE, 'STAND_COMBAT')
        actor.setStatusKey(ENUMS.ActorStatus.BODY_STATE, 'DISENGAGING')
    } else {
        if (actor.getStatus(ENUMS.ActorStatus.IN_COMBAT)) {
            actor.setStatusKey(ENUMS.ActorStatus.MOVE_STATE, 'MOVE_COMBAT')
            actor.setStatusKey(ENUMS.ActorStatus.STAND_STATE, 'STAND_COMBAT')
            actor.setStatusKey(ENUMS.ActorStatus.BODY_STATE, 'ENGAGING')
        } else {
            actor.setStatusKey(ENUMS.ActorStatus.MOVE_STATE, 'MOVE')
            actor.setStatusKey(ENUMS.ActorStatus.STAND_STATE, 'IDLE_LEGS')
            actor.setStatusKey(ENUMS.ActorStatus.BODY_STATE, 'IDLE_HANDS')
        }
    }

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
        this.indicators[indicatorKey] = poolFetch('VisualIndicator');
        this.indicators[indicatorKey].indicateActor(actor, spriteX, spriteY, spin, scale, pulsate, rate)
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
            registerPathPoints(actor)
        }
        processAnimationState(actor);
        this.indicateSelectionStatus(actor);
        updatePathPointVisuals(actor);
    }

    clearActorStatus(actor) {
        for (let key in this.indicators) {
            this.detachIndicator(key);
        }
    }

}

export {ActorStatusProcessor}