import {poolFetch, poolReturn} from "./PoolUtils.js";
import {Vector3} from "../../../libs/three/math/Vector3.js";
import {Object3D} from "../../../libs/three/core/Object3D.js";
import {Ray} from "../../../libs/three/math/Ray.js";

let tempObj = new Object3D();
let tempVec = new Vector3();
let tempPos = new Vector3()
let tempVec2 = new Vector3();
let tempVec3 = new Vector3();
let tempVec4 = new Vector3();
let tempVec5 = new Vector3();
let normalStore = new Vector3();
let tempFrom = new Vector3();
let tempTo = new Vector3();
let tempRay = new Ray();

function getPhysicalWorld() {
    return GameAPI.gameMain.phyiscalWorld;
}
function addPhysicsToModel(assetId, obj3d, updateCB) {
    let physicalModel = getPhysicalWorld().addPhysicalModel();
    physicalModel.initPhysicalWorldModel(assetId, obj3d, updateCB)
    return physicalModel;
}

function removePhysicalModel(physicalModel) {
    getPhysicalWorld().removePhysicalModel(physicalModel);
    physicalModel.deactivatePhysicalModel();

}


function debugDrawPhysicalModel(physicalModel) {
  //  evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: physicalModel.getPos(), color:physicalModel.debugColor, size:1})
  //  evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, {min:physicalModel.box.min, max:physicalModel.box.max, color:physicalModel.debugColor})
    let shapes = physicalModel.shapes;
    for (let i = 0; i < physicalModel.rigidBodies.length; i++) {
        let body = physicalModel.rigidBodies[i];
        bodyTransformToObj3d(body, tempObj);
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:tempObj.position, to:ThreeAPI.getCameraCursor().getPos(), color:'GREY'});
     //   evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: shape.getPos(), color:shape.debugColor, size:0.5})
    //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:physicalModel.getPos(), to:shape.getPos(), color:shape.debugColor});
    //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, {min:shape.getBoundingMin(), max:shape.getBoundingMax(), color:shape.debugColor})
    //    shape.drawDebugBox()
    }
}

function debugDrawPhysicalWorld() {
    let physicalModels = getPhysicalWorld().physicalModels;
    for (let i = 0; i < physicalModels.length; i++) {
           debugDrawPhysicalModel(physicalModels[i])
    }

    let pos = ThreeAPI.getCameraCursor().getPos();
    pos.y = ThreeAPI.terrainAt(pos) - 0.1;
    let intersects = physicalIntersection(pos, tempVec);

    tempVec3.copy(pos);
    tempVec3.y += 3;
    rayTest(tempVec3, pos, tempVec3, normalStore, true);
    tempVec3.y += 50;
    tempVec3.x += 10;
    rayTest(tempVec3, pos, tempVec3, normalStore, true);
    tempVec3.x -= 20;
    rayTest(tempVec3, pos, tempVec3, normalStore, true);
    tempVec3.z += 10;
    rayTest(tempVec3, pos, tempVec3, normalStore, true);
    tempVec3.z -= 20;
    rayTest(tempVec3, pos, tempVec3, normalStore, true);

    let time = GameAPI.getGameTime();

    for (let i = 0; i < 50; i++) {
        tempVec.copy(pos)
        tempVec.y = ThreeAPI.terrainAt(pos)
        tempVec2.set(tempVec.x + Math.sin(time*1.2 +(i+2)*1.2)*(10+(i+2)*0.5), tempVec.y + (i)*1.5 + (Math.cos( time*0.5+i*1.2)+0.8) * (2+i*0.5), tempVec.z + Math.cos( time*1.2+i*1.2) * (10+(i+2)*0.5))

        rayTest(tempVec2, tempVec,  tempVec3, normalStore, true);

    }


 //   evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: pos, color:'CYAN', size:1.0})
  //  if (intersects) {
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: pos, color:'CYAN', size:0.25})
  //      evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:pos, to:tempVec, color:'CYAN'});
 //   }


}


function rayTest(from, to, contactPointStore, contactNormal, debugDraw) {
    if (!contactNormal) {
        contactNormal = tempVec5;
    }
    tempTo.copy(to).sub(from);
    let hit = AmmoAPI.raycastPhysicsWorld(from, tempTo, contactPointStore, contactNormal, debugDraw)

    if (debugDraw) {
        if (hit) {
            tempVec.copy(tempTo)
        //    console.log(hit)
        //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:from, to:contactPointStore, color:'RED'});

            evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: contactPointStore, color:'YELLOW', size:0.1})
            tempVec.copy(contactNormal).add(contactPointStore)
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:contactPointStore, to:tempVec, color:'CYAN'});
        } else {
        //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:from, to:to, color:'BLUE'});
        }
    }

    return hit;

}

function bodyTransformToObj3d(body, obj3d, debugDraw) {
    let ms = body.getMotionState();

    let TRANSFORM_AUX = AmmoAPI.getAuxTransform();

    ms.getWorldTransform(TRANSFORM_AUX);
    let p = TRANSFORM_AUX.getOrigin();
    let q = TRANSFORM_AUX.getRotation();
    if (isNaN(p.x())) {
        //    PhysicsWorldAPI.registerPhysError();

        let tf = new Ammo.btTransform();

        this.getSpatialPosition(tempVec1);
        this.getSpatialQuaternion(tempQuat);

        tf.getOrigin().setX(tempVec1.x);
        tf.getOrigin().setY(tempVec1.y);
        tf.getOrigin().setZ(tempVec1.z);

        tf.getRotation().setX(tempQuat.x);
        tf.getRotation().setY(tempQuat.y);
        tf.getRotation().setZ(tempQuat.z);
        tf.getRotation().setW(tempQuat.w);
        ms.setWorldTransform(tf);
        console.log("Bad body transform", this.body)
        return;
    }

    obj3d.position.set(p.x(), p.y(), p.z());

    obj3d.quaternion.set(q.x(), q.y(), q.z(), q.w());

 //   if (debugDraw) {
//       evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:ThreeAPI.getCameraCursor().getPos(), to:obj3d.position, color:'YELLOW'});
 //   }

}

function physicalIntersection(pos, insideVec3) {
    if (!insideVec3) {
        insideVec3 = tempVec;
    }
    let physicalModels = getPhysicalWorld().physicalModels;
    for (let i = 0; i < physicalModels.length; i++) {

    //    let intersects = physicalModels[i].testIntersectPos(pos, insideVec3);
    //    if (intersects) {
    //        return insideVec3
    //    }

    }
}

let step = 0;
function detectFreeSpaceAbovePoint(point, marginHeight, contactPoint, contactNormal, maxSteps, debugDraw) {

    tempPos.copy(point);
    tempPos.y = point.y + marginHeight;

    let hit = rayTest(tempPos, point, contactPoint, contactNormal, debugDraw);
    if (hit) {
        step++;
        if (step > maxSteps) {
            return hit;
        } else {
            return detectFreeSpaceAbovePoint(contactPoint, marginHeight, contactPoint, contactNormal, debugDraw)
        }
    }
    step = 0;
}

function getModelByBodyPointer(ptr) {
    let world = getPhysicalWorld();

    if (world.terrainBody.kB === ptr) {
        return world.terrainBody;
    }
    let models = world.physicalModels;
    for (let i = 0; i < models.length; i++){
        let model = models[i];
        let bodies = model.rigidBodies;
        for (let j = 0; j < bodies.length;j++) {
            let body = bodies[j];
            if (body.kB === ptr) {
                return model;
            }
        }

    }
    console.log("no body found for pointer ", ptr);
}


export {
    getPhysicalWorld,
    detectFreeSpaceAbovePoint,
    rayTest,
    bodyTransformToObj3d,
    addPhysicsToModel,
    removePhysicalModel,
    debugDrawPhysicalWorld,
    physicalIntersection,
    getModelByBodyPointer
}
