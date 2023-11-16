import {Vector3} from "../../../libs/three/math/Vector3.js";
import * as CursorUtils from "./CursorUtils.js";

let lerpFactor = 0.1;
let tempVec = new Vector3();
let tempVec2 = new Vector3();
let tempVec3 = new Vector3();
let lookAtMod = new Vector3();
let offsetPos = new Vector3();
let camTargetPos = new Vector3()
let cameraTime = 0;
let zoomDistance = 10;
let tpf = 0.02;
let pointerAction ;
let lookAroundPoint;
let cursorObj3d;
let camPosVec;
let camLookAtVec;
let dragToVec3;
let cameraCursor;
let pointerDragVector;
let modeActive;
let lookAtActive;
let lookFromActive;
function updateCamParams(camParams) {
    tpf = camParams.tpf;
    pointerAction = statusActive(camParams, ENUMS.CameraStatus.POINTER_ACTION)
    lookAtActive = statusActive(camParams, ENUMS.CameraStatus.LOOK_AT)
    lookFromActive = statusActive(camParams, ENUMS.CameraStatus.LOOK_FROM)
    modeActive = statusActive(camParams, ENUMS.CameraStatus.CAMERA_MODE)
    lookAroundPoint = camParams.cameraCursor.getLookAroundPoint();
    cursorObj3d = camParams.cameraCursor.getCursorObj3d();
    cameraCursor =  camParams.cameraCursor
    camPosVec = camParams.camPosVec;
    camLookAtVec = camParams.camLookAtVec;
    pointerDragVector = camParams.pointerDragVector;
    dragToVec3 = camParams.dragToVec3;
    zoomDistance = camParams.cameraCursor.getZoomDistance();
}

function notifyCameraStatus(statusKey, controlKey, isActive) {
    evt.camEvt['status_key'] = ENUMS.CameraStatus[statusKey];
    evt.camEvt['control_key'] = ENUMS.CameraControls[controlKey];
    evt.camEvt['activate'] = isActive;
    evt.dispatch(ENUMS.Event.SET_CAMERA_STATUS, evt.camEvt)
}

let side = 1;
let leftOrRight = [1, -1]

function statusActive(camModeParams, controlKey) {
    return camModeParams.statusControls[ENUMS.CameraStatus[controlKey]]['isActive']
}

function viewTileSelect(sequencer) {
    let actor = sequencer.getGameActor()
    let seqTime = sequencer.getSequenceProgress()

    let camHome = GameAPI.call.getActiveEncounter().getEncounterCameraHomePosition()
    camTargetPos.copy(camHome)

    if (seqTime === 0) {
        side = MATH.getRandomArrayEntry(leftOrRight)
        evt.dispatch(ENUMS.Event.SET_CAMERA_MODE, {mode:'actor_turn_movement', obj3d:sequencer.focusAtObj3d, camPos:camTargetPos})
    }

    tempVec.subVectors(actor.getGameWalkGrid().getTargetPosition() , actor.getPos() )

    tempVec.multiplyScalar(seqTime);
    let distance = tempVec.length();
    camTargetPos.y += distance;
    tempVec2.copy(tempVec)
    tempVec.add(actor.getPos())

    actor.prepareTilePath(tempVec)

    tempVec2.multiplyScalar(0.5);
    tempVec2.add(actor.getPos())
    sequencer.focusAtObj3d.position.copy(tempVec2)

}

function viewTargetSelection(sequencer, candidates) {
    let actor = sequencer.getGameActor()
    let seqTime = sequencer.getSequenceProgress()

    tempVec2.set(0, 0, 0)
    let biggestDistance = MATH.distanceBetween(actor.getPos(), candidates[0].getPos());
    let distance = 0;
    for (let i = 0; i < candidates.length; i++) {
        tempVec.copy(candidates[i].getPos())

        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:actor.getPos(), to:tempVec, color:'YELLOW'});
        tempVec.sub(actor.getPos());
        distance = tempVec.length();

        if (biggestDistance < distance) {
            biggestDistance = distance;
        }

        tempVec2.add(tempVec);
    }
    distance = biggestDistance;

    tempVec.copy(tempVec2);

    tempVec2.multiplyScalar((seqTime*0.45+0.05) / candidates.length);
    tempVec2.add(actor.getPos());

    actor.turnTowardsPos(tempVec2)

    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:actor.getPos(), to:tempVec2, color:'WHITE'});
    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:tempVec2, color:'WHITE', size:0.25})
    sequencer.focusAtObj3d.position.copy(tempVec2);
    sequencer.focusAtObj3d.position.y -=0.5;


    let camHome = GameAPI.call.getActiveEncounter().getEncounterCameraHomePosition()

    calcAttackCamPosition(actor, distance*2 + 4, camTargetPos);
    camTargetPos.lerp(camHome,1-MATH.curveSigmoid(seqTime));
   // camTargetPos.y += Math.sin(seqTime * Math.PI*0.5)*5


}

let calcAttackCamPosition = function(actor, distance, storeVec) {
    storeVec.set(side * 0.5, 0.4, -0.5);
    storeVec.normalize();
    storeVec.multiplyScalar(distance);
    storeVec.applyQuaternion(actor.getVisualGamePiece().getQuat())
    storeVec.add(actor.getVisualGamePiece().getCenterMass())
}

let calcShouldCamPosition = function(actor, distance, storeVec) {
    storeVec.set(side * 0.15, 0.5, -0.5);
    storeVec.normalize();
    storeVec.multiplyScalar(distance);
    storeVec.applyQuaternion(actor.getVisualGamePiece().getQuat())
    storeVec.add(actor.getVisualGamePiece().getCenterMass())
}

let calcPositionAhead = function(actor, distance, storeVec) {
    storeVec.set(0, 0, 1);
    storeVec.normalize();
    storeVec.multiplyScalar(distance);
    storeVec.applyQuaternion(actor.getVisualGamePiece().getQuat())
    storeVec.add(actor.getVisualGamePiece().getCenterMass())
}

function viewPrecastAction(sequencer, target) {

    let seqTime = sequencer.getSequenceProgress()
    let actor = sequencer.getGameActor()

    if (actor.isPlayerActor()) {
        calcShouldCamPosition(actor, 3, tempVec);
        tempVec2.copy(target.getVisualGamePiece().getCenterMass())

    } else {
        let distance = MATH.distanceBetween(actor.getPos(), target.getPos())
        calcAttackCamPosition(actor, distance * 2 + 6, tempVec);
        tempVec2.subVectors(target.getPos(), actor.getPos())
        tempVec2.multiplyScalar(0.5);
        tempVec2.add(actor.getPos())
    }

    sequencer.focusAtObj3d.position.lerp(tempVec2, seqTime)
    camTargetPos.lerp(tempVec, seqTime)

}

function viewEncounterSelection(camTPos, camLookAt, tpf) {
    let sequencerSelection = GameAPI.call.getSequencerSelection()
    if (sequencerSelection) {
        tempVec.copy(sequencerSelection.getPos())
        tempVec.y -= 1;
        camLookAt.lerp(tempVec, tpf*4);
    }

    let partySelection = GameAPI.call.getPartySelection()
    if (partySelection) {

        if (!sequencerSelection) {
            calcPositionAhead(partySelection, 6, tempVec)
            camLookAt.lerp(tempVec, tpf);
        }

        partySelection.turnTowardsPos(camLookAt)
        calcShouldCamPosition(partySelection, 6, tempVec)
    //    tempVec.add(partySelection.getPos())

        camTPos.lerp(tempVec, tpf*8);
    }
}



function CAM_AUTO() {



    if (pointerAction) {
        notifyCameraStatus(ENUMS.CameraStatus.POINTER_ACTION, ENUMS.CameraControls.CAM_MOVE, true)
        tempVec.copy(pointerDragVector);
        tempVec.applyQuaternion(cursorObj3d.quaternion);
        tempVec.multiplyScalar(0.1)
        lookAroundPoint.add(tempVec)
    } else {
        notifyCameraStatus(ENUMS.CameraStatus.POINTER_ACTION, ENUMS.CameraControls.CAM_MOVE, false)
    }

    let offsetFactor = MATH.curveQuad(zoomDistance*0.75)
    if (modeActive) {
        cameraTime+= tpf;
        notifyCameraStatus(ENUMS.CameraStatus.CAMERA_MODE, ENUMS.CameraControls.CAM_AUTO, true)
    } else {
        notifyCameraStatus(ENUMS.CameraStatus.CAMERA_MODE, ENUMS.CameraControls.CAM_AUTO, false)
    }

    lookAtMod.x = Math.sin(cameraTime*0.15)*offsetFactor*0.2
    lookAtMod.z = Math.cos(cameraTime*0.15)*offsetFactor*0.2
    lookAtMod.y = 0 // ThreeAPI.terrainAt(cursorObj3d.position)+2
    cursorObj3d.position.copy(lookAroundPoint);
    cursorObj3d.position.y = ThreeAPI.terrainAt(lookAroundPoint);
    offsetPos.x = Math.sin(cameraTime*0.15)*offsetFactor
    offsetPos.y = offsetFactor*0.4 + zoomDistance*0.3 + Math.sin(GameAPI.getGameTime()*0.4)*zoomDistance*0.25
    offsetPos.z = Math.cos(cameraTime*0.18)*offsetFactor

    tempVec3.addVectors(lookAroundPoint, offsetPos)
    camTargetPos.lerp(tempVec3, 0.01)
    camPosVec.lerp(tempVec3, 0.02)

    tempVec3.y = cursorObj3d.position.y + 1.5;
    tempVec3.x = lookAroundPoint.x
    tempVec3.z = lookAroundPoint.z
    camLookAtVec.lerp(tempVec3, 0.05)

}

function CAM_ORBIT() {

    lerpFactor = tpf*2.5;

    if (pointerAction) {
        notifyCameraStatus(ENUMS.CameraStatus.POINTER_ACTION, ENUMS.CameraControls.CAM_MOVE, true)
        CursorUtils.processOrbitCursorInput(cursorObj3d, dragToVec3, offsetPos, cameraCursor.getForward(), pointerDragVector)
        CursorUtils.drawInputCursorState(cursorObj3d, dragToVec3, camTargetPos, cameraCursor.getForward(), camLookAtVec)
    } else {
        offsetPos.set(0, 0, 0)
        notifyCameraStatus(ENUMS.CameraStatus.POINTER_ACTION, ENUMS.CameraControls.CAM_MOVE, false)
    }

    if (modeActive) {
        notifyCameraStatus(ENUMS.CameraStatus.CAMERA_MODE, ENUMS.CameraControls.CAM_ORBIT, true)
        cameraTime+= tpf;
        tempVec.copy(cursorObj3d.position)
        tempVec.y += 1.3;
        camLookAtVec.lerp(tempVec, lerpFactor*1.5)
        tempVec2.copy(camLookAtVec);
        tempVec.set(0, 0, zoomDistance);
        tempVec.applyQuaternion(ThreeAPI.getCamera().quaternion);
        tempVec.add(tempVec2);
        tempVec.add(offsetPos);
        camPosVec.lerp(tempVec, lerpFactor*2.2)

        tempVec3.set(0, 1, 0);
        ThreeAPI.getCamera().up.lerp(tempVec3, tpf*1.5);
    } else {
        notifyCameraStatus(ENUMS.CameraStatus.CAMERA_MODE, ENUMS.CameraControls.CAM_ORBIT, false)
    }



}

function CAM_TARGET() {

}

function CAM_MOVE() {

}

function CAM_AHEAD() {

}

function CAM_SHOULDER() {

}

function CAM_SELECT() {

}

function CAM_PARTY() {

}

function CAM_SEQUENCER() {

}

function CAM_ENCOUNTER() {

}

let CAM_MODES = {
    CAM_AUTO:CAM_AUTO,
    CAM_ORBIT:CAM_ORBIT,
    CAM_TARGET:CAM_TARGET,
    CAM_MOVE:CAM_MOVE,
    CAM_AHEAD:CAM_AHEAD,
    CAM_SHOULDER:CAM_SHOULDER,
    CAM_SELECT:CAM_SELECT,
    CAM_PARTY:CAM_PARTY,
    CAM_SEQUENCER:CAM_SEQUENCER,
    CAM_ENCOUNTER:CAM_ENCOUNTER
}

export {
    updateCamParams,
    viewTileSelect,
    viewTargetSelection,
    viewPrecastAction,
    viewEncounterSelection,
    CAM_MODES

}