import {Vector3} from "../../../libs/three/math/Vector3.js";

let tempVec = new Vector3();
let tempVec2 = new Vector3();
let camTargetPos = new Vector3();

let side = 1;
let leftOrRight = [1, -1]

function viewTileSelect(sequencer) {
    let actor = sequencer.getGameActor()
    let seqTime = sequencer.getSequenceProgress()

    let camHome = GameAPI.call.getActiveEncounter().getEncounterCameraHomePosition()
    camTargetPos.copy(camHome)

    if (seqTime === 0) {
        side = MATH.getRandomArrayEntry(leftOrRight)
        evt.dispatch(ENUMS.Event.SET_CAMERA_MODE, {mode:'actor_turn_movement', obj3d:sequencer.focusAtObj3d, camPos:camTargetPos})
    }

    tempVec.subVectors(actor.getGameWalkGrid().getTargetPosition() , actor.getPos() )

    tempVec.multiplyScalar(seqTime);
    let distance = tempVec.length();
    camTargetPos.y += distance;
    tempVec2.copy(tempVec)
    tempVec.add(actor.getPos())

    actor.prepareTilePath(tempVec)

    tempVec2.multiplyScalar(0.5);
    tempVec2.add(actor.getPos())
    sequencer.focusAtObj3d.position.copy(tempVec2)

}

function viewTargetSelection(sequencer, candidates) {
    let actor = sequencer.getGameActor()
    let seqTime = sequencer.getSequenceProgress()

    tempVec2.set(0, 0, 0)
    let biggestDistance = MATH.distanceBetween(actor.getPos(), candidates[0].getPos());
    let distance = 0;
    for (let i = 0; i < candidates.length; i++) {
        tempVec.copy(candidates[i].getPos())

        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:actor.getPos(), to:tempVec, color:'YELLOW'});
        tempVec.sub(actor.getPos());
        distance = tempVec.length();

        if (biggestDistance < distance) {
            biggestDistance = distance;
        }

        tempVec2.add(tempVec);
    }
    distance = biggestDistance;

    tempVec.copy(tempVec2);

    tempVec2.multiplyScalar((seqTime*0.45+0.05) / candidates.length);
    tempVec2.add(actor.getPos());

    actor.turnTowardsPos(tempVec2)

    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:actor.getPos(), to:tempVec2, color:'WHITE'});
    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:tempVec2, color:'WHITE', size:0.25})
    sequencer.focusAtObj3d.position.copy(tempVec2);
    sequencer.focusAtObj3d.position.y -=0.5;


    let camHome = GameAPI.call.getActiveEncounter().getEncounterCameraHomePosition()

    calcAttackCamPosition(actor, distance*2 + 4, camTargetPos);
    camTargetPos.lerp(camHome,1-MATH.curveSigmoid(seqTime));
   // camTargetPos.y += Math.sin(seqTime * Math.PI*0.5)*5


}

let calcAttackCamPosition = function(actor, distance, storeVec) {
    storeVec.set(side * 0.5, 0.4, -0.2);
    storeVec.normalize();
    storeVec.multiplyScalar(distance);
    storeVec.applyQuaternion(actor.getVisualGamePiece().getQuat())
    storeVec.add(actor.getVisualGamePiece().getCenterMass())
}

let calcShouldCamPosition = function(actor, distance, storeVec) {
    storeVec.set(side * 0.12, 0.3, -0.6);
    storeVec.normalize();
    storeVec.multiplyScalar(distance);
    storeVec.applyQuaternion(actor.getVisualGamePiece().getQuat())
    storeVec.add(actor.getVisualGamePiece().getCenterMass())
}

function viewPrecastAction(sequencer, target) {

    let seqTime = sequencer.getSequenceProgress()
    let actor = sequencer.getGameActor()

    if (actor.isPlayerActor()) {
        calcShouldCamPosition(actor, 3, tempVec);
        tempVec2.copy(target.getPos())

    } else {
        let distance = MATH.distanceBetween(actor.getPos(), target.getPos())
        calcAttackCamPosition(actor, distance * 2 + 4, tempVec);
        tempVec2.subVectors(target.getPos(), actor.getPos())
        tempVec2.multiplyScalar(0.4);
        tempVec2.add(actor.getPos())
    }

    sequencer.focusAtObj3d.position.lerp(tempVec2, seqTime)
    camTargetPos.lerp(tempVec, seqTime)

}

export {
    viewTileSelect,
    viewTargetSelection,
    viewPrecastAction
}