import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";
import {notifyCameraStatus} from "../../3d/camera/CameraFunctions.js";
import {Vector3} from "../../../libs/three/math/Vector3.js";
import {CameraStatusProcessor} from "../../application/utils/CameraStatusProcessor.js";

let tempVec = new Vector3()
let tempVec2 = new Vector3();
let cameraStatusProcessor = new CameraStatusProcessor()

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
    actor.getVisualGamePiece().visualPathPoints.updatePathPoints(actor, pathPoints)
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


function processPartyStatus(actor) {
    let partyStatus = actor.getStatus(ENUMS.ActorStatus.REQUEST_PARTY);
    let worldActors = GameAPI.getGamePieceSystem().getActors();
    let playerParty = GameAPI.getGamePieceSystem().playerParty
    if (partyStatus) {
        for (let i = 0; i < worldActors.length; i++) {
            let otherActor = worldActors[i];
            if (otherActor !== actor && playerParty.isMember(otherActor) === false) {
                let compareStatus = otherActor.getStatus(ENUMS.ActorStatus.REQUEST_PARTY);
                if (compareStatus === partyStatus) {
                    if (playerParty.actors.length === 1) {
                        //         GuiAPI.screenText("Party Created")
                    }
                    // console.log("JOIN PARTY: ", playerParty, actor.id)
                    GuiAPI.screenText("PARTY JOINED", ENUMS.Message.HINT, 4);
                    // otherActor.actorText.say("Joining")
                    if (playerParty.isMember(otherActor) === false) {
                        playerParty.addPartyActor(otherActor);
                    }
                }
            }
        }
    }

    for (let i = 0; i < playerParty.actors.length; i++) {
        let otherActor = playerParty.actors[i];
        if (otherActor !== actor && playerParty.isMember(otherActor) === true) {
            if (otherActor !== actor) {
                let activatingEncounterId = otherActor.getStatus(ENUMS.ActorStatus.ACTIVATING_ENCOUNTER);
                if (activatingEncounterId) {

                    let encounter = GameAPI.getWorldEncounterByEncounterId(activatingEncounterId);
                    if (!encounter) {
                        return;
                    }
                    if (encounter.getRequestingActor() !== actor) {
                        GuiAPI.screenText("PARTY ENCOUNTER", ENUMS.Message.HINT, 4);
                        actor.setStatusKey(ENUMS.ActorStatus.PARTY_SELECTED, false);
                        actor.setStatusKey(ENUMS.ActorStatus.REQUEST_PARTY, '');
                        actor.setStatusKey(ENUMS.ActorStatus.ACTIVATING_ENCOUNTER, '');
                        actor.setStatusKey(ENUMS.ActorStatus.TRAVEL_MODE, ENUMS.TravelMode.TRAVEL_MODE_BATTLE);
                    //    actor.actorStatusProcessor.processActorStatus(actor);

                        let onCompleted = function(pos) {
                            actor.setSpatialPosition(pos);

                        //    transition.targetPos.set(0, 0, 0)
                        //    actor.setSpatialVelocity(transition.targetPos);
                            actor.setStatusKey(ENUMS.ActorStatus.IN_COMBAT, true);
                            actor.setStatusKey(ENUMS.ActorStatus.PARTY_SELECTED, false);
                            actor.setStatusKey(ENUMS.ActorStatus.ACTIVATING_ENCOUNTER, "");
                            actor.setStatusKey(ENUMS.ActorStatus.ACTIVATED_ENCOUNTER, encounter.id);
                            actor.setStatusKey(ENUMS.ActorStatus.TRAVEL_MODE, ENUMS.TravelMode.TRAVEL_MODE_BATTLE);
                            notifyCameraStatus(ENUMS.CameraStatus.CAMERA_MODE, ENUMS.CameraControls.CAM_ENCOUNTER, false);
                            actor.actorStatusProcessor.processActorStatus(actor);
                            poolReturn(transition)
                        }

                        let onUpdate = function(pos, vel) {
                            ThreeAPI.getCameraCursor().getLookAroundPoint().copy(pos)
                            actor.setSpatialPosition(pos);
                        //    actor.setSpatialVelocity(vel);
                        }

                        encounter.requestActivationBy(actor);
                        GameAPI.worldModels.deactivateEncounters();


                        let transition = poolFetch('SpatialTransition')
                        transition.targetPos.copy(encounter.getPointInsideActivationRange(actor.getSpatialPosition()));
                        transition.targetPos.x = Math.round(transition.targetPos.x);
                        transition.targetPos.z = Math.round(transition.targetPos.z);
                        transition.initSpatialTransition(actor.actorObj3d.position, transition.targetPos, 2.3, onCompleted, null, null, onUpdate)
                    }
                }
            }
        }
    }

    if (playerParty.isMember(actor)) {

    }

}

function processEncounterStatus(actor) {

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
            cameraStatusProcessor.processCameraStatus(actor)
            registerPathPoints(actor);
            processPartyStatus(actor);
        }
        processAnimationState(actor);
        this.indicateSelectionStatus(actor);
        updatePathPointVisuals(actor);
    }

    clearActorStatus(actor) {
        for (let key in this.indicators) {
            this.detachIndicator(key);
        }
        let pathPoints = actor.getStatus(ENUMS.ActorStatus.PATH_POINTS);
        MATH.emptyArray(pathPoints)
        actor.getVisualGamePiece().visualPathPoints.updatePathPoints(actor, pathPoints)
    }

}

export {ActorStatusProcessor}