import {Vector3} from "../../../libs/three/math/Vector3.js";

let tempVec = new Vector3();
let tempVec2 = new Vector3();
let camTargetPos = new Vector3();

function viewTargetSelection(sequencer, candidates) {
    let actor = sequencer.getGameActor()
    let seqTime = sequencer.getSequenceTime()

    tempVec2.set(0, 0, 0)
    for (let i = 0; i < candidates.length; i++) {
        tempVec.copy(candidates[i].getPos())
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:actor.getPos(), to:tempVec, color:'YELLOW'});
        tempVec.sub(actor.getPos());
        tempVec2.add(tempVec);
    }

    tempVec2.multiplyScalar((seqTime*0.95+0.05) / candidates.length);
    tempVec.copy(tempVec2);
    tempVec2.add(actor.getPos());

    actor.turnTowardsPos(tempVec2)

    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:actor.getPos(), to:tempVec2, color:'WHITE'});
    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:tempVec2, color:'WHITE', size:0.25})
    sequencer.focusAtObj3d.position.copy(tempVec2);
    // indicateTurnClose(actor, seqTime)

    camTargetPos.copy(tempVec);
    camTargetPos.y = 0;
    camTargetPos.normalize()
    camTargetPos.multiplyScalar(-7);

    let camHome = GameAPI.call.getActiveEncounter().getEncounterCameraHomePosition()
//    tempVec.copy(camHome);
//    tempVec.sub(actor.getPos());
//    tempVec.multiplyScalar(0.5);
    camTargetPos.y +=6;

    camTargetPos.add(actor.getPos())
    camTargetPos.y += Math.sin(seqTime * Math.PI)*3
    camTargetPos.lerp(camHome,1-MATH.curveSigmoid(seqTime));
    camTargetPos.y += Math.sin(seqTime * Math.PI)*5
    // camTargetPos.add(tempVec)

    if (seqTime === 0) {
        evt.dispatch(ENUMS.Event.SET_CAMERA_MODE, {mode:'actor_turn_movement', obj3d:sequencer.focusAtObj3d, camPos:camTargetPos})
    }

    if (seqTime > 1) {
        camTargetPos.copy(tempVec);
        camTargetPos.y = 0;
        camTargetPos.normalize()
        camTargetPos.multiplyScalar(-2);
        camTargetPos.y +=2.5;
        camTargetPos.add(actor.getPos())
    }

}

export {
    viewTargetSelection
}