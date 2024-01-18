import {MATH} from "../../../client/js/application/MATH.js";
import {
    getStatusPosition,
    setStatusPosition,
    moveToPosition, stopAtPos
} from "./ActorStatusFunctions.js";

import {Vector3} from "../../../client/libs/three/math/Vector3.js";
import {ENUMS} from "../../../client/js/application/ENUMS.js";

let tempVec = new Vector3()

class ServerActorPathWalker {
    constructor() {
        this.pathPoints = []
        this.pathCompletedCallbacks = [];
    }

    setPathPoints(points) {
        MATH.copyArrayValues(points, this.pathPoints)
    }

    walkPath(actor, tpf, serverEncounter) {
        let tilePath = actor.tilePath;
        let pathTiles = tilePath.pathTiles;
    //    console.log("walk path")

        if (pathTiles.length > 1) {
            let pos = getStatusPosition(actor);
            let currentTilePos = pathTiles[0].getPos();
            let nextTilePos = pathTiles[1].getPos();

            tempVec.copy(nextTilePos);
            tempVec.sub(pos);
            tempVec.normalize();
            tempVec.multiplyScalar(tpf*4);
            tempVec.add(pos);
            moveToPosition(actor, tempVec, tpf);

            if (MATH.distanceBetween(tempVec, currentTilePos) > MATH.distanceBetween(tempVec, nextTilePos)) {
            //    console.log("Next tile")
                tilePath.deductNextTileFromPath();
                let pathPoints = actor.getStatus(ENUMS.ActorStatus.PATH_POINTS);
                pathPoints.shift();
                serverEncounter.sendActorStatusUpdate(actor);
            }
            return;
        } else if (pathTiles.length === 1) {
            stopAtPos(actor, pathTiles[0].getPos())
        }

            MATH.callAndClearAll(this.pathCompletedCallbacks);
            serverEncounter.sendActorStatusUpdate(actor);



    }


}



export {ServerActorPathWalker}