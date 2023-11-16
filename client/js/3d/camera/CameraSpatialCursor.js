
import { Vector3 } from "../../../libs/three/math/Vector3.js";
import { Object3D } from "../../../libs/three/core/Object3D.js";
import * as CursorUtils from "./CursorUtils.js";
import {viewEncounterSelection} from "./CameraFunctions.js";


let calcVec = new Vector3()
let tempVec3 = new Vector3();
let walkDirVec = new Vector3();
let cursorObj3d = new Object3D()
let movePiecePos = new Vector3();
let dragFromVec3 = new Vector3();
let dragToVec3 = new Vector3();
let camTargetPos = new Vector3();
let camPosVec = new Vector3();
let camLookAtVec = new Vector3();
let cursorTravelVec = new Vector3();
let cursorForward = new Vector3();
let walkForward = new Vector3();
let viewTargetPos = new Vector3();
let zoomDistance = 15;
let actorQuat = null;

let lookAroundPoint = new Vector3(-865, 0, 540)

let posMod = new Vector3();
let lookAtMod = new Vector3();
let pointerDragVector = new Vector3()
let tpf = 0.01;
let lerpFactor = 0.01;
let pointerActive = false;
let tilePath = null;

let focusObj3d = null;
let camHomePos = null;

let navPoint = {
    time:0.8,
    pos: [0, 5, -14],
    lookAt: [0, 1, 0]
}

let camParams = {
    camCallback : function() {},
    mode : null,
    pos : [0, 0, 0],
    lookAt :[0, 0, 0],
    offsetPos : [0, 0, 0],
    offsetLookAt : [0, 0, 0]
}

let camModes = {
    worldDisplay:'world_display',
    worldViewer:'world_viewer',
    activateEncounter:'activate_encounter',
    actorTurnMovement:'actor_turn_movement',
    deactivateEncounter:'deactivate_encounter',
    gameCombat:'game_combat',
    gameTravel:'game_travel',
    gameVehicle:'game_vehicle'
}

let applyCamNavPoint = function(lookAtVec, camPosVec, time, camCallback) {

}

let setFocusObj3d = function(obj3d) {
    focusObj3d = obj3d;
}

let debugDrawCursor = function() {
    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:cursorObj3d.position, color:'CYAN', size:0.5})
    calcVec.copy(cursorObj3d.position);
    calcVec.y = ThreeAPI.terrainAt(calcVec, tempVec3);
    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:calcVec, color:'GREEN', size:0.5})
    tempVec3.add(calcVec);
    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:calcVec, to:tempVec3, color:'YELLOW'});
}

let updateCursorFrame = function() {
    camParams.pos[0] = camPosVec.x + posMod.x;
    camParams.pos[1] = camPosVec.y + posMod.y;
    camParams.pos[2] = camPosVec.z + posMod.z;
    camParams.lookAt[0] = camLookAtVec.x + lookAtMod.x;
    camParams.lookAt[1] = camLookAtVec.y + lookAtMod.y;
    camParams.lookAt[2] = camLookAtVec.z + lookAtMod.z;
    GameAPI.getGameCamera().updatePlayerCamera(camParams)
}

let updateWorldDisplay = function() {
    let offsetFactor = MATH.curveQuad(zoomDistance*0.75)

    lookAtMod.x = Math.sin(GameAPI.getGameTime()*0.15)*offsetFactor*0.2
    lookAtMod.z = Math.cos(GameAPI.getGameTime()*0.15)*offsetFactor*0.2
    lookAtMod.y = 0 // ThreeAPI.terrainAt(cursorObj3d.position)+2
//    camPosVec.copy(lookAroundPoint);
//    camLookAtVec.copy(lookAroundPoint);
    //    lookAroundPoint.y = ThreeAPI.terrainAt(lookAroundPoint) ;
    cursorObj3d.position.copy(lookAroundPoint);
   cursorObj3d.position.y = ThreeAPI.terrainAt(lookAroundPoint);


    camParams.offsetPos[0] = Math.sin(GameAPI.getGameTime()*0.15)*offsetFactor
    camParams.offsetPos[1] = offsetFactor*0.4 + zoomDistance*0.3 + Math.sin(GameAPI.getGameTime()*0.4)*zoomDistance*0.25
    camParams.offsetPos[2] = Math.cos(GameAPI.getGameTime()*0.18)*offsetFactor


    tempVec3.x = lookAroundPoint.x + camParams.offsetPos[0]
    tempVec3.y = lookAroundPoint.y + camParams.offsetPos[1]
    tempVec3.z = lookAroundPoint.z + camParams.offsetPos[2]
    camTargetPos.lerp(tempVec3, 0.01)
    camPosVec.lerp(tempVec3, 0.02)

    tempVec3.y = cursorObj3d.position.y + 1.5;
    tempVec3.x = lookAroundPoint.x + camParams.offsetLookAt[0]
    tempVec3.z = lookAroundPoint.z + camParams.offsetLookAt[2]
    camLookAtVec.lerp(tempVec3, 0.05)
    dragToVec3.copy( cursorObj3d.position)
}

let updateEncounterActivate = function() {
    let selectedActor = GameAPI.getGamePieceSystem().getSelectedGameActor();
    let actorPos = selectedActor.getPos();
    lerpFactor = tpf*2
    calcVec.copy(viewTargetPos);
    calcVec.sub(actorPos);
    calcVec.multiplyScalar(0.8);
    tempVec3.addVectors(actorPos, calcVec);
    camLookAtVec.lerp(tempVec3, lerpFactor);

    camPosVec.lerp(camHomePos, lerpFactor*2)
}

let updateActorTurnMovement = function() {
    let selectedActor = GameAPI.getGamePieceSystem().getSelectedGameActor();
    let actorPos = selectedActor.getPos();

    calcVec.set(0, 0, 1)
    calcVec.applyQuaternion(focusObj3d.quaternion);
    calcVec.add(focusObj3d.position);
    calcVec.sub(actorPos);
    lerpFactor = tpf*2.5 + Math.clamp( tpf * 2 * (5 / calcVec.length()), 0, tpf*2);

    calcVec.multiplyScalar(0.8);
    tempVec3.addVectors(actorPos, calcVec);
    camLookAtVec.lerp(tempVec3, lerpFactor);

    cursorObj3d.position.copy(camLookAtVec);
 //   calcVec.multiplyScalar(-1.1);
 //   tempVec3.addVectors(actorPos, calcVec);
 //   tempVec3.y += calcVec.length()*2;
    camPosVec.lerp(camHomePos, lerpFactor*2)
}

let updateWorldLook = function() {

  //  tempVec3.set(0, 0, 5)
   // tempVec3.applyQuaternion(cursorObj3d.quaternion);

    let inputAngle = CursorUtils.processLookCursorInput(cursorObj3d, dragToVec3, camTargetPos, cursorForward, cursorTravelVec)
//    CursorUtils.drawInputCursorState(cursorObj3d, dragToVec3, camTargetPos, cursorForward, cursorTravelVec)
    let inputForce = cursorTravelVec.lengthSq();

    lerpFactor = tpf
    let directionalGain = Math.cos(inputAngle)

    if (inputForce > 5 * directionalGain) {
        lerpFactor *=  inputForce*0.001
        lerpFactor = MATH.clamp(lerpFactor, 0.01, 0.05);
        lerpFactor *= directionalGain*directionalGain // -1;
        cursorTravelVec.multiplyScalar(Math.abs(lerpFactor));
        cursorObj3d.position.add(cursorTravelVec);
    }

    camLookAtVec.copy(cursorObj3d.position)
    camLookAtVec.y += 1;

    // camLookAtVec.lerp(cursorObj3d.position, tpf + lerpFactor * lerpFactor * 3)

}

let updateOrbitPointerCameraInput = function(pointer) {
    if (pointer.isLongPress) {
        console.log(pointer)
        zoomDistance = MATH.clamp(zoomDistance + pointerDragVector.z, 6,30);
    } else {
        CursorUtils.processOrbitCursorInput(cursorObj3d, dragToVec3, camTargetPos, cursorForward, pointerDragVector)
    }

    CursorUtils.drawInputCursorState(cursorObj3d, dragToVec3, camTargetPos, cursorForward, cursorTravelVec)
    lerpFactor = tpf*2.5
    camPosVec.lerp(camTargetPos, lerpFactor*1.2)
    camLookAtVec.lerp(camTargetPos, lerpFactor*1.5)
    tempVec3.set(0, 1, 0);
  //  tempVec3.applyQuaternion(actorQuat);
    ThreeAPI.getCamera().up.lerp(tempVec3, tpf*1.5);
}

let updateWalkCamera = function(activeTilePath) {

  //  walkDirVec.normalize();


    let inputAngle = CursorUtils.processTileSelectionCursorInput(activeTilePath, cursorObj3d, calcVec, dragToVec3, tempVec3, cursorForward, cursorTravelVec)
//    CursorUtils.drawInputCursorState(cursorObj3d, dragToVec3, tempVec3, cursorForward, cursorTravelVec)

    let inputForce = cursorTravelVec.lengthSq();

    lerpFactor = tpf
    let directionalGain = Math.cos(inputAngle)

    if (inputForce > 5 * directionalGain) {
        lerpFactor *=  inputForce*0.001
        lerpFactor = MATH.clamp(lerpFactor, 0.01, 0.05);
        // lerpFactor *= directionalGain*directionalGain // -1;
        cursorTravelVec.multiplyScalar(Math.abs(lerpFactor));
    //    cursorObj3d.position.add(cursorTravelVec);
    }

            if (activeTilePath) {
                if (activeTilePath.pathTiles.length > 1) {
            camLookAtVec.lerp(calcVec, tpf*4);
            camTargetPos.lerp(tempVec3, tpf*2);
        }
    }



}

let updateTileSelectorActive = function(actor, tileSelector) {

    let targetDistance = 8;
    let targetElevation = 2;
    tempVec3.set(0, 0, -targetDistance);
    tempVec3.applyQuaternion(cursorObj3d.quaternion);
    tempVec3.add(cursorObj3d.position);
    cursorObj3d.position.copy(actor.getPos());
    calcVec.copy(tileSelector.translation);
    calcVec.multiplyScalar(0.5);
    cursorObj3d.position.add(calcVec);
    let distance = MATH.clamp(tileSelector.translation.length(), 1, 20);
    tempVec3.y += targetElevation + distance * 2
    cursorObj3d.position.y += 2 / distance;
    MATH.lerpClamped(camPosVec, tempVec3, tpf*distance, 0.05, 0.5);

    if (tileSelector.hasValue()) {

        calcVec.copy(camLookAtVec)
        MATH.lerpClamped(camLookAtVec, cursorObj3d.position, tpf*distance, 0.05, 0.5);
        cursorObj3d.position.copy(camLookAtVec);
        calcVec.sub(camLookAtVec);
        camPosVec.sub(calcVec)
    }

}


let modeHistory = [];

let camCB = function() {
    cursorObj3d.position.x = navPoint.lookAt[0];
    cursorObj3d.position.y = navPoint.lookAt[1];
    cursorObj3d.position.z = navPoint.lookAt[2];
}

let pathCompletedCallback = function(movedObj3d) {
    cursorObj3d.position.copy(movedObj3d.position)
    cursorObj3d.quaternion.copy(movedObj3d.quaternion)
}

let updatePathingCamera = function(tilePath, movedObj3d) {

    walkForward.set(0, 0, 1);
    walkForward.applyQuaternion(movedObj3d.quaternion);
    cursorObj3d.position.copy(movedObj3d.position)
    let inputForce = CursorUtils.processTilePathingCamera(tilePath, movedObj3d, calcVec, tempVec3, walkForward)

    lerpFactor = tpf

  //  lerpFactor *=  inputForce*0.001
    lerpFactor = MATH.clamp(lerpFactor, 0.01, 0.05);
   // cursorTravelVec.multiplyScalar(Math.abs(lerpFactor));

    if (tilePath) {
        if (tilePath.pathTiles.length > 1) {
            camLookAtVec.lerp(calcVec, tpf*7);
            camTargetPos.lerp(tempVec3, tpf*7);
        }
    }



 //   camLookAtVec.copy(movedObj3d.position);
}

class CameraSpatialCursor {
    constructor() {
        cursorObj3d.position.copy(lookAroundPoint);
        camPosVec.copy(lookAroundPoint);
        camParams.mode = camModes.worldDisplay;

        let setCamMode = function(evt) {
            let selectedMode = evt.mode;

            if (evt.pos) {
                viewTargetPos.copy(evt.pos);
                lookAroundPoint.copy(evt.pos);
            }

            if (evt.obj3d) {
                setFocusObj3d(evt.obj3d)
                camLookAtVec.copy(evt.obj3d.position)
            }

            if (evt.camPos) {
                camHomePos = evt.camPos;
            }

            updateWorldLook()

            movePiecePos.copy(cursorObj3d.position);
            camParams.mode = selectedMode;

            let selectedActor = GameAPI.getGamePieceSystem().getSelectedGameActor();

            if (selectedActor) {
                actorQuat = selectedActor.actorObj3d.quaternion
            }

            console.log(evt, camParams.mode);
        }



        let activePointerUpdate = function(pointer, isFirstPressFrame, released) {
            pointerActive = true;
            if (isFirstPressFrame) {
            //    ThreeAPI.copyCameraLookAt(cursorObj3d.position)
                camPosVec.copy(ThreeAPI.getCamera().position);
                dragToVec3.copy( cursorObj3d.position)
                //cursorObj3d.position.copy(lookAroundPoint);
            }
            dragFromVec3.copy(cursorObj3d.position);
            pointerDragVector.x = -pointer.dragDistance[0] * 0.1;
            pointerDragVector.y = 0;
            pointerDragVector.z = -pointer.dragDistance[1] * 0.1;

            dragToVec3.copy(pointerDragVector)
            dragToVec3.applyQuaternion(cursorObj3d.quaternion);
            dragToVec3.add(cursorObj3d.position)

            let selectedActor = GameAPI.getGamePieceSystem().getSelectedGameActor();


            if (camParams.mode === camModes.worldDisplay) {
            //    updateOrbitPointerCameraInput(pointer)
            }

            if (camParams.mode === camModes.worldViewer) {
                if (released) {
                    lerpFactor = tpf;
                } else {

                    updateWorldLook();



                    if (selectedActor) {
                        selectedActor.getPos().copy(cursorObj3d.position)
                    //    cursorObj3d.position.copy(selectedActor.actorObj3d.position);
                    }

                }
            }

            if (camParams.mode === camModes.gameTravel) {
                navPoint.callback = null;

                let selectedActor = GameAPI.getGamePieceSystem().getSelectedGameActor();

                if (!selectedActor) {
                    return;
                }

                let gameWalkGrid = selectedActor.getGameWalkGrid()

                cursorObj3d.position.copy(selectedActor.actorObj3d.position);

                if (isFirstPressFrame) {
                    selectedActor.setControlKey(ENUMS.Controls.CONTROL_MOVE_ACTION, 1)

                //    gameWalkGrid.activateWalkGrid(selectedActor.actorObj3d)
                } else if (released) {
                    selectedActor.setControlKey(ENUMS.Controls.CONTROL_MOVE_ACTION, 2)
                    selectedActor.setControlKey(ENUMS.Controls.CONTROL_TILE_X, 0)
                    selectedActor.setControlKey(ENUMS.Controls.CONTROL_TILE_Z, 0)
                } else {

                    let tileSelector = gameWalkGrid.gridTileSelector;
                    selectedActor.setControlKey(ENUMS.Controls.CONTROL_TILE_X, pointerDragVector.x*0.02)
                    selectedActor.setControlKey(ENUMS.Controls.CONTROL_TILE_Z, pointerDragVector.z*0.02)

                //    let selectedPath = gameWalkGrid.buildGridPath(dragToVec3, selectedActor.getVisualGamePiece().getSpatial().getPos())
                //    selectedActor.inspectTilePath(selectedPath)
                }
            //    updateWalkCamera(gameWalkGrid.getActiveTilePath());
            }

            if (camParams.mode === camModes.gameVehicle) {
                let selectedActor = GameAPI.getGamePieceSystem().getSelectedGameActor();

                if (selectedActor) {
                    cursorObj3d.position.copy(selectedActor.getPos())
                }
                updateOrbitPointerCameraInput(pointer)
            }

        }



        let setNavPoint = function(event) {

        }

        this.call = {
            setCamMode:setCamMode,
            activePointerUpdate:activePointerUpdate,
            setNavPoint:setNavPoint,
            setFocusObj3d:setFocusObj3d,
            updatePathingCamera:updatePathingCamera,
            pathCompletedCallback:pathCompletedCallback

        }

    }



    setCursorPosition = function(vec3) {
        cursorObj3d.position.copy(vec3);
    }

    setZoomDistance(value) {
        zoomDistance = value;
    }

    getCursorObj3d = function() {
        return cursorObj3d
    }

    getLookAroundPoint = function() {
        return lookAroundPoint;
    }

    getPos = function() {
        return cursorObj3d.position;
    }

    getCamParams = function() {
        return camParams;
    }

    setPosMod = function(vec3) {
        posMod.copy(vec3);
    };

    setLookAtMod = function(vec3) {
        lookAtMod.copy(vec3);
    }



    setMode = function(mode) {

    }

    getPointAtDistanceAhead(distance) {
        tempVec3.set(0, 0, distance);
        tempVec3.applyQuaternion(cursorObj3d.quaternion);
        tempVec3.add(cursorObj3d.position);
        return tempVec3;
    }


    getLookAtVec3() {
        return camLookAtVec;
    }

    getCamTargetPosVec3() {
        return camTargetPos;
    }

    getForward() {
        tempVec3.set(0, 0, 1);
        tempVec3.applyQuaternion(cursorObj3d.quaternion);
        return tempVec3;
    }

    updateSpatialCursor = function() {
        let tpf = GameAPI.getFrame().avgTpf
        let selectedActor = GameAPI.getGamePieceSystem().getSelectedGameActor();
        tempVec3.set(0, 1, 0);
        ThreeAPI.getCamera().up.lerp(tempVec3, tpf);
        ThreeAPI.copyCameraLookAt(tempVec3);
        tempVec3.y = ThreeAPI.camera.position.y;
        tempVec3.sub(ThreeAPI.camera.position);

        tempVec3.y = cursorObj3d.position.y;
        tempVec3.normalize();

        tempVec3.multiplyScalar(3)
        tempVec3.add(cursorObj3d.position);
        tempVec3.y = cursorObj3d.position.y;

        cursorObj3d.lookAt(tempVec3);
        cursorForward.set(0, 0, 1);
        cursorForward.applyQuaternion(cursorObj3d.quaternion);
    //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:cursorObj3d.position, to:tempVec3, color:'WHITE'});

        cursorTravelVec.subVectors(dragToVec3, cursorObj3d.position);
        cursorTravelVec.y = 0;
    //    cursorTravelVec.add(cursorForward)

        let tileSelector;
        let isTileSelecting = false;
        if (selectedActor) {
            let walkGrid = selectedActor.getGameWalkGrid();
            if (selectedActor.getStatus(ENUMS.ActorStatus.SELECTING_DESTINATION) === 1) {
                tileSelector = walkGrid.gridTileSelector;
                isTileSelecting = tileSelector.hasValue();
        //        selectedActor.actorText.say("Selecting Tiles")
            }
        }

        if (isTileSelecting) {
            updateTileSelectorActive(selectedActor, tileSelector);
        } else {
            if (selectedActor) {
        //        selectedActor.actorText.say(camParams.mode)
            }

            if (camParams.mode === camModes.worldDisplay) {
                updateWorldDisplay();
            //    camLookAtVec.copy(cursorObj3d.position)
                //    cursorObj3d.position.copy(camLookAtVec)
            } else if (camParams.mode === camModes.activateEncounter) {
                updateEncounterActivate();
            } else if (camParams.mode === camModes.actorTurnMovement) {
                updateActorTurnMovement();
            } else if (camParams.mode === camModes.gameVehicle) {

                camLookAtVec.copy(cursorObj3d.position)
                let forward = selectedActor.getForward();
                let distance = MATH.clamp(MATH.distanceBetween(cursorObj3d.position, ThreeAPI.camera.position), 6, 20)
                forward.multiplyScalar(0.5 + MATH.curveSqrt(distance * 0.5 + selectedActor.getStatus(ENUMS.ActorStatus.STATUS_SPEED) * 4))
                camLookAtVec.add(forward);
                cursorObj3d.lookAt(ThreeAPI.camera.position)
                camTargetPos.copy(cursorObj3d.position)
                tempVec3.set(0, 0, distance);
                tempVec3.applyQuaternion(ThreeAPI.camera.quaternion);

                camTargetPos.add(tempVec3)
                camTargetPos.y += (distance * (4 - tempVec3.y) * (tpf + Math.abs(selectedActor.getStatus(ENUMS.ActorStatus.STATUS_CLIMB_RATE))));
                camPosVec.lerp(camTargetPos, tpf * 1) // + lerpFactor * 2)

                // + lerpFactor * 2)
                //    camPosVec.y = camLookAtVec.y+8;
                //    MATH.randomVector(tempVec3)

                tempVec3.set(0, 1, 0);
                tempVec3.applyQuaternion(actorQuat);
                ThreeAPI.getCamera().up.lerp(tempVec3, tpf - 0.2 * tpf * Math.abs(selectedActor.getControl(ENUMS.Controls.CONTROL_ROLL)));
                //let camQuat = ThreeAPI.getCamera().quaternion;
                //camQuat.slerp(actorQuat, 0.5);
                //    updateActorTurnMovement();
            } else if (camParams.mode === camModes.gameTravel) {
            //    camPosVec.lerp(camTargetPos, tpf * 4 ) // + lerpFactor * 2)

                if (!selectedActor) return;

                if (selectedActor.getStatus(ENUMS.ActorStatus.SELECTED_TARGET)) {
                    viewEncounterSelection(camTargetPos, camLookAtVec, tpf)
                    camPosVec.lerp(camTargetPos, tpf * 8 )
                } else {
                    let forward = selectedActor.getForward();
                    let distance = MATH.clamp(MATH.distanceBetween(selectedActor.actorObj3d.position, ThreeAPI.camera.position), 2, 6)
                    forward.multiplyScalar(3 + selectedActor.getStatus(ENUMS.ActorStatus.STATUS_SPEED)*10)
                    tempVec3.addVectors(forward, selectedActor.actorObj3d.position);
                    cursorObj3d.position.lerp(tempVec3, tpf*4)
                    camLookAtVec.lerp(cursorObj3d.position, tpf*2.5);
                    forward.multiplyScalar(-(1+distance*0.3));
                    tempVec3.addVectors(forward, selectedActor.actorObj3d.position);
                    tempVec3.y += 1 + distance;
                    camTargetPos.copy(tempVec3)
                    camPosVec.lerp(camTargetPos, tpf * 2) // + lerpFactor * 2)
                }

            } else {
                viewEncounterSelection(camTargetPos, camLookAtVec, tpf)
                CursorUtils.drawInputCursorState(cursorObj3d, dragToVec3, camTargetPos, cursorForward, cursorTravelVec)
                camPosVec.lerp(camTargetPos, tpf * 4 ) // + lerpFactor * 2)
            }
        }


        updateCursorFrame();

    //    debugDrawCursor();
    }

}

export { CameraSpatialCursor }