
import { Vector3 } from "../../../libs/three/math/Vector3.js";
import { Object3D } from "../../../libs/three/core/Object3D.js";
import * as CursorUtils from "./CursorUtils.js";
import {processLookCursorInput, processTileSelectionCursorInput} from "./CursorUtils.js";


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
let walkForward = new Vector3()

let lookAroundPoint = new Vector3(-885, 0, 530)

let posMod = new Vector3();
let lookAtMod = new Vector3();
let pointerDragVector = new Vector3()
let tpf = 0.01;
let lerpFactor = 0.01;
let pointerActive = false;
let tilePath = null;

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
    deactivateEncounter:'deactivate_encounter',
    gameCombat:'game_combat',
    gameTravel:'game_travel'
}

let applyCamNavPoint = function(lookAtVec, camPosVec, time, camCallback) {

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
    camParams.pos[0] = camPosVec.x;
    camParams.pos[1] = camPosVec.y;
    camParams.pos[2] = camPosVec.z;
    camParams.lookAt[0] = camLookAtVec.x;
    camParams.lookAt[1] = camLookAtVec.y;
    camParams.lookAt[2] = camLookAtVec.z;
    GameAPI.getGameCamera().updatePlayerCamera(camParams)
}

let updateWorldDisplay = function() {

    lookAtMod.x = Math.sin(GameAPI.getGameTime()*0.15)*11
    lookAtMod.z = Math.cos(GameAPI.getGameTime()*0.15)*11
    lookAtMod.y = 0 // ThreeAPI.terrainAt(cursorObj3d.position)+2
    camPosVec.copy(lookAroundPoint);
    camLookAtVec.copy(lookAroundPoint);
    camParams.offsetPos[0] = Math.sin(GameAPI.getGameTime()*0.15)*55
    camParams.offsetPos[1] = 35 + Math.sin(GameAPI.getGameTime()*0.4)*12 + cursorObj3d.position.y
    camParams.offsetPos[2] = Math.cos(GameAPI.getGameTime()*0.18)*55

    camPosVec.x = lookAroundPoint.x + camParams.offsetPos[0] + posMod.x;
    camPosVec.y = lookAroundPoint.y + camParams.offsetPos[1] + posMod.y;
    camPosVec.z = lookAroundPoint.z + camParams.offsetPos[2] + posMod.z;
    camLookAtVec.x = lookAroundPoint.x + camParams.offsetLookAt[0] + lookAtMod.x;
    camLookAtVec.y = lookAroundPoint.y + camParams.offsetLookAt[1] + lookAtMod.y;
    camLookAtVec.z = lookAroundPoint.z + camParams.offsetLookAt[2] + lookAtMod.z;
    dragToVec3.copy( cursorObj3d.position)
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
    walkForward.applyQuaternion(cursorObj3d.quaternion);
    cursorObj3d.position.copy(movedObj3d.position)
    let inputForce = CursorUtils.processTilePathingCamera(tilePath, movedObj3d, calcVec, tempVec3, walkForward)

    lerpFactor = tpf

  //  lerpFactor *=  inputForce*0.001
    lerpFactor = MATH.clamp(lerpFactor, 0.01, 0.05);
   // cursorTravelVec.multiplyScalar(Math.abs(lerpFactor));

    if (tilePath) {
        if (tilePath.pathTiles.length > 1) {
            camLookAtVec.lerp(calcVec, tpf*7);
            camTargetPos.lerp(tempVec3, tpf*2);
        }
    }



 //   camLookAtVec.copy(movedObj3d.position);
}

class CameraSpatialCursor {
    constructor() {
        cursorObj3d.position.copy(lookAroundPoint);
        camParams.mode = camModes.worldDisplay;

        let setCamMode = function(evt) {
            let selectedMode = evt.mode;

            if (selectedMode === camParams.mode) {
                selectedMode = camModes.worldDisplay;
            }

            updateWorldLook()

            movePiecePos.copy(cursorObj3d.position);
            camParams.mode = selectedMode;

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


            if (camParams.mode === camModes.worldViewer) {
                if (released) {
                    lerpFactor = tpf;
                } else {
                    updateWorldLook();

                    let selectedActor = GameAPI.getGamePieceSystem().getSelectedGameActor();

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
                    gameWalkGrid.activateWalkGrid(selectedActor.actorObj3d)
                } else if (released) {
                    navPoint.time = 2;
                    gameWalkGrid.applySelectedPath(updatePathingCamera, pathCompletedCallback)
                    dragToVec3.copy(selectedActor.getVisualGamePiece().getSpatial().getPos())
                } else {
                    let selectedPath = gameWalkGrid.buildGridPath(dragToVec3, selectedActor.getVisualGamePiece().getSpatial().getPos())
                    selectedActor.inspectTilePath(selectedPath)
                }
                updateWalkCamera(gameWalkGrid.getActiveTilePath());
            }

        }

        let setNavPoint = function(event) {

        }

        this.call = {
            setCamMode:setCamMode,
            activePointerUpdate:activePointerUpdate,
            setNavPoint:setNavPoint
        }

    }



    setCursorPosition = function(vec3) {
        cursorObj3d.position.copy(vec3);
    }

    getCursorObj3d = function() {
        return cursorObj3d
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

    getForward() {
        tempVec3.set(0, 0, 1);
        tempVec3.applyQuaternion(cursorObj3d.quaternion);
        return tempVec3;
    }

    updateSpatialCursor = function() {
        let tpf = GameAPI.getFrame().tpf
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
        if (camParams.mode === camModes.worldDisplay) {
            updateWorldDisplay();
            camLookAtVec.copy(cursorObj3d.position)
        //    cursorObj3d.position.copy(camLookAtVec)
        } else {
            CursorUtils.drawInputCursorState(cursorObj3d, dragToVec3, camTargetPos, cursorForward, cursorTravelVec)
            camPosVec.lerp(camTargetPos, tpf ) // + lerpFactor * 2)
        }

        updateCursorFrame();

    //    debugDrawCursor();
    }

}

export { CameraSpatialCursor }