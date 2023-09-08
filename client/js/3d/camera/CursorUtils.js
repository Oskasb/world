import {Vector3} from "../../../libs/three/math/Vector3.js";

let calcVec = new Vector3()
let tempVec3 = new Vector3();
let dragDirection = new Vector3();
let color = {}

function processLookCursorInput(cursorObj3d, dragToVec3, camTargetPos, cursorForward, cursorTravelVec) {
    let inputForce = cursorTravelVec.lengthSq();
    let inputAngle = cursorForward.angleTo(cursorTravelVec);
    tempVec3.copy(cursorObj3d.position);
    cursorObj3d.position.y = ThreeAPI.terrainAt(cursorObj3d.position)
    tempVec3.y = cursorObj3d.position.y // ThreeAPI.terrainAt(tempVec3);
    dragToVec3.y = tempVec3.y // ThreeAPI.terrainAt(dragToVec3, calcVec)+2;

    calcVec.subVectors(dragToVec3, cursorObj3d.position);

    cursorTravelVec.copy(calcVec);
    cursorTravelVec.y += inputForce * 0.1;



    calcVec.multiplyScalar(Math.cos(inputAngle) * -2);
    calcVec.add(cursorObj3d.position);
    camTargetPos.copy(calcVec);
    calcVec.copy(cursorForward)
    calcVec.multiplyScalar(3)
    camTargetPos.sub(calcVec);
    //  posMod.copy(camPosVec);

    /*
    camParams.offsetPos[0] = 0;
    camParams.offsetPos[1] = 0;
    camParams.offsetPos[2] = 0;

    camParams.offsetLookAt[0] = 0;
    camParams.offsetLookAt[1] = 0;
    camParams.offsetLookAt[2] = 0;
*/


    camTargetPos.y = cursorObj3d.position.y + camTargetPos.distanceTo(cursorObj3d.position) * 0.5 + 0.55 +inputForce * 0.0005;
    return inputAngle;
}

function drawInputCursorState(cursorObj3d, dragToVec3, camTargetPos, cursorForward, cursorTravelVec) {
    dragDirection.copy(cursorTravelVec);
    dragDirection.normalize();
    calcVec.copy(camTargetPos);
    calcVec.y = cursorObj3d.position.y;

    let cursorPos = cursorObj3d.position

    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE,  {from:cursorPos, to:dragToVec3, color:'BLUE'});
    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE,  {from:cursorPos, to:calcVec, color:'RED'});
    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:dragToVec3, color:'CYAN', size:0.2})
    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE,  {from:calcVec, to:camTargetPos, color:'RED'});
    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:camTargetPos, color:'RED', size:0.3})

    tempVec3.copy(cursorForward);
    calcVec.copy(cursorPos);
    calcVec.y += 0.02;
    tempVec3.add(calcVec);

    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:calcVec, to:tempVec3, color:'YELLOW'});
    tempVec3.copy(dragDirection);
    tempVec3.add(calcVec);
    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:calcVec, to:tempVec3, color:'YELLOW'});
}

function processTerrainLodCenter(calcVec) {
    let cursorPos = ThreeAPI.getCameraCursor().getPos();

    calcVec.subVectors(cursorPos , ThreeAPI.getCamera().position );
    calcVec.multiplyScalar(-0.2);
    calcVec.add(cursorPos);
    calcVec.y = cursorPos.y+0.1
    //     evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:cursorPos, to:calcVec, color:"YELLOW"});
    //     GuiAPI.printDebugText(''+calcVec.x+' '+calcVec.y+' '+calcVec.z)




//    ThreeAPI.groundAt(calcVec, color);
    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:calcVec, color:'WHITE', size:0.2})
 //   evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:calcVec, color:color, size:0.3})
    ThreeAPI.groundAt(cursorPos, color);
    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:cursorPos, color:'WHITE', size:0.35})
    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:cursorPos, color:color, size:0.3})



   // posVec.copy(cursorPos);
   // posVec.y = getHeightAndNormal(cursorPos, normVec);
    //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:posVec, color:'GREEN', size:0.3});
   // normVec.add(posVec);
    //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:posVec, to:normVec, color:'AQUA'});
    /*
                for (let i = 0; i < 20; i++) {
                    debugDrawNearby(i);
                }
    */
}

export {
    processTerrainLodCenter,
    processLookCursorInput,
    drawInputCursorState
}