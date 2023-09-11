import {Vector3} from "../../../libs/three/math/Vector3.js";
let tempVec = new Vector3()


class DynamicWalker {
    constructor() {

        this.headingVector = new Vector3();

        let updateWalker = function(tpf, gameTime) {
            this.processTilePathMovement(tpf);
        }.bind(this)

        let walkDynamicPath = function(tilePath, obj3d) {
            this.walkObj3d = obj3d;
            this.tilePath = tilePath;
            GameAPI.unregisterGameUpdateCallback(updateWalker);
            GameAPI.registerGameUpdateCallback(updateWalker);

        }.bind(this);

        this.call = {
            updateWalker:updateWalker,
            walkDynamicPath:walkDynamicPath
        }

    }


    setMovementHeadingVector(fromVec3, toVec3) {
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:fromVec3, to:toVec3, color:'GREEN'})
        this.headingVector.copy(toVec3);
        this.headingVector.sub(fromVec3);
        this.headingVector.normalize();
    }

    applyHeadingToGamePiece(obj3d, frameTravelDistance) {
        tempVec.copy(this.headingVector);
        tempVec.multiplyScalar(frameTravelDistance);
        tempVec.add(obj3d.position)
        obj3d.position.set(0, 0, 0);
        obj3d.lookAt(this.headingVector);
        obj3d.position.copy(tempVec);
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:obj3d.position, color:'GREEN', size:0.5})
    }

    processTilePathMovement(tpf, gameTime) {

        let pathTiles = this.tilePath.getTiles();

        let targetTile = this.tilePath.getEndTile();

        let charSpeed = 4;
        let frameTravelDistance = charSpeed * tpf // GameAPI.getTurnStatus().turnTime

        if (pathTiles.length > 1) {

            // Move towards next tile, assuming index 0 is close enough
       //     evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:pathTiles[0].getPos(), color:'GREEN', size:0.3})
        //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:pathTiles[1].getPos(), color:'YELLOW', size:0.3})
        //    if (pathTiles[1].hidden === false) {
                targetTile = pathTiles[1]
        //    }

        //    this.setMovementHeadingVector(gamePiece.getPos(), )
        } else {
            // final tile is near or reached, path end point
            if (pathTiles.length !== 0 && (pathTiles[0].hidden === false)) {
                targetTile = pathTiles[0]
            //    this.setMovementHeadingVector(gamePiece.getPos(), pathTiles[0].getPos())
       //         evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:gamePiece.getPos(), color:'ORANGE', size:0.5})
            } else {

            }
        }

        let currentPos = this.walkObj3d.position

        this.setMovementHeadingVector(currentPos, targetTile.getPos())

            let currentTile = GameAPI.gameMain.getGridTileAtPos(this.walkObj3d.position)
            let turnDistance = MATH.distanceBetween(currentPos, this.tilePath.getTurnEndTile().getPos())
            if (turnDistance > frameTravelDistance) {

                this.applyHeadingToGamePiece(this.walkObj3d, frameTravelDistance);
                MATH.callAll(this.tilePath.pathingUpdateCallbacks, this.walkObj3d)
       //         evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:gamePiece.getPos(), color:'CYAN', size:0.4})
            } else {
        //        console.log("Turn path ended")
                this.applyHeadingToGamePiece(this.walkObj3d, turnDistance);
         //       evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:gamePiece.getPos(), color:'RED', size:0.5})

                if (currentTile === this.tilePath.getEndTile()) {

                //    gamePiece.getSpatial().call.setStopped();
                    console.log("Path End Tile Reached")
                    MATH.callAndClearAll(this.tilePath.pathCompetedCallbacks, this.walkObj3d)
                    MATH.callAndClearAll(this.tilePath.pathingUpdateCallbacks, this.walkObj3d)
                    GameAPI.unregisterGameUpdateCallback(this.call.updateWalker);
                    // onArriveCB()
                } else {
                    if (this.tilePath.getEndTile()) {
                        // gamePiece.movementPath.determineGridPathToPos(this.tilePath.getEndTile().getPos());
                        console.log("Continue Path Walker")
                    }
                }
            }
            if (currentTile === pathTiles[1]) {
                pathTiles[0].clearPathIndication();
                pathTiles.shift();
            }

        }

}

export { DynamicWalker }