import {notifyCameraStatus} from "../../3d/camera/CameraFunctions.js";

class CameraStatusProcessor {
    constructor() {
    }

    processCameraStatus(actor) {

        actor.getSpatialPosition(ThreeAPI.getCameraCursor().getPos())
        let travelMode = actor.getStatus(ENUMS.ActorStatus.TRAVEL_MODE);

        let statusKey = ENUMS.CameraStatus.CAMERA_MODE;
        let controlKey = ENUMS.CameraControls.CAM_AUTO;

        let partySelected = actor.getStatus(ENUMS.ActorStatus.PARTY_SELECTED);
        let sequencerSelected = actor.getStatus(ENUMS.ActorStatus.SEQUENCER_SELECTED);
        let hasTurn = actor.getStatus(ENUMS.ActorStatus.HAS_TURN);
        let selectedTarget = GameAPI.getActorById(actor.getStatus(ENUMS.ActorStatus.SELECTED_TARGET))

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
                    if (selectedTarget) {
                        controlKey = ENUMS.CameraControls.CAM_POINT;
                        notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_TARGET, null)
                        notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_SHOULDER, null)
                    } else {
                        notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_AHEAD, null)
                        notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_HIGH, null)
                    }


                } else {
                    controlKey = ENUMS.CameraControls.CAM_MOVE;
                    if (selectedTarget) {
                        controlKey = ENUMS.CameraControls.CAM_POINT;
                        notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_TARGET, null)
                    } else {
                        notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_AHEAD, null)
                    }
                    notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_PARTY, null)
                }
            } else {
                controlKey = ENUMS.CameraControls.CAM_GRID;
                if (selectedTarget) {
                    controlKey = ENUMS.CameraControls.CAM_POINT;
                    notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_TARGET, null)
                    notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_SHOULDER, null)
                } else {
                    notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_AHEAD, null)
                    notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_HIGH, null)
                }

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
            let selectedActor = GameAPI.getActorById(turnActiveActor.getStatus(ENUMS.ActorStatus.SELECTED_TARGET))
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

}

export { CameraStatusProcessor}