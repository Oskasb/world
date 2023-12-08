import {poolFetch, poolReturn} from "./PoolUtils.js";
import {Vector3} from "../../../libs/three/math/Vector3.js";

let tempVec = new Vector3();

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
    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: physicalModel.getPos(), color:physicalModel.debugColor, size:1})
    evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, {min:physicalModel.box.min, max:physicalModel.box.max, color:physicalModel.debugColor})
    let shapes = physicalModel.shapes;
    for (let i = 0; i < shapes.length; i++) {
        let shape = shapes[i];
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: shape.getPos(), color:'GREY', size:0.5})
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:physicalModel.getPos(), to:shape.getPos(), color:'GREY'});
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, {min:shape.getBoundingMin(), max:shape.getBoundingMax(), color:'GREY'})
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
    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: pos, color:'CYAN', size:1.0})
    if (intersects) {
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: pos, color:'CYAN', size:1.5})
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:pos, to:tempVec, color:'CYAN'});
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
    addPhysicsToModel,
    removePhysicalModel,
    debugDrawPhysicalWorld,
    physicalIntersection
}
