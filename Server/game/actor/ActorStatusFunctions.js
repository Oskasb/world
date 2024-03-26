import {ENUMS} from "../../../client/js/application/ENUMS.js";
import {MATH} from "../../../client/js/application/MATH.js";
import {Vector3} from "../../../client/libs/three/math/Vector3.js";
import {Object3D} from "../../../client/libs/three/core/Object3D.js";
import {processActorEngageTarget, processDisengagement} from "../action/ServerActionFunctions.js";


let tempVec = new Vector3();
let tempObj = new Object3D();

function applyActorKilled(actor) {
    actor.turnSequencer.exitSequence();
    MATH.emptyArray(actor.tilePath.pathTiles);
    setDestination(actor, getStatusPosition(actor));
    actor.setStatusKey(ENUMS.ActorStatus.TRAVEL_MODE, ENUMS.TravelMode.TRAVEL_MODE_INACTIVE);
 //   actor.setStatusKey(ENUMS.ActorStatus.RETREATING, actor.getStatus(ENUMS.ActorStatus.ACTIVATED_ENCOUNTER || ''));
    actor.setStatusKey(ENUMS.ActorStatus.BODY_STATE, 'FALL_DOWN');
    actor.setStatusKey(ENUMS.ActorStatus.STAND_STATE, 'FALL_DOWN');
    actor.setStatusKey(ENUMS.ActorStatus.MOVE_STATE, 'FALL_DOWN');
    actor.setStatusKey(ENUMS.ActorStatus.PATH_POINTS, []);

}

function registerTilePathPoints(actor) {
    let tilePath = actor.tilePath;

    let pathPoints = actor.getStatus(ENUMS.ActorStatus.PATH_POINTS);

    while (pathPoints.length) {
        pathPoints.pop()
    }

    for (let i = 0; i < tilePath.pathTiles.length; i++) {
        let gridPoint = tilePath.pathTiles[i].gridPoint;
        pathPoints.push(gridPoint.point);
    }
    actor.serverActorPathWalker.setPathPoints(pathPoints);
}


function registerCombatStatus(actor, combatStatus) {

    let sMap = actor.getStatus(ENUMS.ActorStatus.COMBAT_STATUS);

    if (sMap.indexOf(combatStatus) === -1) {
        sMap.push(combatStatus);
    }

}

function unregisterCombatStatus(actor, combatStatus) {
    let sMap = actor.getStatus(ENUMS.ActorStatus.COMBAT_STATUS);

    if (sMap.indexOf(combatStatus) !== -1) {
        MATH.splice(sMap, combatStatus)
    }
}

function setDestination(actor, posVec) {
    console.log("setDestination ", posVec)
    let destination = actor.getStatus(ENUMS.ActorStatus.SELECTED_DESTINATION);
    MATH.vec3ToArray(posVec, destination);
    actor.setStatusKey(ENUMS.ActorStatus.SELECTED_DESTINATION, destination);
}

function getDestination(actor) {
    let destination = actor.getStatus(ENUMS.ActorStatus.SELECTED_DESTINATION);
    MATH.vec3FromArray(tempVec, destination);
    return tempVec;
}

function getActorForward(actor) {
    let quat = getStatusQuaternion(actor);
    tempVec.set(0, 0, 1);
    tempVec.applyQuaternion(quat);
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
    actor.pos.copy(pos);
}

function getStatusVelocity(actor) {
    tempVec.set(
        actor.getStatus(ENUMS.ActorStatus.VEL_X),
        actor.getStatus(ENUMS.ActorStatus.VEL_Y),
        actor.getStatus(ENUMS.ActorStatus.VEL_Z)
    )
    return tempVec;
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

function getStatusQuaternion(actor) {
    tempObj.quaternion.set(
        actor.getStatus(ENUMS.ActorStatus.QUAT_X),
        actor.getStatus(ENUMS.ActorStatus.QUAT_Y),
        actor.getStatus(ENUMS.ActorStatus.QUAT_Z),
        actor.getStatus(ENUMS.ActorStatus.QUAT_W)
    )
    return tempObj.quaternion;
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

function pushToPosition(actor, pos, tpf) {
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

  //  actor.setStatusKey(ENUMS.ActorStatus.MOVE_STATE, 'MOVE_COMBAT')
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
    actor.setStatusKey(ENUMS.ActorStatus.HP, actor.getStatus(ENUMS.ActorStatus.MAX_HP));
    actor.setStatusKey(ENUMS.ActorStatus.DAMAGE_APPLIED, 0);
    actor.setStatusKey(ENUMS.ActorStatus.HEALING_APPLIED, 0);
    actor.setStatusKey(ENUMS.ActorStatus.TURN_STATE, ENUMS.TurnState.NO_TURN);
    actor.setStatusKey(ENUMS.ActorStatus.HAS_TURN, false); // -1 for new encounter
    actor.setStatusKey(ENUMS.ActorStatus.HAS_TURN_INDEX, encounter.getStatus(ENUMS.EncounterStatus.TURN_INDEX));
    actor.setStatusKey(ENUMS.ActorStatus.TURN_DONE, encounter.getStatus(ENUMS.EncounterStatus.TURN_INDEX) -1); // -1 for new encounter
    actor.setStatusKey(ENUMS.ActorStatus.IN_COMBAT, true); // -1 for new encounter
    actor.setStatusKey(ENUMS.ActorStatus.TRAVEL_MODE, ENUMS.TravelMode.TRAVEL_MODE_BATTLE);
    actor.setStatusKey(ENUMS.ActorStatus.COMBAT_STATUS, [])
    actor.setStatusKey(ENUMS.ActorStatus.SELECTED_TARGET, "")
    actor.setStatusKey(ENUMS.ActorStatus.SELECTED_ACTION, "")
    actor.setStatusKey(ENUMS.ActorStatus.ACTION_STATE_KEY, 0)

    encounter.serverEncounterTurnSequencer.addEncounterActor(actor)
    encounter.sendActorStatusUpdate(actor);
    actor.sendFunction = encounter.sendActorStatusUpdate;
    actor.serverEncounter = encounter;
}


function exitEncounter(encounter, actor, victory) {
    actor.setStatusKey(ENUMS.ActorStatus.HP, actor.getStatus(ENUMS.ActorStatus.MAX_HP));
    actor.setStatusKey(ENUMS.ActorStatus.DEAD, false);
    actor.setStatusKey(ENUMS.ActorStatus.TURN_STATE, ENUMS.TurnState.NO_TURN);
    actor.setStatusKey(ENUMS.ActorStatus.HAS_TURN, false); // -1 for new encounter
    actor.setStatusKey(ENUMS.ActorStatus.PARTY_SELECTED, false); // -1 for new encounter
    actor.setStatusKey(ENUMS.ActorStatus.HAS_TURN_INDEX, -1);
    actor.setStatusKey(ENUMS.ActorStatus.SELECTED_TARGET, "");
    actor.setStatusKey(ENUMS.ActorStatus.TURN_DONE, -1); // -1 for new encounter
    actor.setStatusKey(ENUMS.ActorStatus.IN_COMBAT, false); // -1 for new encounter
    actor.setStatusKey(ENUMS.ActorStatus.TRAVEL_MODE, ENUMS.TravelMode.TRAVEL_MODE_WALK);
    actor.setStatusKey(ENUMS.ActorStatus.SELECTED_TARGET, "")
    actor.setStatusKey(ENUMS.ActorStatus.SELECTED_ACTION, "")
    actor.setStatusKey(ENUMS.ActorStatus.ACTION_STATE_KEY, 0)
    actor.setStatusKey(ENUMS.ActorStatus.SEQUENCER_SELECTED, false);
    actor.setStatusKey(ENUMS.ActorStatus.RETREATING, '');
    actor.setStatusKey(ENUMS.ActorStatus.EXIT_ENCOUNTER, '');

    if (!victory) {
        let exitTile = encounter.getRandomExitTile();
        if (!exitTile) {
            console.log("Not here, probably a disconnect...");
            return
        }
        let exitPos = exitTile.getPos();
        setDestination(actor, exitPos);
        console.log("Exit lost Encounter")
    }

    encounter.sendActorStatusUpdate(actor);
    actor.sendFunction = null;
    actor.serverEncounter = null;
}

function startActorTurn(encounter, actor) {
    let turnIndex = encounter.getStatus(ENUMS.EncounterStatus.TURN_INDEX);
    actor.setStatusKey(ENUMS.ActorStatus.HAS_TURN, true);
    actor.setStatusKey(ENUMS.ActorStatus.TURN_STATE, ENUMS.TurnState.TURN_INIT);
    actor.setStatusKey(ENUMS.ActorStatus.HAS_TURN_INDEX, turnIndex);

    let actorIsPlayer = encounter.actorIsPlayer(actor)

    actor.setStatusKey(ENUMS.ActorStatus.HAS_TURN, true);
    actor.setStatusKey(ENUMS.ActorStatus.HAS_TURN_INDEX, turnIndex)
    actor.setStatusKey(ENUMS.ActorStatus.TURN_STATE, ENUMS.TurnState.TURN_INIT);

    if (actorIsPlayer) {
    //    console.log("Start player actor turn", actor)
        actor.setStatusKey(ENUMS.ActorStatus.PARTY_SELECTED, true);
        encounter.setStatusKey(ENUMS.EncounterStatus.ACTIVE_TURN_SIDE, "PARTY PLAYER");
    } else {
        encounter.setStatusKey(ENUMS.EncounterStatus.ACTIVE_TURN_SIDE, "OPPONENTS");
        let turnEnded = function() {
        //    console.log("Call turn ended")
            encounter.sendEncounterStatusUpdate();
        }

        actor.turnSequencer.startNpcActorTurn(turnEnded, encounter);
    }
    encounter.sendActorStatusUpdate(actor);
}

function endActorTurn(encounter) {
    let actorId = encounter.getStatus(ENUMS.EncounterStatus.HAS_TURN_ACTOR);
    let actor = encounter.getEncounterCombatantById(actorId);
   // console.log("End Actor Turn ", actorId);
    let turnIndex = encounter.getStatus(ENUMS.EncounterStatus.TURN_INDEX);
    actor.setStatusKey(ENUMS.ActorStatus.HAS_TURN, false);
    actor.setStatusKey(ENUMS.ActorStatus.PARTY_SELECTED, false);
    actor.setStatusKey(ENUMS.ActorStatus.TURN_DONE, turnIndex);
    actor.setStatusKey(ENUMS.ActorStatus.TURN_STATE, ENUMS.TurnState.NO_TURN);
    encounter.setStatusKey(ENUMS.EncounterStatus.HAS_TURN_ACTOR, '');
    encounter.setStatusKey(ENUMS.EncounterStatus.TURN_STATE, ENUMS.TurnState.TURN_INIT);
    encounter.sendActorStatusUpdate(actor);
}

function hasCombatState(actor, combatState) {
    let combatStates = actor.getStatus(ENUMS.ActorStatus.COMBAT_STATUS);

    if (combatStates.indexOf(combatState) !== -1) {
        return true;
    } else {
        return false;
    }

}

function clearEngagements(actor, encounter) {
    let engagedTargets = actor.getStatus(ENUMS.ActorStatus.ENGAGED_TARGETS);

    if (engagedTargets.length !== 0) {
        MATH.emptyArray(engagedTargets);
        actor.setStatusKey(ENUMS.ActorStatus.ENGAGE_COUNT, 0);
        encounter.sendActorStatusUpdate(actor);
    }


}

let actorList = [];
function updateActorEncounterEngagements(actor, encounter) {
    let isDead = actor.getStatus(ENUMS.ActorStatus.DEAD)
    if (isDead) {
        clearEngagements(actor, encounter);
        return;
    }
    MATH.emptyArray(actorList);
    encounter.call.getOpposingActors(actor, actorList);

    let pos = getStatusPosition(actor);

    let engageMax = actor.getStatus(ENUMS.ActorStatus.ENGAGE_MAX);

    if (engageMax === 0) {
        return;
    }

    let engagedTargets = actor.getStatus(ENUMS.ActorStatus.ENGAGED_TARGETS);
    let hasUpdate = false;

    for (let i = 0; i < engagedTargets.length; i++) {
        let target = encounter.getEncounterCombatantById(engagedTargets[i])
            let isDead = target.getStatus(ENUMS.ActorStatus.DEAD)
            if (isDead) {
                console.log("Engagement Dead ", actor.id, target.id);
                MATH.splice(engagedTargets, target.id);
                i--;
                hasUpdate = true;
            }
    }

    for (let i = 0; i < actorList.length; i++) {
        let opponent = actorList[i];
        let isDead = opponent.getStatus(ENUMS.ActorStatus.DEAD)

        if (isDead) {

        } else {
            let oPos = getStatusPosition(opponent);
            let distance = MATH.distanceBetween(pos, oPos);
            if (distance < 1.6) {
                if (engagedTargets.length < engageMax) {
                    if (engagedTargets.indexOf(opponent.id) === -1) {
                        engagedTargets.push(opponent.id)
                        hasUpdate = true;
                        processActorEngageTarget(actor, opponent, encounter)
                    }
                }
            } else {
                if (engagedTargets.indexOf(opponent.id) !== -1) {
                    console.log("Engagement Detach ", actor.id, opponent.id);
                    MATH.splice(engagedTargets, opponent.id);
                    processDisengagement(actor, opponent, encounter);
                    hasUpdate = true;
                }
            }
        }

    }

    if (hasUpdate) {
        actor.setStatusKey(ENUMS.ActorStatus.ENGAGE_COUNT, engagedTargets.length);
        encounter.sendActorStatusUpdate(actor);
    }

}

export {
    applyActorKilled,
    registerTilePathPoints,
    registerCombatStatus,
    unregisterCombatStatus,
    setDestination,
    getDestination,
    getActorForward,
    getStatusPosition,
    setStatusPosition,
    getStatusVelocity,
    moveToPosition,
    pushToPosition,
    stopAtPos,
    faceTowardsPos,
    enterEncounter,
    exitEncounter,
    startActorTurn,
    endActorTurn,
    hasCombatState,
    updateActorEncounterEngagements
}