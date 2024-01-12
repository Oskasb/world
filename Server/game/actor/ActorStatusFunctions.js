import {ENUMS} from "../../../client/js/application/ENUMS.js";
import {MATH} from "../../../client/js/application/MATH.js";
import {Vector3} from "../../../client/libs/three/math/Vector3.js";
import {Object3D} from "../../../client/libs/three/core/Object3D.js";


let tempVec = new Vector3();
let tempObj = new Object3D();

function setDestination(actor, posVec) {
    let destination = actor.getStatus(ENUMS.ActorStatus.SELECTED_DESTINATION);
    console.log("Set Dest", posVec);
    MATH.vec3ToArray(posVec, destination);
    actor.setStatusKey(ENUMS.ActorStatus.SELECTED_DESTINATION, destination);
}

function getDestination(actor) {
    let destination = actor.getStatus(ENUMS.ActorStatus.SELECTED_DESTINATION);
    MATH.vec3FromArray(tempVec, destination);
    return tempVec;
}

function getStatusPosition(actor) {
    actor.pos.set(
        actor.getStatus(ENUMS.ActorStatus.POS_X),
        actor.getStatus(ENUMS.ActorStatus.POS_Y),
        actor.getStatus(ENUMS.ActorStatus.POS_Z)
    )
    return actor.pos;
}

function setStatusPosition(actor, pos) {
    actor.setStatusKey(ENUMS.ActorStatus.POS_X, pos.x);
    actor.setStatusKey(ENUMS.ActorStatus.POS_Y, pos.y);
    actor.setStatusKey(ENUMS.ActorStatus.POS_Z, pos.z)
}

function setStatusVelocity(actor, vel) {
    actor.setStatusKey(ENUMS.ActorStatus.VEL_X, vel.x);
    actor.setStatusKey(ENUMS.ActorStatus.VEL_Y, vel.y);
    actor.setStatusKey(ENUMS.ActorStatus.VEL_Z, vel.z)
}

function setStatusQuaternion(actor, quat) {
    actor.setStatusKey(ENUMS.ActorStatus.QUAT_X, quat.x);
    actor.setStatusKey(ENUMS.ActorStatus.QUAT_Y, quat.y);
    actor.setStatusKey(ENUMS.ActorStatus.QUAT_Z, quat.z)
    actor.setStatusKey(ENUMS.ActorStatus.QUAT_W, quat.w)
}

function moveToPosition(actor, pos, tpf) {
    tempObj.position.copy(getStatusPosition(actor));
    tempVec.copy(pos);
    tempVec.sub(tempObj.position);
    actor.setStatusKey(ENUMS.ActorStatus.FRAME_TRAVEL_DISTANCE, tempVec.length());
    tempVec.multiplyScalar(1 / tpf);
    setStatusVelocity(actor, tempVec);
    tempObj.position.y = pos.y;
    tempObj.lookAt(pos);
    setStatusPosition(actor, pos);
    setStatusQuaternion(actor, tempObj.quaternion);
    actor.setStatusKey(ENUMS.ActorStatus.MOVE_STATE, 'MOVE_COMBAT')

}

function stopAtPos(actor, pos, tpf) {
    setStatusPosition(actor, pos);
    tempObj.position.copy(getStatusPosition(actor));
    tempVec.set(0, 0, 0);
    actor.setStatusKey(ENUMS.ActorStatus.FRAME_TRAVEL_DISTANCE, 0);
    setStatusVelocity(actor, tempVec);
    actor.setStatusKey(ENUMS.ActorStatus.MOVE_STATE, 'STAND_COMBAT')
}

function faceTowardsPos(actor, pos) {
    tempObj.position.copy(getStatusPosition(actor))
    tempObj.position.y = pos.y;
    tempObj.lookAt(pos);
    setStatusQuaternion(actor, tempObj.quaternion)
}

function enterEncounter(encounter, actor) {

    actor.rollInitiative();
    actor.setStatusKey(ENUMS.ActorStatus.TURN_STATE, ENUMS.TurnState.NO_TURN);
    actor.setStatusKey(ENUMS.ActorStatus.HAS_TURN, false); // -1 for new encounter
    actor.setStatusKey(ENUMS.ActorStatus.HAS_TURN_INDEX, encounter.getStatus(ENUMS.EncounterStatus.TURN_INDEX)); // -1 for new encounter
    actor.setStatusKey(ENUMS.ActorStatus.TURN_DONE, encounter.getStatus(ENUMS.EncounterStatus.TURN_INDEX)); // -1 for new encounter
    actor.setStatusKey(ENUMS.ActorStatus.IN_COMBAT, true); // -1 for new encounter
    actor.setStatusKey(ENUMS.ActorStatus.TRAVEL_MODE, ENUMS.TravelMode.TRAVEL_MODE_BATTLE);
    encounter.serverEncounterTurnSequencer.addEncounterActor(actor)
    encounter.sendActorStatusUpdate(actor);
}

function exitEncounter(encounter, actor) {

}

function startEncounterTurn(encounter, actor) {
    let turnIndex = encounter.getStatus(ENUMS.EncounterStatus.TURN_INDEX);
    actor.setStatusKey(ENUMS.ActorStatus.HAS_TURN, true);
    actor.setStatusKey(ENUMS.ActorStatus.TURN_STATE, ENUMS.TurnState.TURN_INIT);
    actor.setStatusKey(ENUMS.ActorStatus.HAS_TURN_INDEX, turnIndex);
    encounter.setStatusKey(ENUMS.EncounterStatus.HAS_TURN_ACTOR, actor.getStatus(ENUMS.ActorStatus.ACTOR_ID));
    encounter.activeActor = actor;

    let actorIsPlayer = encounter.actorIsPlayer(actor)

    if (actorIsPlayer) {
        console.log("Start player actor turn", actor)
        encounter.setStatusKey(ENUMS.EncounterStatus.ACTIVE_TURN_SIDE, "PARTY PLAYER");

        actor.setStatusKey(ENUMS.ActorStatus.HAS_TURN, true);
        actor.setStatusKey(ENUMS.ActorStatus.PARTY_SELECTED, true);
        actor.setStatusKey(ENUMS.ActorStatus.HAS_TURN_INDEX, turnIndex)
        actor.setStatusKey(ENUMS.ActorStatus.TURN_STATE, ENUMS.TurnState.TURN_INIT);
    } else {
        encounter.setStatusKey(ENUMS.EncounterStatus.ACTIVE_TURN_SIDE, "OPPONENTS");
        actor.turnSequencer.startActorTurn(encounter.serverEncounterTurnSequencer.call.actorTurnEnded, turnIndex, encounter);
    }

}

function endEncounterTurn(encounter, actor) {
    let turnIndex = encounter.getStatus(ENUMS.EncounterStatus.TURN_INDEX);
    actor.setStatusKey(ENUMS.ActorStatus.HAS_TURN, false);
    actor.setStatusKey(ENUMS.ActorStatus.TURN_DONE, turnIndex);
    actor.setStatusKey(ENUMS.ActorStatus.TURN_STATE, ENUMS.TurnState.NO_TURN);
    encounter.setStatusKey(ENUMS.EncounterStatus.HAS_TURN_ACTOR, '');
    encounter.sendActorStatusUpdate(actor);
}

export {
    setDestination,
    getDestination,
    getStatusPosition,
    setStatusPosition,
    moveToPosition,
    stopAtPos,
    faceTowardsPos,
    enterEncounter,
    exitEncounter,
    startEncounterTurn,
    endEncounterTurn
}