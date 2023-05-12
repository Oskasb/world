import { TilePath } from "./TilePath.js";
import { PathWalker } from "./PathWalker.js";

class MovementPath {
    constructor(gamePiece) {
        this.tilePath = new TilePath(gamePiece);
        this.tempVec = new THREE.Vector3()
        this.isPathing = false;
        this.gamePiece = gamePiece;
        this.pathTargetPiece = null;
        this.pieceMovement = gamePiece.pieceMovement;
        this.pathTargetPos = new THREE.Vector3();
        this.turnPathEnd = new THREE.Vector3()
        this.currentPosTile = null;
        this.targetPosTile = null;
        this.tempVec = new THREE.Vector3();

        this.pathWalker = new PathWalker(gamePiece, this.tilePath);

        this.lineEvent = {
            from:new THREE.Vector3(),
            to: new THREE.Vector3(),
            color:'CYAN'
        }

        let onTurnEnd = function() {
            this.gamePiece.setStatusValue('turn_moves', 0);
            GameAPI.unregisterGameTurnCallback(this.callbacks.onTurnEnd);
        }.bind(this)

        let onPathEnd = function(endTile) {
            let turn = GameAPI.getTurnStatus().turn
            let name = this.gamePiece.getStatusByKey('name')
            let hasTarget = this.gamePiece.getTarget()
            onTurnEnd();
        //    let currentTile = this.getTileAtPos(this.gamePiece.getPos());
            if (!this.tilePath.getEndTile()) {
        //        GuiAPI.printDebugText("No destination at path end: "+ name)
        //        console.log("sometimes no destination tile", this)
                this.cancelMovementPath();
            }

            if (endTile !== this.tilePath.getEndTile()) {

           //     if (hasTarget) {
           //         GuiAPI.printDebugText("No extend in combat: "+name+" turn: "+turn)
           //         this.cancelMovementPath();
           //     } else {
           //         GuiAPI.printDebugText("Path extend turn: "+name+" turn: "+turn)
                    GameAPI.registerGameTurnCallback(this.callbacks.updatePathTurn);
           //     }

            } else {
         //       console.log("Path final tile reached", name)
          //      GuiAPI.printDebugText("Path end: "+name+" cbs:"+this.pathEndCallbacks.length)
                MATH.callAndClearAll(this.pathEndCallbacks, this.gamePiece)
                this.cancelMovementPath();
            }
        }.bind(this);

        let updatePathTurn = function(turnStatus) {
        //    let hasTarget = this.gamePiece.getTarget()
       //     let name = this.gamePiece.getStatusByKey('name')
            GameAPI.unregisterGameTurnCallback(this.callbacks.updatePathTurn);

       //     if (hasTarget) {
       //         GuiAPI.printDebugText("Path ends on combat turn: "+name+" turn: "+turn)
      //          this.cancelMovementPath();
      //          return;
       //     }

            if (!this.tilePath.getEndTile()) {
      //          GuiAPI.printDebugText("No destination at turn end: "+name)
                this.cancelMovementPath();
     //           console.log("sometimes no destination tile", this)
                return;
            }
            this.determineGridPathToPos(this.tilePath.getPathEndPosVec3());
            this.moveAlongActiveGridPath();
        }.bind(this)

        this.pathEndCallbacks = [];

        this.callbacks = {
            onTurnEnd:onTurnEnd,
            onPathEnd:onPathEnd,
            updatePathTurn:updatePathTurn
        }
    }

    updatePositionOnGrid(encounterGrid) {
        let pos = this.gamePiece.getPos();
        let gridTile = encounterGrid.getTileAtPosition(pos);
        if (!gridTile) {
            console.log("This breaks sometimes... investigate!", pos)
            return;
        }
        if (this.currentPosTile !== gridTile || gridTile.getTileStatus() === 'FREE'){
            if (this.currentPosTile) {
                this.currentPosTile.setTileStatus('FREE');
                this.currentPosTile.indicateTileStatus(false);
            }
            gridTile.indicateTileStatus(false);

            if (this.gamePiece.getStatusByKey('isItem') === 1 && (gridTile.getTileStatus() === 'FREE')) {
                gridTile.setTileStatus('HAS_ITEM')
                gridTile.indicateTileStatus(true);
            } else {
                if (this.gamePiece.getStatusByKey('charState') !== ENUMS.CharacterState.LIE_DEAD) {
                    gridTile.setTileStatus('OCCUPIED')
                    gridTile.setOccupant(this.gamePiece);
                }

            }
        //    gridTile.indicateTileStatus(true);
            this.currentPosTile = gridTile;
        }
    }

    updateMovementOnGrid(){
        if (this.tilePath.getRemainingTiles()){
            let gridTile = this.tilePath.getTurnEndTile();
            if (this.targetPosTile) {
                this.targetPosTile.indicateTileStatus(false);
            }
            gridTile.indicateTileStatus(false);
            gridTile.setTileStatus('MOVE_TO')
            gridTile.indicateTileStatus(true);
            this.targetPosTile = gridTile;
        }
    }


    drawPathLine(from, to, color) {
        this.lineEvent.from.copy(from)
        this.lineEvent.to.copy(to);
        this.lineEvent.color = color || 'CYAN';
  //      evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, this.lineEvent);
    }

    setDestination(posVec) {
        this.tilePath.setEndTile(this.getTileAtPos(posVec))
    }

    clearTilePathStatus() {
        this.isPathing = false;
        this.tilePath.clearTilePath()
    }

    cancelMovementPath() {
        GameAPI.unregisterGameTurnCallback(this.callbacks.onTurnEnd);
        GameAPI.unregisterGameTurnCallback(this.callbacks.updatePathTurn);
        this.pathEndCallbacks = [];
        this.tilePath.setEndTile(null);
        this.pathTargetPiece = null;
        if (this.tilePath.getTiles().length) {
            this.pieceMovement.cancelActiveTransition()
        }
        this.clearTilePathStatus()
    }

    selectTilesBeneathPath(startTile, endTile) {
        this.clearTilePathStatus();
        let startX = startTile.tileX;
        let startZ = startTile.tileZ;
        let endX = endTile.tileX;
        let endZ = endTile.tileZ;
        let gridTiles = GameAPI.getActiveEncounterGrid().gridTiles;

        let xDiff = endX - startX;
        let zDiff = endZ - startZ;

        this.tempVec.copy(startTile.getPos());

        let stepX = 0;
        let stepZ = 0;
        let tileX = startX;
        let tileZ = startZ;
        let incrementX = 0;
        let incrementZ = 0;
        let tileCount = Math.max(Math.abs(xDiff), Math.abs(zDiff));

        this.tilePath.addTileToPath(startTile);
        for (let i = 0; i < tileCount; i++) {

            if (incrementX < Math.abs(xDiff)) {
                incrementX++
            }

            if (incrementZ < Math.abs(zDiff)) {
                incrementZ++
            }

            stepX = incrementX * Math.sign(-xDiff);
            stepZ = incrementZ * Math.sign(-zDiff);

            tileX = gridTiles.length - (startX - stepX);
            tileZ = gridTiles[0].length - (startZ - stepZ);
            let tile = gridTiles[tileX][tileZ];

            let elevation = tile.getPos().y;

            let color = 'YELLOW';

            let occupant = tile.getOccupant()
            if (occupant) {
                if (occupant.getStatusByKey('faction') !== this.gamePiece.getStatusByKey('faction')) {
                    i = tileCount;
                return;
                } else if (occupant.movementPath.tilePath.getEndTile() === tile) {
                    if (tileCount - i === 1) {
                        i = tileCount;
                        return;
                    }
                }
            }

            if (!this.tilePath.getTiles()[i]) {
            //    console.log('Sometimes the path is culled here? it breaks!')
                return;
            }
            if ( Math.abs(elevation) > Math.abs(this.tilePath.getTiles()[i].getPos().y) + 0.7)  {
                this.drawPathLine(this.tempVec, tile.getPos(), 'RED')
                i = tileCount;
            } else {
                this.tilePath.addTileToPath(tile);

                this.drawPathLine(this.tempVec, tile.getPos(), color)
                this.tempVec.copy(tile.getPos());
            }

            if (tile.getPathClaimant()) {
                if (tile.getPathClaimant() !== this.gamePiece) {
           //         evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:tile.getPos(), color:'RED', size:0.3})
                    this.tilePath.getTiles().pop();
                    this.tilePath.setEndTile(this.tilePath.getTiles()[i-1])
                }
            } else {
                tile.setPathClaimant(this.gamePiece);
            }
        }
    }


    buildGridPath(posVec) {

        let cPos = this.gamePiece.getPos();
        this.pathTargetPos.copy(posVec);



        let turnMoves = this.gamePiece.getStatusByKey('turn_moves');
        //   this.pathTargetPos.sub(cPos);
        let speed = this.gamePiece.getStatusByKey('move_speed');
        let remainingTime = GameAPI.getTurnStatus().turnProgress;
        let remainingDistance = MATH.distanceBetween(cPos, posVec)
        if (remainingDistance > speed*remainingTime*0.999) {
            this.turnPathEnd.copy(posVec)
            this.turnPathEnd.sub(cPos);
            this.turnPathEnd.normalize();
            let travelDistance = speed*remainingTime // (1+turnMoves);
        //    travelDistance -= this.getTileAtPos(this.gamePiece.getPos())
            this.turnPathEnd.multiplyScalar(travelDistance);
            this.turnPathEnd.add(cPos);

        } else {
            this.turnPathEnd.copy(posVec);
        }

        this.drawPathLine(cPos, this.turnPathEnd, 'CYAN');
        let endTile = this.getTileAtPos(this.turnPathEnd);
        if (!endTile) {
            console.log("No end tile...")
            return;
        }
        this.turnPathEnd.copy(endTile.getPos());
        this.selectTilesBeneathPath(this.getTileAtPos(cPos), endTile)

    }


    applyPathPointCameraModifiers(posVec) {
        this.tempVec.copy(posVec);
        this.tempVec.y = this.gamePiece.getPos().y;

        if (this.gamePiece.getTarget() === null) {
            this.gamePiece.getSpatial().obj3d.lookAt(this.tempVec);
        }

        this.tempVec.sub(this.gamePiece.getPos());
        this.tempVec.multiplyScalar(0.35);
        GameAPI.getGameCamera().addLookAtModifierVec3(this.tempVec);
        let distanceLookat = MATH.distanceBetween(ThreeAPI.getCamera().position, posVec)
        let distancePlayer = MATH.distanceBetween(ThreeAPI.getCamera().position, this.gamePiece.getPos())
        if (distanceLookat > distancePlayer) {
            this.tempVec.multiplyScalar(-1);
        } else {
            this.tempVec.multiplyScalar(2);
        }

        GameAPI.getGameCamera().addPositionModifierVec3(this.tempVec);
    }

    determineGridPathToPos(posVec) {
        this.cancelMovementPath()
        this.setDestination(posVec);
        this.buildGridPath(posVec)
    }


    moveTroughTilePath(cb, tpf, gameTime) {
        this.pathWalker.updatePathWalker(cb, tpf, gameTime)
    //    this.pieceMovement.moveAlongTilePath(this.tilePath, cb)
    }

    addPathEndCallback(cb) {
        if (this.pathEndCallbacks.indexOf(cb) === -1) {
            this.pathEndCallbacks.push(cb)
        } else {
            console.log("path end cb already installed", cb)
        }

        if (this.pathEndCallbacks.length > 1) {
            console.log("multiple path end callbacks installed, should not be.. removing old")
            this.pathEndCallbacks.shift();
        }
    }

    getTileAtPos = function(posVec3) {
        if (!GameAPI.getActiveEncounterGrid()) {
            console.log("Sometimes no active grid", this)
            return;
        }
        return GameAPI.getActiveEncounterGrid().getTileAtPosition(posVec3);
    }
    moveAlongActiveGridPath(tpf, gameTime) {

        let tileCount = this.tilePath.getTiles().length;
        if (tileCount ){
        //    if (this.isPathing === false) {
                this.moveTroughTilePath(this.callbacks.onPathEnd, tpf, gameTime);
        //    }
            this.isPathing = true;

        } else {
            if (this.isPathing) {
                MATH.callAndClearAll(this.pathEndCallbacks, this.gamePiece)
                this.callbacks.onPathEnd();
                console.log("NO TILE COUNT, Path Ended")
            }
            this.isPathing = false;

        }
    }


    addPathPieceCameraModifiers(posVec) {
        this.applyPathPointCameraModifiers(posVec)
    //    return;
        this.tempVec.copy(posVec);
        this.tempVec.sub(this.gamePiece.getPos())
        this.tempVec.multiplyScalar(0.25);
        GameAPI.getGameCamera().addLookAtModifierVec3(this.tempVec);
        this.tempVec.multiplyScalar(0.55);
        GameAPI.getGameCamera().addPositionModifierVec3(this.tempVec);
    }

    setPathTargetPiece(targetPiece) {
        this.pathTargetPiece = targetPiece;
        this.determinePathToTargetPiece(targetPiece)

        if (this.gamePiece === GameAPI.getMainCharPiece()) {
            this.addPathPieceCameraModifiers(targetPiece.getAboveHead(1))
        }
    }

    selectTileByAttackRangeTo(currentTile, targetPiece) {
        let distanceRemaining = this.gamePiece.distanceToReachTarget(targetPiece);
        if (distanceRemaining > currentTile.size * 0.25) {
            let newTilePos = this.tempVec;
            let dist = distanceRemaining - currentTile.size * 0.25
            let targetTile = this.getTileAtPos(targetPiece.getPos());
            let myCurrentTile = this.getTileAtPos(this.gamePiece.getPos());
       //     let currentDistance = MATH.distanceBetween(currentTile.getPos(), targetTile.getPos());
            MATH.vectorAtPositionTowards(myCurrentTile.getPos(), targetTile.getPos(), dist, newTilePos)
        //    let nextDistance = MATH.distanceBetween(newTilePos, targetTile.getPos());
            let newTargetTile = this.getTileAtPos(newTilePos);
            this.drawPathLine(myCurrentTile.getPos(), newTargetTile.getPos(), 'AQUA');
            if (newTargetTile.getTileStatus() === 'OCCUPIED') {
                return currentTile;
            }
            if (newTargetTile === targetTile) {
                return myCurrentTile;
            } else {
                return newTargetTile;
            }
        } else {
            return currentTile;
        }
    }
    determinePathToTargetPiece(targetPiece) {

        if (!this.tilePath.getEndTile()) {
            this.setDestination(targetPiece.getPos());
        }

    //    let currentTile = this.getTileAtPos(this.gamePiece.getPos())
        let selectedTile = this.selectTileByAttackRangeTo(this.tilePath.getEndTile(), targetPiece);
        if (this.tilePath.getEndTile() !== selectedTile) {
            this.isPathing = false;
            this.tilePath.setEndTile(selectedTile);
        }
    }

    updatePathTiles() {
        if (this.tilePath.getEndTile()) {
            this.drawPathLine(this.turnPathEnd, this.tilePath.getPathEndPosVec3(), 'BLUE');
            if (this.gamePiece === GameAPI.getMainCharPiece()) {
                this.applyPathPointCameraModifiers(this.tilePath.getEndTile().getPos());
            }
        }
    }

    tickMovementPath(tpf, gameTime) {

        let encounterGrid = GameAPI.getActiveEncounterGrid();
        if (encounterGrid) {
            if (encounterGrid.gridTiles.length) {

                if (this.pathTargetPiece) {
                    if (Math.random() < tpf * 10) {
                        this.determinePathToTargetPiece(this.pathTargetPiece);
                    }
                }

                if (this.tilePath.getEndTile()) {
                    if (this.isPathing === false) {
                        this.buildGridPath(this.tilePath.getPathEndPosVec3())
                    }
                }

            //    if (this.isPathing === false) {
            //        if (GameAPI.getTurnStatus().pauseProgress === 0) {
                        this.moveAlongActiveGridPath(tpf, gameTime);
             //       }
            //    }

                this.updatePathTiles()
                this.updateMovementOnGrid(encounterGrid);
                this.updatePositionOnGrid(encounterGrid);
            }
        }
    }

}

export { MovementPath }