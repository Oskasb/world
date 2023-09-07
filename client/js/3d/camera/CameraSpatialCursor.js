
import { Vector3 } from "../../../libs/three/math/Vector3.js";
import { Object3D } from "../../../libs/three/core/Object3D.js";

let calcVec = new Vector3()
let tempVec3 = new Vector3();
let walkDirVec = new Vector3();
let cursorObj3d = new Object3D()
let movePiecePos = new Vector3();
let dragFromVec3 = new Vector3();
let dragToVec3 = new Vector3();
let camPosVec = new Vector3();
let camLookAtVec = new Vector3();
let cursorTravelVec = new Vector3();
let cursorForward = new Vector3();
let dragDirection = new Vector3();

let lookAroundPoint = new Vector3(-885, 0, 530)

let posMod = new Vector3();
let lookAtMod = new Vector3();
let pointerDragVector = new Vector3()

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
    tempVec3.copy(cursorObj3d.position);
    cursorObj3d.position.y = ThreeAPI.terrainAt(cursorObj3d.position)
    tempVec3.y = cursorObj3d.position.y // ThreeAPI.terrainAt(tempVec3);
    dragToVec3.y = tempVec3.y // ThreeAPI.terrainAt(dragToVec3, calcVec)+2;

    calcVec.subVectors(dragToVec3, cursorObj3d.position);
    cursorTravelVec.copy(calcVec);
    dragDirection.copy(calcVec);
    dragDirection.normalize();
    let inputAngle = cursorForward.angleTo(cursorTravelVec);

    let inputForce = calcVec.lengthSq();
    calcVec.multiplyScalar(-2);
    calcVec.add(cursorObj3d.position);
  //  posMod.copy(camPosVec);

    camParams.offsetPos[0] = 0;
    camParams.offsetPos[1] = 2;
    camParams.offsetPos[2] = 0;

    camParams.offsetLookAt[0] = 0;
    camParams.offsetLookAt[1] = 1;
    camParams.offsetLookAt[2] = 0;

    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:tempVec3, to:dragToVec3, color:'CYAN'});
    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:cursorObj3d.position, to:calcVec, color:'RED'});
    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:dragToVec3, color:'CYAN', size:0.3})

 //   evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:tempVec3, to:camPosVec, color:'RED'});

    tempVec3.copy(calcVec);
    calcVec.y = ThreeAPI.terrainAt(cursorObj3d.position) + calcVec.distanceTo(cursorObj3d.position) * 0.5 + 1;

    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:tempVec3, to:calcVec, color:'RED'});
    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:calcVec, color:'RED', size:0.3})

    tempVec3.copy(cursorForward);
    tempVec3.add(dragToVec3);
    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:tempVec3, to:dragToVec3, color:'YELLOW'});
    tempVec3.copy(dragDirection);
    tempVec3.add(dragToVec3);
    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:tempVec3, to:dragToVec3, color:'YELLOW'});

    let tpf = GameAPI.getFrame().tpf
    let lerpFactor = tpf

    if (inputForce > 10 * Math.cos(inputAngle)) {
        lerpFactor *=  inputForce*0.01
        lerpFactor = MATH.clamp(lerpFactor, 0.01, 0.05);
        lerpFactor *= Math.cos(inputAngle) // -1;
        cursorTravelVec.multiplyScalar(Math.abs(lerpFactor));
        cursorObj3d.position.add(cursorTravelVec);
    }

    camLookAtVec.lerp(cursorObj3d.position, tpf + lerpFactor * 3)
    camPosVec.lerp(calcVec, tpf + lerpFactor * 2)
}

let updateWalkCamera = function() {

  //  walkDirVec.normalize();

    tempVec3.copy(movePiecePos);
    tempVec3.y = ThreeAPI.terrainAt(tempVec3);
    movePiecePos.y = tempVec3.y;
    walkDirVec.y = ThreeAPI.terrainAt(walkDirVec);

 //   camPosVec.subVectors(dragToVec3, tempVec3)
 //   camPosVec.normalize()
 //   camPosVec.multiplyScalar(-10);
    //  posMod.copy(camPosVec);

    camParams.offsetPos[0] = 0; //camPosVec.x;
    camParams.offsetPos[1] = 2; //camPosVec.y;
    camParams.offsetPos[2] = 0; //camPosVec.z;

    let height = 8 // camPosVec.length() * 0.5;

 //   camPosVec.add(tempVec3);

    let frameTime = GameAPI.getFrame().tpf;
    //camParams.pos[0] = camPosVec.x
    //camParams.pos[1] = cursorPos.y
    //camParams.pos[2] = camPosVec.z
    walkDirVec.copy(dragToVec3);
    walkDirVec.sub(tempVec3);
    let speed = 2;
    let walkInputSpeed = walkDirVec.length()
    if (walkDirVec.length() > speed) {
        walkDirVec.normalize();
        walkDirVec.multiplyScalar(speed)
    }

    if (walkInputSpeed > 0.01) {
        navPoint.time = frameTime*5
    } else {
        navPoint.time = 2;
    }

    calcVec.addVectors(tempVec3, walkDirVec);
//    camLookAtVec.copy(calcVec)

//    camLookAtVec.y +=2;


    walkDirVec.multiplyScalar(frameTime);
//    movePiecePos.add(walkDirVec)
    cursorObj3d.position.copy(movePiecePos);
   // evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:tempVec3, to:dragToVec3, color:'CYAN'});
    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:tempVec3, to:calcVec, color:'YELLOW'});
    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:dragToVec3, color:'WHITE', size:0.3})

    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:tempVec3, to:camPosVec, color:'BLUE'});
    //   tempVec3.add(dragFromVec3);
    //   cursorObj3d.position.copy(tempVec3);
    //   camParams.offsetLookAt[0] = pointerDragVector.x
    //   camParams.offsetLookAt[2] = pointerDragVector.yz

    cursorObj3d.position.y = ThreeAPI.terrainAt(cursorObj3d.position)+2
    //   camParams.offsetPos[0] = Math.sin(GameAPI.getGameTime()*0.3)*22
    camParams.offsetPos[1] = height + cursorObj3d.position.y
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
        cursorObj3d.position.copy(lookAroundPoint);
        camParams.mode = camModes.worldDisplay;

        let setCamMode = function(evt) {
            let selectedMode = evt.mode;

            if (selectedMode === camParams.mode) {
                selectedMode = camModes.worldDisplay;
            }

            movePiecePos.copy(cursorObj3d.position);
            camParams.mode = selectedMode;

            console.log(evt, camParams.mode);
        }



        let activePointerUpdate = function(pointer, isFirstPressFrame, released) {
            pointerActive = true;
        //    if (isFirstPressFrame) {
            //    ThreeAPI.copyCameraLookAt(cursorObj3d.position)
                dragFromVec3.copy(cursorObj3d.position);
        //    }
            pointerDragVector.x = -pointer.dragDistance[0] * 0.1;
            pointerDragVector.y = 0;
            pointerDragVector.z = -pointer.dragDistance[1] * 0.1;

            dragToVec3.copy(pointerDragVector)
            dragToVec3.applyQuaternion(cursorObj3d.quaternion);
            dragToVec3.add(cursorObj3d.position)

/*
            navPoint.pos = camParams.pos;
            navPoint.lookAt[0] = camLookAtVec.x //-dragFromVec3.x;
            navPoint.lookAt[1] = camLookAtVec.y //-dragFromVec3.y;
            navPoint.lookAt[2] = camLookAtVec.z //-dragFromVec3.z;
*/
            if (camParams.mode === camModes.worldViewer) {
            //    navPoint.callback = camCB;
                updateWorldLook();
            }

            if (camParams.mode === camModes.gameTravel) {
                navPoint.callback = null;
                updateWalkCamera();
                if (released) {
                    navPoint.time = 2;
                    if (tilePath.pathTiles.length) {
                    //    navPoint.callback = camCB;
                        cursorObj3d.position.copy(tilePath.pathTiles[tilePath.pathTiles.length-1].getPos());
                    //    updateWorldLook();
                    //    updateCursorFrame();
                    }

                } else {
                    tilePath = GameAPI.getTilePath(cursorObj3d.position, dragToVec3)
                 //   console.log(tilePath);
                }

            }

            evt.dispatch(ENUMS.Event.SET_CAMERA_TARGET, navPoint);
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
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:cursorObj3d.position, to:tempVec3, color:'WHITE'});

        if (camParams.mode === camModes.worldDisplay) {
            updateWorldDisplay();
        }

        updateCursorFrame();

    //    debugDrawCursor();
    }

}

export { CameraSpatialCursor }