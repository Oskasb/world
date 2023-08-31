
import { Vector3 } from "../../../libs/three/math/Vector3.js";
import { Object3D } from "../../../libs/three/core/Object3D.js";

let calcVec = new Vector3()
let tempVec3 = new Vector3();
let cursorObj3d = new Object3D()
let dragFromVec3 = new Vector3();
let dragToVec3 = new Vector3();
let camPosVec = new Vector3();

let posMod = new Vector3();
let lookAtMod = new Vector3();
let pointerDragVector = new Vector3()

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

let debugDrawCursor = function() {
    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:cursorObj3d.position, color:'CYAN', size:0.5})
    calcVec.copy(cursorObj3d.position);
    calcVec.y = ThreeAPI.terrainAt(calcVec, tempVec3);
    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:calcVec, color:'GREEN', size:0.5})
    tempVec3.add(calcVec);
    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:calcVec, to:tempVec3, color:'YELLOW'});
}

let updateCursorFrame = function() {
    let cursorPos = cursorObj3d.position
    camParams.pos[0] = cursorPos.x + camParams.offsetPos[0] + posMod.x;
    camParams.pos[1] = cursorPos.y + camParams.offsetPos[1] + posMod.y;
    camParams.pos[2] = cursorPos.z + camParams.offsetPos[2] + posMod.z;
    camParams.lookAt[0] = cursorPos.x + camParams.offsetLookAt[0] + lookAtMod.x;
    camParams.lookAt[1] = cursorPos.y + camParams.offsetLookAt[1] + lookAtMod.y;
    camParams.lookAt[2] = cursorPos.z + camParams.offsetLookAt[2] + lookAtMod.z;

    cursorPos.x = camParams.lookAt[0]
    cursorPos.y = camParams.lookAt[1]
    cursorPos.z = camParams.lookAt[2]

}

let updateWorldDisplay = function() {
    cursorObj3d.position.x = Math.sin(GameAPI.getGameTime()*0.045)*420
    cursorObj3d.position.z = Math.cos(GameAPI.getGameTime()*0.055)*420
    cursorObj3d.position.y = ThreeAPI.terrainAt(cursorObj3d.position)+2
    camParams.offsetPos[0] = Math.sin(GameAPI.getGameTime()*0.3)*22
    camParams.offsetPos[1] = 16 + Math.sin(GameAPI.getGameTime())*11 + ThreeAPI.terrainAt(cursorObj3d.position)
    camParams.offsetPos[2] = Math.cos(GameAPI.getGameTime()*0.3)*22
    GameAPI.getGameCamera().updatePlayerCamera(camParams)
}

let updateWorldLook = function() {

    tempVec3.copy(cursorObj3d.position);
    tempVec3.y = ThreeAPI.terrainAt(tempVec3);
    dragToVec3.y = ThreeAPI.terrainAt(dragToVec3, calcVec);
    camPosVec.subVectors(dragToVec3, tempVec3)
    camPosVec.multiplyScalar(-2);
  //  posMod.copy(camPosVec);

    camParams.offsetPos[0] = camPosVec.x;
    camParams.offsetPos[1] = camPosVec.y;
    camParams.offsetPos[2] = camPosVec.z;

    camPosVec.add(tempVec3);
    calcVec.add(dragToVec3);

    //camParams.pos[0] = camPosVec.x
    //camParams.pos[1] = cursorPos.y
    //camParams.pos[2] = camPosVec.z

    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:tempVec3, to:dragToVec3, color:'CYAN'});
    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:dragToVec3, to:calcVec, color:'YELLOW'});
    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:dragToVec3, color:'CYAN', size:0.3})

    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:tempVec3, to:camPosVec, color:'RED'});
 //   tempVec3.add(dragFromVec3);
 //   cursorObj3d.position.copy(tempVec3);
 //   camParams.offsetLookAt[0] = pointerDragVector.x
 //   camParams.offsetLookAt[2] = pointerDragVector.yz

    cursorObj3d.position.y = ThreeAPI.terrainAt(cursorObj3d.position)+2
 //   camParams.offsetPos[0] = Math.sin(GameAPI.getGameTime()*0.3)*22
    camParams.offsetPos[1] = 16 + Math.sin(GameAPI.getGameTime())*11 + ThreeAPI.terrainAt(cursorObj3d.position)
 //   camParams.offsetPos[2] = Math.cos(GameAPI.getGameTime()*0.3)*22


}

let modeHistory = [];

let camCB = function() {
    cursorObj3d.position.x = navPoint.lookAt[0];
    cursorObj3d.position.y = navPoint.lookAt[1];
    cursorObj3d.position.z = navPoint.lookAt[2];
}

class CameraSpatialCursor {
    constructor() {
        camParams.mode = camModes.worldDisplay;

        let setCamMode = function(evt) {
            let selectedMode = evt.mode;
            if (selectedMode === camParams.mode) {
                selectedMode = modeHistory.pop();
            } else {
                modeHistory.push(camParams.mode);
            }

            camParams.mode = selectedMode;
            console.log(evt, camParams.mode);
        }



        let activePointerUpdate = function(pointer, isFirstPressFrame) {
            if (isFirstPressFrame) {
                ThreeAPI.copyCameraLookAt(cursorObj3d.position)
                dragFromVec3.copy(cursorObj3d.position);
            }
            pointerDragVector.x = -pointer.dragDistance[0] * 0.1;
            pointerDragVector.y = 0;
            pointerDragVector.z = -pointer.dragDistance[1] * 0.1;

            dragToVec3.copy(pointerDragVector)
            dragToVec3.applyQuaternion(cursorObj3d.quaternion);
            dragToVec3.add(cursorObj3d.position)

            navPoint.callback = camCB;
            navPoint.pos = camParams.pos;
            navPoint.lookAt[0] = dragToVec3.x //-dragFromVec3.x;
            navPoint.lookAt[1] = dragToVec3.y //-dragFromVec3.y;
            navPoint.lookAt[2] = dragToVec3.z //-dragFromVec3.z;
            evt.dispatch(ENUMS.Event.SET_CAMERA_TARGET, navPoint);

        }

        this.call = {
            setCamMode:setCamMode,
            activePointerUpdate:activePointerUpdate
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

        ThreeAPI.copyCameraLookAt(tempVec3);
        tempVec3.sub(ThreeAPI.camera.position);

        tempVec3.y = cursorObj3d.position.y;
        tempVec3.normalize();
        tempVec3.multiplyScalar(3)
        tempVec3.add(cursorObj3d.position);

        cursorObj3d.lookAt(tempVec3);

        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:cursorObj3d.position, to:tempVec3, color:'WHITE'});

        if (camParams.mode === camModes.worldDisplay) {
            updateWorldDisplay();
        }

        if (camParams.mode === camModes.worldViewer) {
            updateWorldLook();
        }

        updateCursorFrame();

    //    debugDrawCursor();
    }

}

export { CameraSpatialCursor }