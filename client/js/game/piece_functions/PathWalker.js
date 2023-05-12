import {Vector3} from "../../../libs/three/math/Vector3.js";
let tempVec = new Vector3()

let drawPathTiles = function(pathTiles) {
    for (let i = 0; i < pathTiles.length; i++) {
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:pathTiles[i].getPos(), color:'GREEN', size:0.1})
    }
}

let drawPathTileVector = function(pathTiles, gamePiece) {
    if (pathTiles.length > 1) {
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:pathTiles[0].getPos(), color:'GREEN', size:0.3})
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:pathTiles[1].getPos(), color:'YELLOW', size:0.3})
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:gamePiece.getPos(), to:pathTiles[1].getPos(), color:'YELLOW'})
    } else {
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:gamePiece.getPos(), color:'RED', size:0.5})
    }

}

class PathWalker {
    constructor(gamePiece, tilePath) {
        this.hasArrived = true;
        this.gamePiece = gamePiece;
        this.tilePath = tilePath;
        this.headingVector = new THREE.Vector3();
    }


    setMovementHeadingVector(fromVec3, toVec3) {
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:fromVec3, to:toVec3, color:'GREEN'})
        this.headingVector.copy(toVec3);
        this.headingVector.sub(fromVec3);
        this.headingVector.normalize();

    }

    applyHeadingToGamePiece(gamePiece, frameTravelDistance) {
        tempVec.copy(this.headingVector);
        tempVec.multiplyScalar(frameTravelDistance);
        tempVec.add(gamePiece.getPos());
        gamePiece.getSpatial().setPosVec3(tempVec);
        if (!gamePiece.getTarget()) {
            tempVec.copy(this.headingVector);
            tempVec.add(gamePiece.getPos());
            tempVec.y = gamePiece.getPos().y;
            gamePiece.getSpatial().obj3d.lookAt(tempVec);
        }

    }

    processTilePathMovement(onArriveCB, tpf, gameTime) {
        let pathTiles = this.tilePath.getTiles();
        if (pathTiles.length > 1) {
            this.hasArrived = false;
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:this.tilePath.getEndTile().getPos(), color:'GREEN', size:0.15})
        }
        if (this.hasArrived===true) {
            return;
        }
        let gamePiece = this.gamePiece;
        drawPathTiles(pathTiles);
        let targetTile = gamePiece.getCurrentPathTile();

        let charSpeed = gamePiece.getStatusByKey('move_speed');
        let frameTravelDistance = charSpeed * tpf / GameAPI.getTurnStatus().turnTime

        if (pathTiles.length > 1) {

            // Move towards next tile, assuming index 0 is close enough
       //     evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:pathTiles[0].getPos(), color:'GREEN', size:0.3})
        //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:pathTiles[1].getPos(), color:'YELLOW', size:0.3})
                targetTile = pathTiles[1]
        //    this.setMovementHeadingVector(gamePiece.getPos(), )
        } else {
            // final tile is near or reached, path end point
            if (pathTiles.length !== 0) {
                targetTile = pathTiles[0]
            //    this.setMovementHeadingVector(gamePiece.getPos(), pathTiles[0].getPos())
       //         evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:gamePiece.getPos(), color:'ORANGE', size:0.5})
            } else {

            }
        }
        this.setMovementHeadingVector(gamePiece.getPos(), targetTile.getPos())

            let turnDistance = MATH.distanceBetween(gamePiece.getPos(), this.tilePath.getTurnEndTile().getPos())
            if (turnDistance > frameTravelDistance) {

                this.applyHeadingToGamePiece(gamePiece, frameTravelDistance);
       //         evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:gamePiece.getPos(), color:'CYAN', size:0.4})
            } else {
        //        console.log("Turn path ended")
                this.applyHeadingToGamePiece(gamePiece, turnDistance);
         //       evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:gamePiece.getPos(), color:'RED', size:0.5})
                if (gamePiece.getCurrentPathTile() === this.tilePath.getEndTile()) {
                    gamePiece.getSpatial().call.setStopped();
                    this.hasArrived = true;
                    onArriveCB()
                } else {
                    if (this.tilePath.getEndTile()) {
                        gamePiece.movementPath.determineGridPathToPos(this.tilePath.getEndTile().getPos());
                    }
                }
            }
        if (gamePiece.getCurrentPathTile() === pathTiles[1]) {
            pathTiles.shift();
        }

    }

    updatePathWalker(onArriveCB, tpf, gameTime) {
        this.processTilePathMovement(onArriveCB, tpf, gameTime)
    }

}

export { PathWalker }