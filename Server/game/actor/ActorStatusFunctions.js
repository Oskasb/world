import {ENUMS} from "../../../client/js/application/ENUMS.js";
import {MATH} from "../../../client/js/application/MATH.js";
import {Vector3} from "../../../client/libs/three/math/Vector3.js";

let tempVec = new Vector3();

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
    tempVec.set(
        actor.getStatus(ENUMS.ActorStatus.POS_X),
        actor.getStatus(ENUMS.ActorStatus.POS_Y),
        actor.getStatus(ENUMS.ActorStatus.POS_Z)
    )
    return tempVec;
}

export {
    setDestination,
    getDestination,
    getStatusPosition
}