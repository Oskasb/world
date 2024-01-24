import {
    getStatusPosition, moveToPosition, pushToPosition,
    registerCombatStatus,
    setDestination, setStatusPosition, stopAtPos,
    unregisterCombatStatus
} from "../../actor/ActorStatusFunctions.js";
import {MATH} from "../../../../client/js/application/MATH.js";
import {ENUMS} from "../../../../client/js/application/ENUMS.js";
import {Vector3} from "../../../../client/libs/three/math/Vector3.js";
import {
    getNearbyWalkableTile,
    getRandomWalkableTiles, getTileForPosition,
    registerGameServerUpdateCallback,
    unregisterGameServerUpdateCallback
} from "../../utils/GameServerFunctions.js";

function selectTargetTile(actor, originPos, destination) {

    let encounter = actor.serverEncounter;
    let tile = getTileForPosition(encounter.serverGrid.gridTiles, destination, 'walkable');

    let distance = MATH.distanceBetween(originPos, tile.getPos());

    if (distance < 0.8) {
        tile = getNearbyWalkableTile(encounter.serverGrid.gridTiles, tile.getPos(), 0.8)
    }

    return tile;
}


class ServerTransition {
    constructor(actor) {
        let targetPos = new Vector3();
        let originPos = new Vector3();
        let framePos = new Vector3();
        let totalDistance = 0;
        let travelTime = 0;
        let timeElapsed = 0;

        let fromMoveState = "";
        let fromStandState = "";
        let fromBodyState = "";
        let fromTravelMode = null;


        let initServerTransition = function(destination) {
        //    let encounter = actor.serverEncounter;

            fromMoveState = actor.getStatus(ENUMS.ActorStatus.MOVE_STATE);
            fromStandState = actor.getStatusMap(ENUMS.ActorStatus.STAND_STATE);
            fromBodyState = actor.getStatus(ENUMS.ActorStatus.BODY_STATE);
            fromTravelMode = actor.getStatus(ENUMS.ActorStatus.TRAVEL_MODE);

            actor.setStatusKey(ENUMS.ActorStatus.TRAVEL_MODE, ENUMS.TravelMode.TRAVEL_MODE_INACTIVE);
            actor.setStatusKey(ENUMS.ActorStatus.MOVE_STATE, 'FALL_DOWN');
            actor.setStatusKey(ENUMS.ActorStatus.STAND_STATE, 'FALL_DOWN');
            actor.setStatusKey(ENUMS.ActorStatus.BODY_STATE, 'FALL_DOWN');

            originPos.copy(getStatusPosition(actor));

            let tile = selectTargetTile(actor, originPos, destination)

            targetPos.copy(tile.getPos());


            framePos.copy(originPos);
            totalDistance = MATH.distanceBetween(originPos, targetPos);
            timeElapsed = 0;
            travelTime = 1 + MATH.curveSqrt(totalDistance) * 0.75;
            setDestination(actor, targetPos);
            registerCombatStatus(actor, ENUMS.CombatStatus.PUSHED)
            registerGameServerUpdateCallback(updateServerTransition);
        };

        let closeServerTransition = function(tpf) {
            actor.setStatusKey(ENUMS.ActorStatus.TRAVEL_MODE, fromTravelMode);
            actor.setStatusKey(ENUMS.ActorStatus.MOVE_STATE, fromMoveState);
            actor.setStatusKey(ENUMS.ActorStatus.STAND_STATE, fromStandState);
            actor.setStatusKey(ENUMS.ActorStatus.BODY_STATE, fromBodyState);
            stopAtPos(actor, targetPos, tpf);
            unregisterCombatStatus(actor, ENUMS.CombatStatus.PUSHED)
            unregisterGameServerUpdateCallback(updateServerTransition)
        }

        let updateServerTransition = function(tpf) {
            let encounter = actor.serverEncounter;
            timeElapsed+=tpf;
            if (timeElapsed < travelTime) {
                framePos.copy(originPos);
                let fraction = MATH.calcFraction(0, travelTime, timeElapsed)
                framePos.y += Math.sin(fraction * 3.14) * (2 + totalDistance * 0.5)
                framePos.lerp(targetPos, fraction);
                pushToPosition(actor, framePos, tpf);
            } else {
                closeServerTransition(tpf)
            }


            encounter.sendActorStatusUpdate(actor);

        };

        this.call = {
            initServerTransition:initServerTransition
        }

    }

    activateKnockbackTransition(destination) {
        this.call.initServerTransition(destination);

    }

}

export {ServerTransition}