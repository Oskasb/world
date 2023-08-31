import { Vector3 } from "../../../libs/three/math/Vector3.js";
import { Object3D } from "../../../libs/three/core/Object3D.js";

let calcVec = new Vector3()
let tempVec3 = new Vector3();
let cursorObj3d = new Object3D()

let posMod = new Vector3();
let lookAtMod = new Vector3();

let camParams = {
    camCallback : function() {},
    mode : null,
    pos : [0, 0, 0],
    lookAt :[0, 0, 0],
    offsetPos : [0, 0, 0],
    offsetLookAt : [0, 0, 0]
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
}

class CameraSpatialCursor {
    constructor() {

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

    updateSpatialCursor = function() {
        camParams.offsetPos[0] = Math.sin(GameAPI.getGameTime()*0.5)*10
        camParams.offsetPos[1] = 2 + Math.sin(GameAPI.getGameTime())*2 + ThreeAPI.terrainAt(this.getPos())
        camParams.offsetPos[2] = Math.cos(GameAPI.getGameTime()*0.5)*10
        updateCursorFrame();
        GameAPI.getGameCamera().updatePlayerCamera(camParams)
    //    debugDrawCursor();
    }

}

export { CameraSpatialCursor }