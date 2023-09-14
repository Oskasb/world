import {Vector3} from "../../../libs/three/math/Vector3.js";
let tempVec = new Vector3()


class DynamicWalker {
    constructor() {

        this.headingVector = new Vector3();
        this.walkPos = new Vector3()

        let updateWalker = function(tpf) {
            this.processTilePathMovement(tpf);
        }.bind(this)

        let walkDynamicPath = function(tilePath, walkGrid) {
            this.walkGrid = walkGrid;
            this.walkObj3d = walkGrid.getGridMovementObj3d();
            this.walkPos.copy(this.walkObj3d.position);
            this.tilePath = tilePath;
            this.walkObj3d.position.copy(tilePath.pathTiles[0].getPos())
            GameAPI.unregisterGameUpdateCallback(updateWalker);
            GameAPI.registerGameUpdateCallback(updateWalker);
        }.bind(this);

        let clearDynamicPath = function () {
            GameAPI.unregisterGameUpdateCallback(updateWalker);
        }

        this.call = {
            updateWalker:updateWalker,
            walkDynamicPath:walkDynamicPath,
            clearDynamicPath:clearDynamicPath,
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
        tempVec.add(this.walkPos)
        obj3d.position.set(0, 0, 0);
        obj3d.lookAt(this.headingVector);
        obj3d.position.copy(tempVec);
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:obj3d.position, color:'GREEN', size:0.5})
    }

    processTilePathMovement(tpf, gameTime) {
        this.walkPos.copy(this.walkObj3d.position)
        let currentPos = this.walkPos
        let pathTiles = this.tilePath.getTiles();
        let targetTile = this.tilePath.getEndTile();

        let charSpeed = 4;
        let frameTravelDistance = charSpeed * tpf // GameAPI.getTurnStatus().turnTime

        if (pathTiles.length > 1) {
            targetTile = pathTiles[1]
        } else {
            // final tile is near or reached, path end point
            if (pathTiles.length !== 0) {
                targetTile = pathTiles[0]
            }
        }

        this.setMovementHeadingVector(currentPos, targetTile.getPos())

        let pathRemainingDistance = MATH.distanceBetween(currentPos, this.tilePath.getEndTile().getPos())

        frameTravelDistance = Math.min(pathRemainingDistance , frameTravelDistance)

        this.applyHeadingToGamePiece(this.walkObj3d, frameTravelDistance);
        let currentTile = this.walkGrid.getTileAtPosition(this.walkObj3d.position)
        MATH.callAll(this.tilePath.pathingUpdateCallbacks, this.tilePath, this.walkObj3d)

        if (pathRemainingDistance <= frameTravelDistance) {

            console.log("Path End Tile Reached")
            this.walkGrid.deactivateWalkGrid();
            GameAPI.unregisterGameUpdateCallback(this.call.updateWalker);

        }

        if (currentTile === pathTiles[1]) {
            pathTiles[0].clearPathIndication();
            pathTiles.shift();
        }

    }

}

export { DynamicWalker }