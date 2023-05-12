import { TargetIndicator } from "../gui/game/TargetIndicator.js";
import { Vector3 } from "../../../../libs/three/math/Vector3.js";
let tempVec3 = new Vector3()
let tempVec3b = new Vector3()

class GameWorldPointer {
    constructor() {
        this.isActive = false;
        this.posVec = new THREE.Vector3()
        this.lastSelectedTile = null;
        this.indicatedSelections = [];
        this.selectionEvent = {
            isOpen:null,
            piece:null,
            value:false,
            longPress:0
        }

        let exitLongPress = function(pointer, selectionEvent) {
            this.exitLongPress(pointer, selectionEvent)
        }.bind(this)

        let updateGameWorldPointer = function(pointer, isFirstPressFrame) {
            this.updateWorldPointer(pointer, isFirstPressFrame)
        }.bind(this)


        this.call = {
            pointerExitLongPress:exitLongPress,
            pointerEnterLongPress:this.enterLongPress,
            indicateSelection:this.indicateSelection,
            updateGameWorldPointer:updateGameWorldPointer
        }
    }



    worldPointerFindPath(pointer) {
        let playerPiece = GameAPI.getMainCharPiece();
        let targetPos = null
        if (pointer.worldSpaceTarget && (pointer.worldSpaceTarget !== playerPiece)) {
            //    targetPos = pointer.worldSpaceTarget.getPos();
            playerPiece.movementPath.setPathTargetPiece(pointer.worldSpaceTarget)
        } else {
            if (this.lastSelectedTile) {
                targetPos = this.lastSelectedTile.getPos();
                playerPiece.movementPath.determineGridPathToPos(targetPos)
            }
        }

    }



    indicateSelection = function(bool, pointer, selection) {
        if (bool) {

            if (MATH.arrayContains(this.indicatedSelections, selection)) {
                return pointer.worldSpaceIndicator;
            }
            this.indicatedSelections.push(selection);
            selection.pieceInfoGui.activatePieceInfoGui()
            let indicator = pointer.worldSpaceIndicator;
            if (!indicator) {
                indicator = new TargetIndicator()
                pointer.worldSpaceIndicator = indicator;
                indicator.indicateGamePiece(selection, 'effect_character_indicator', 1, 3, -1.5,1.2, 0, 4);
            }
            return indicator
        } else {
            MATH.quickSplice(this.indicatedSelections, selection);
            pointer.worldSpaceIndicator.removeTargetIndicatorFromPiece(selection);
            pointer.worldSpaceIndicator.hideIndicatorFx();
            selection.pieceInfoGui.deactivatePieceInfoGui()
        }
    }

    enterLongPress(pointer, selectionEvent, calls) {
    //    console.log("Long Press: ", pointer, pointer.worldSpaceTarget)
        selectionEvent.longPress = pointer.call.getLongPressProgress();
        selectionEvent.piece = pointer.worldSpaceTarget;
        if (pointer.worldSpaceTarget === null) {
        //    console.log("Long press nothing")
        //    pointer.isMovementInput = true;
        //    calls.updateGameWorldPointer(pointer)
        } else {
        //    console.log("Long press", pointer.worldSpaceTarget)
            selectionEvent.value = true;
            selectionEvent.isOpen = pointer.worldSpaceTarget;
            evt.dispatch(ENUMS.Event.MAIN_CHAR_OPEN_TARGET,  selectionEvent);
        }

    }

    exitLongPress(pointer, selectionEvent) {
        if (selectionEvent.isOpen !== null) {
            console.log("Release Long Press: ", pointer.inputIndex, pointer.isLongPress, pointer.longPressProgress, pointer.worldSpaceTarget)
            selectionEvent.piece = selectionEvent.isOpen;
            selectionEvent.value = false;
            selectionEvent.isOpen = null;
            evt.dispatch(ENUMS.Event.MAIN_CHAR_OPEN_TARGET,  selectionEvent);
        }
    }
    worldPointerReleased = function(pointer) {
        let call = this.call;
        //    if (typeof(this.selectionEvent.isOpen) === 'object') {

        //    }

        if (GuiAPI.calls.getInMenu() === true) {
            return;
        }
        call.pointerExitLongPress(pointer, this.selectionEvent);
        this.selectionEvent.isOpen = null;
        let playerPiece = GameAPI.getMainCharPiece();
        //    console.log("Release Movement Pointer")
        playerPiece.movementPath.clearTilePathStatus();

        this.selectionEvent.longPress = pointer.call.getLongPressProgress();

        if (pointer.worldSpaceTarget && (pointer.worldSpaceTarget !== playerPiece)) {
            this.indicateSelection(false, pointer, pointer.worldSpaceTarget)
            this.selectionEvent.piece = pointer.worldSpaceTarget;
            this.selectionEvent.value = true;
            evt.dispatch(ENUMS.Event.MAIN_CHAR_SELECT_TARGET,  this.selectionEvent);
        } else if (pointer.isMovementInput) {
            if (this.lastSelectedTile) {
                //    this.lastSelectedTile.setTileStatus('OCCUPIED');

            }
        } else {
            this.selectionEvent.piece = null;
            this.selectionEvent.value = false;
            evt.dispatch(ENUMS.Event.MAIN_CHAR_SELECT_TARGET,  this.selectionEvent);
        }

        if (pointer.worldSpaceTarget === playerPiece) {
            this.indicateSelection(false, pointer, pointer.worldSpaceTarget)
            this.selectionEvent.piece = pointer.worldSpaceTarget;
            this.selectionEvent.value = true;
            evt.dispatch(ENUMS.Event.MAIN_CHAR_SELECT_TARGET,  this.selectionEvent);
        }
        pointer.worldSpaceTarget = null;
        pointer.isMovementInput = false;
        pointer.isWorldActive = false;
        pointer.setLongPressProgress(0) //
    }
    updateWorldPointer = function(pointer, isFirstPressFrame) {
        let playerPiece = GameAPI.getMainCharPiece()
        if (GuiAPI.calls.getInMenu() === true) {
            return;
        }

        if (isFirstPressFrame) {
            pointer.isWorldActive = true;
            //    console.log("Press first frame: ", pointer.inputIndex, pointer.isLongPress, pointer.longPressProgress, pointer.worldSpaceTarget)
        } else {
            let longPress = pointer.call.getLongPressProgress()
            //    console.log(longPress);
            if (longPress >= 1 && pointer.longPressProgress < 1) {
                pointer.setLongPressProgress(longPress);
                this.call.pointerEnterLongPress(pointer, this.selectionEvent, this.call);
            }
            pointer.setLongPressProgress(longPress);
        }

        if (pointer.isWorldActive === false) {
            return;
        }

        let indicator =  pointer.worldSpaceIndicator
        let pos = this.posVec.copy(pointer.pos);
        //   GameScreen.fitView(pos);

        pos.x *= 1 / GameScreen.getAspect()                  // X is Left axis
        pos.y *= 1 // Y is UP screen axis
        let dynamicScenario = GameAPI.getActiveDynamicScenario();
        let characters = dynamicScenario.characters;
        let pieces = dynamicScenario.pieces;

        let nearestDist = 99999;
        let screenSelection = null;

        let maxSelectRange = 0.10;

        let tempVecY = ThreeAPI.tempVec3;
        let screenDistance = function(piecePos, select, offsetY) {
            tempVecY.copy(piecePos);
            tempVecY.y += offsetY;
            ThreeAPI.toScreenPosition(tempVecY, tempVec3b)
            tempVec3b.sub(pos)
            let distance = tempVec3b.length();
            if (distance < maxSelectRange) {
                if (distance < nearestDist) {
                    screenSelection = select;
                    nearestDist = distance;
                }
            }
        }

        for (let i = 0; i < pieces.length; i++) {
            let gamePiece = pieces[i];
            if (gamePiece.isDead) {

            } else {
                gamePiece.getSpatial().getSpatialPosition(tempVec3)
                screenDistance(tempVec3,  gamePiece, gamePiece.getStatusByKey('height')*0.5);
            }
        }

        tempVec3.copy(playerPiece.getPos());
        screenDistance(tempVec3, playerPiece, playerPiece.getStatusByKey('height')*0.5)

        let companions = playerPiece.companions
        for (let i = 0; i < companions.length; i++) {
            tempVec3.copy(companions[i].getPos());
            screenDistance(tempVec3, companions[i], companions[i].getStatusByKey('height')*0.7)
        }

        for (let i = 0; i < characters.length; i++) {
            let gamePiece = characters[i].gamePiece
            if (gamePiece.isDead) {

            } else {
                gamePiece.getSpatial().getSpatialPosition(tempVec3)
                ThreeAPI.toScreenPosition(tempVec3, tempVec3b)
                screenDistance(tempVec3, gamePiece, gamePiece.getStatusByKey('height')*0.7);
            }
        }


        let worldSelection = screenSelection;
        let updateWorldPointer = function() {
            if (GuiAPI.calls.getInMenu() === true) {
                return;
            }
            if (worldSelection) {

                if (pointer.worldSpaceTarget !== worldSelection) {
                    //         console.log("Change selected Target")

                    if (pointer.worldSpaceTarget) {
                        this.indicateSelection(false, pointer, pointer.worldSpaceTarget)
                    }

                    this.indicateSelection(true, pointer, worldSelection)


                } else {
                    indicator.call.updateIndicator(0.01, GameAPI.getGameTime(), worldSelection, 1.2, 0.8);
                }

                pointer.worldSpaceTarget = worldSelection;
                let rangeCheck = GameAPI.getMainCharPiece().distanceToReachTarget(worldSelection)
                if (rangeCheck > 0) {
                if (pointer.isMovementInput) {
                    this.worldPointerFindPath(pointer)
                }

                }

            } else {
                if (pointer.worldSpaceTarget) {
                    this.indicateSelection(false, pointer, pointer.worldSpaceTarget)
                    if (!this.selectionEvent) {
                        console.log("Some multi-touch issue here")
                    } else {
                        if (pointer.isMovementInput) {

                        } else {
                            this.selectionEvent.piece = pointer.worldSpaceTarget;
                            this.selectionEvent.value = false;

                            evt.dispatch(ENUMS.Event.MAIN_CHAR_SELECT_TARGET, this.selectionEvent);
                        }

                    }


                }
                pointer.worldSpaceTarget = null;
            }
        }.bind(this);

        let updateMovementPointer = function() {
        //    console.log("move...")

            if (worldSelection) {
                if (worldSelection.getStatusByKey('faction') === 'EVIL')
                    return;
            }

            if (this.selectionEvent.isOpen !== null) {
                return;
            }

            if (GuiAPI.calls.getInMenu() === true || pointer.isWorldActive === false) {
                return;
            }
            let encounterGrid = GameAPI.getActiveEncounterGrid()
            let tiles = encounterGrid.gridTiles
            screenSelection = null;
            maxSelectRange = 0.5
            if (tiles.length) {
                for (let i = 0; i < tiles.length; i++) {
                    for (let j = 0; j < tiles[i].length; j++) {
                        let tile = tiles[i][j]
                        let pos = tile.obj3d.position;
                        screenDistance(pos, tile, 0);
                    }
                }
            }

            let selectedTile = screenSelection;

            if (selectedTile) {
                if (this.lastSelectedTile !== selectedTile) {
                    if (this.lastSelectedTile) {
                        this.lastSelectedTile.indicateTileStatus(false)
                    }
                    this.lastSelectedTile = selectedTile
                    selectedTile.indicateTileStatus(false);
                    selectedTile.setTileStatus('MOVE_TO');
                    selectedTile.indicateTileStatus(true)

                }
                if (pointer.isMovementInput) {
                    this.worldPointerFindPath(pointer);
                } else {
                    playerPiece.movementPath.applyPathPointCameraModifiers(selectedTile.getPos())
                }

            }

        }.bind(this);

        if (screenSelection === playerPiece && isFirstPressFrame) {
        //    pointer.isMovementInput = true;
            //    console.log(pointer)
        }

        if ((screenSelection === null) && isFirstPressFrame) {
            pointer.isMovementInput = true;
            //    console.log("nothing move", pointer)
        }

    //    if (pointer.isMovementInput) {
            updateMovementPointer();
    //    }
        updateWorldPointer()

    }

    worldPointerDeactivate(pointer) {
        pointer.isWorldActive = false;
    }

}

export { GameWorldPointer }