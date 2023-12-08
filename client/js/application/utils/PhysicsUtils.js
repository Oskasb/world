import {poolFetch} from "./PoolUtils.js";

function getPhysicalWorld() {
    return GameAPI.gameMain.phyiscalWorld;
}



function addPhysicsToModel(gameModel, obj3d) {
    let newModel = poolFetch('PhysicalModel')
    newModel.initPhysicalWorldModel(gameModel, obj3d)
    getPhysicalWorld().addPhysicalModel(newModel);
}

function removePhysicalModel(physicalModel) {
    getPhysicalWorld().removePhysicalModel(physicalModel);
}

function debugDrawPhysicalWorld() {
    let physicalModels = getPhysicalWorld().physicalModels;
    for (let i = 0; i < physicalModels.length; i++) {
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: physicalModels[i].obj3d.position, color:'GREY', size:1})
    }

}

export {
    addPhysicsToModel,
    removePhysicalModel,
    debugDrawPhysicalWorld
}
