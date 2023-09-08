
import { Vector3 } from "../../../libs/three/math/Vector3.js";
import { Object3D } from "../../../libs/three/core/Object3D.js";
import * as CursorUtils from "./CursorUtils.js";
import {processLookCursorInput, processTileSelectionCursorInput} from "./CursorUtils.js";


let calcVec = new Vector3()
let tempVec3 = new Vector3();
let walkDirVec = new Vector3();
let cursorObj3d = new Object3D()
let walkObj3d = new Object3D();
let movePiecePos = new Vector3();
let dragFromVec3 = new Vector3();
let dragToVec3 = new Vector3();
let camTargetPos = new Vector3();
let camPosVec = new Vector3();
let camLookAtVec = new Vector3();
let cursorTravelVec = new Vector3();
let cursorForward = new Vector3();


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

let updateWalkCamera = function() {

  //  walkDirVec.normalize();

    let inputAngle = CursorUtils.processTileSelectionCursorInput(tilePath, cursorObj3d, calcVec, dragToVec3, tempVec3, cursorForward, cursorTravelVec)
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

    camLookAtVec.lerp(calcVec, tpf*4);
    camTargetPos.lerp(tempVec3, tpf*2);

}

let modeHistory = [];

let camCB = function() {
    cursorObj3d.position.x = navPoint.lookAt[0];
    cursorObj3d.position.y = navPoint.lookAt[1];
    cursorObj3d.position.z = navPoint.lookAt[2];
}

let pathCompletedCallback = function(movedObj3d) {
    cursorObj3d.position.copy(movedObj3d.position)
}

let updatePathingCamera = function(movedObj3d) {
    camLookAtVec.copy(movedObj3d.position);
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
                }

            }

            if (camParams.mode === camModes.gameTravel) {
                navPoint.callback = null;
                updateWalkCamera();
                if (isFirstPressFrame) {
                    if (tilePath) {
                        if (tilePath.pathTiles.length) {
                            while (tilePath.pathCompetedCallbacks.length) {
                                tilePath.pathCompetedCallbacks.pop()(walkObj3d)
                            }
                            //    MATH.callAll(tilePath.pathCompetedCallbacks, walkObj3d)
                            //    tilePath.pathCompetedCallbacks.length = 0;
                        }
                    }

                //
                }

                if (released) {
                    navPoint.time = 2;
                    if (tilePath.pathTiles.length) {

                        walkObj3d.position.copy(cursorObj3d.position)
                        GameAPI.processTilePath(tilePath, walkObj3d);
                        tilePath.pathCompetedCallbacks.push(pathCompletedCallback)
                        tilePath.pathingUpdateCallbacks.push(updatePathingCamera);
                    }

                } else {
                    tilePath = GameAPI.getTilePath(cursorObj3d.position, dragToVec3)
                }
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

        if (camParams.mode === camModes.worldDisplay) {
            updateWorldDisplay();
            camLookAtVec.copy(cursorObj3d.position)
            cursorObj3d.position.copy(camLookAtVec)
        } else {
            CursorUtils.drawInputCursorState(cursorObj3d, dragToVec3, camTargetPos, cursorForward, cursorTravelVec)

            camPosVec.lerp(camTargetPos, tpf + lerpFactor * 2)
        }

        updateCursorFrame();

    //    debugDrawCursor();
    }

}

export { CameraSpatialCursor }