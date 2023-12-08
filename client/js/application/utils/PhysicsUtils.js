import {poolFetch, poolReturn} from "./PoolUtils.js";
import {Vector3} from "../../../libs/three/math/Vector3.js";
import {Ray} from "../../../libs/three/math/Ray.js";

let tempVec = new Vector3();
let tempVec2 = new Vector3();
let tempVec3 = new Vector3();
let tempVec4 = new Vector3();
let tempVec5 = new Vector3();
let tempRay = new Ray();

function getPhysicalWorld() {
    return GameAPI.gameMain.phyiscalWorld;
}
function addPhysicsToModel(assetId, obj3d) {
    let physicalModel = poolFetch('PhysicalModel')
    physicalModel.initPhysicalWorldModel(assetId, obj3d)
    getPhysicalWorld().addPhysicalModel(physicalModel);
    return physicalModel;
}

function removePhysicalModel(physicalModel) {
    getPhysicalWorld().removePhysicalModel(physicalModel);
    physicalModel.deactivatePhysicalModel();
    poolReturn(physicalModel);
}


function debugDrawPhysicalModel(physicalModel) {
  //  evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: physicalModel.getPos(), color:physicalModel.debugColor, size:1})
  //  evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, {min:physicalModel.box.min, max:physicalModel.box.max, color:physicalModel.debugColor})
    let shapes = physicalModel.shapes;
    for (let i = 0; i < shapes.length; i++) {
        let shape = shapes[i];
    //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: shape.getPos(), color:shape.debugColor, size:0.5})
    //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:physicalModel.getPos(), to:shape.getPos(), color:shape.debugColor});
    //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, {min:shape.getBoundingMin(), max:shape.getBoundingMax(), color:shape.debugColor})
        shape.drawDebugBox()
    }
}

function debugDrawPhysicalWorld() {
    let physicalModels = getPhysicalWorld().physicalModels;
    for (let i = 0; i < physicalModels.length; i++) {
           debugDrawPhysicalModel(physicalModels[i])
    }

    let pos = ThreeAPI.getCameraCursor().getPos();
    let intersects = physicalIntersection(pos, tempVec);

    for (let i = 0; i < 1; i++) {
        tempVec.copy(pos)
        tempVec2.set(8, 8, 8)
        tempVec.y+=0;
        MATH.randomVector(tempVec2);
        tempVec2.multiplyScalar(5)
        MATH.spreadVector(tempVec, tempVec2);
        tempVec4.copy(tempVec);
        tempVec5.addVectors(tempVec, tempVec2);
        intersects = physicalIntersection(pos, tempVec3);

        if (intersects) {

        } else {
            rayTest(tempVec4, tempVec5, tempVec3);
        }
    }


 //   evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: pos, color:'CYAN', size:1.0})
  //  if (intersects) {
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: pos, color:'CYAN', size:0.25})
  //      evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:pos, to:tempVec, color:'CYAN'});
 //   }


}


function rayTest(from, to, contactPointStore) {
    tempRay.origin.copy(from);
    tempRay.direction.copy(to);
    tempRay.direction.sub(from);

    let physicalModels = getPhysicalWorld().physicalModels;
    for (let i = 0; i < physicalModels.length; i++) {
    //    let intersects = physicalModels[i].testIntersectPos(to, contactPointStore);
    //    if (intersects) {
            physicalModels[i].testIntersectRay(tempRay, contactPointStore);
    //    }
    }

}

function physicalIntersection(pos, insideVec3) {
    if (!insideVec3) {
        insideVec3 = tempVec;
    }
    let physicalModels = getPhysicalWorld().physicalModels;
    for (let i = 0; i < physicalModels.length; i++) {
        let intersects = physicalModels[i].testIntersectPos(pos, insideVec3);
        if (intersects) {
            return insideVec3
        }
    }
}

export {
    rayTest,
    addPhysicsToModel,
    removePhysicalModel,
    debugDrawPhysicalWorld,
    physicalIntersection
}
