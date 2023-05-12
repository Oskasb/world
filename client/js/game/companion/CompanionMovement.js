import { Vector3 } from "../../../libs/three/math/Vector3.js";

import { Object3D } from "../../../libs/three/core/Object3D.js";
let tempObj = new Object3D()

let tempVec3 = new Vector3();
let tempVec3b = new Vector3()
class CompanionMovement {
    constructor(gamePiece) {
        this.gamePiece = gamePiece;
    }

    getCompanionFormationDestination(followingPiece) {
        let tilePath = followingPiece.movementPath.tilePath;
        let tiles = tilePath.getTiles();
        let tileCount = tiles.length;
        let companionIndex = followingPiece.companions.indexOf(this.gamePiece);

        if (tileCount > 1) {
            let lastTile = tiles[tileCount-1];
            let preLastTile = tiles[tileCount-2];
            tempObj.position.copy(preLastTile.getPos())
            tempObj.lookAt(lastTile.getPos());
        } else {
            let quat = followingPiece.getQuat()
            tempObj.quaternion.copy(quat)
            tempObj.position.copy(followingPiece.getPos())
        }

        if (MATH.isEvenNumber(companionIndex)) {
            tempVec3.x =1;
            tempVec3.z =-1;
            tempVec3.z -= Math.floor(companionIndex*0.5);
            tempVec3.applyQuaternion(tempObj.quaternion);
            tempVec3.add(tempObj.position)
            tempVec3.y = followingPiece.getPos().y;
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:followingPiece.getPos(), to:tempVec3, color:'AQUA'});
        } else {
            tempVec3.x =-1;
            tempVec3.z =-1;
            tempVec3.z -= Math.floor(companionIndex*0.5);
            tempVec3.applyQuaternion(tempObj.quaternion);
            tempVec3.add(tempObj.position)
            tempVec3.y = followingPiece.getPos().y;
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:followingPiece.getPos(), to:tempVec3, color:'CYAN'});
        }

        return tempVec3;

    }

    determineCompanionDestination(followingPiece) {
        if (this.gamePiece.getTarget()) {
            return;
        }

        let leaderTarget = followingPiece.getTarget()
        if (leaderTarget) {
            if (leaderTarget.getTarget() && leaderTarget.getStatusByKey('faction') === 'EVIL') {
                this.gamePiece.setStatusValue('selectedTarget', leaderTarget);
            //    this.gamePiece.setStatusValue('engagingTarget', leaderTarget);
                this.gamePiece.movementPath.setPathTargetPiece(leaderTarget);
                return
            }
        }

        let destinationVec3 =  this.getCompanionFormationDestination(followingPiece)
        this.gamePiece.movementPath.determineGridPathToPos(destinationVec3);
    }

    updateCompanionMovement(followingPiece) {
         this.determineCompanionDestination(followingPiece);
    }

}

export { CompanionMovement }