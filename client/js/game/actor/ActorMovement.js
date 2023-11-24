import {SpatialTransition} from "../piece_functions/SpatialTransition.js";
import {VisualPath} from "../visuals/VisualPath.js";

let colorsRgba = {
    BLUE:{r:0.015, g:0.05, b:0.2, a:1}
}

let visualPath = new VisualPath()
let tileCount = 0;
class ActorMovement {
    constructor() {

        this.spatialTransition = new SpatialTransition();

         let pathingUpdate = function() {

         }

        let pathingCompleted = function() {
console.log("Pathing Completed")
        }

        this.call = {
            pathingUpdate:pathingUpdate,
            pathingCompleted:pathingCompleted
        }
    }


    tileSelectionActive(actor) {
        let walkGrid = actor.getGameWalkGrid();

        if ((actor.getStatus(ENUMS.ActorStatus.FRAME_TRAVEL_DISTANCE) !== 0) && MATH.valueIsBetween(walkGrid.getActivePathTiles().length, 1, 2)) {
            return;
        }

        let tileSelector = walkGrid.gridTileSelector;

        actor.setStatusKey(ENUMS.ActorStatus.SELECTING_DESTINATION, 1);
        if (!walkGrid.isActive) {
            actor.activateWalkGrid(1+ actor.getStatus(ENUMS.ActorStatus.MOVEMENT_SPEED) * 4 )
            console.log("MOVE ACTION - activate")
            actor.actorText.say("Grid Stick")
        } else {

            if (tileSelector.hasValue()) {

                    if (tileSelector.extendedDistance > 0.8) {
                        actor.prepareTilePath(tileSelector.getPos());
                    } else {
                        walkGrid.clearGridTilePath()
                    }

                    actor.turnTowardsPos(tileSelector.getPos() , GameAPI.getFrame().avgTpf * tileSelector.extendedDistance * 0.3);

                    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:actor.getSpatialPosition(), color:'CYAN', size:0.5})
                    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:actor.getSpatialPosition(), to:tileSelector.getPos(), color:'CYAN'});
                    if (tileCount !== walkGrid.getActivePathTiles().length) {
                    //    actor.actorText.say("Path length: "+walkGrid.getActivePathTiles().length)
                        tileCount = walkGrid.getActivePathTiles().length
                    }

            //    actor.turnTowardsPos(tileSelector.getPos() , GameAPI.getFrame().avgTpf * tileSelector.extendedDistance * 0.3);
            } else {

                if (walkGrid.getActivePathTiles().length > 1) {
                    actor.actorText.say("Cancel Active Path")
                    walkGrid.getActiveTilePath().cutTilePath();
                } else if (walkGrid.getActivePathTiles().length === 1) {
                    actor.actorText.say("Single Tile Path")
                    walkGrid.getActiveTilePath().clearTilePath();
                }



            }
        }
    }

    tileSelectionCompleted(actor) {
        let walkGrid = actor.getGameWalkGrid();
        let tileSelector = walkGrid.gridTileSelector;
        if (walkGrid.isActive && tileSelector.hasValue()) {
            actor.setStatusKey(ENUMS.ActorStatus.SELECTING_DESTINATION, 0);
            let tileSelector = walkGrid.gridTileSelector;
            if (walkGrid.getActivePathTiles().length > 1) {
                console.log("MOVE ACTION - Complete, tiles: ", walkGrid.getActiveTilePath().getRemainingTiles())
                actor.actorText.say("Move "+walkGrid.getActivePathTiles().length+" tiles")

                actor.prepareTilePath(tileSelector.getPos());
                //    actor.moveActorOnGridTo(tileSelector.getPos(), walkGrid.call.deactivate)
                walkGrid.applySelectedPath(this.call.pathingUpdate, this.call.pathingCompleted)

            } else {

                    actor.actorText.say("No Path")
                    actor.getSpatialPosition(tileSelector.getPos())
                    walkGrid.clearGridTilePath()
                    actor.setControlKey(ENUMS.ActorStatus.CONTROL_MOVE_ACTION, 0);

            }
            tileSelector.moveAlongX(0);
            tileSelector.moveAlongZ(0);

        } else if (walkGrid.isActive) {
        //    actor.actorText.say("No Input")
        }
    }

    leapSelectionActive(actor) {
        let walkGrid = actor.getGameWalkGrid();
        let tileSelector = walkGrid.gridTileSelector;
        actor.setStatusKey(ENUMS.ActorStatus.IS_LEAPING, true)
        actor.getGameWalkGrid().dynamicWalker.attachFrameLeapEffect(actor)

        actor.setStatusKey(ENUMS.ActorStatus.SELECTING_DESTINATION, 1);

        if (!walkGrid.isActive) {
            actor.activateWalkGrid(7);
            console.log("LEAP ACTION - activate")
            actor.actorText.say("Destination")
        } else {

            if (tileSelector.hasValue()) {
                console.log("LEAP ACTION - update")

                walkGrid.setGridCenter(tileSelector.getPos())
                if (tileSelector.hasValue()) {
                    actor.turnTowardsPos(tileSelector.getPos() , GameAPI.getFrame().avgTpf * tileSelector.extendedDistance * 0.1);
                }
                let tileUpdate = walkGrid.updateWalkGrid()
                if (tileUpdate) {
                    visualPath.clearVisualPath();
                    let tile = walkGrid.getTileAtPosition(tileSelector.getPos())
                    let distance = MATH.distanceBetween(tile.getPos(), actor.getSpatialPosition());
                    visualPath.drawVisualPath(actor.getSpatialPosition(), tile.getPos(), distance*2, 'BLUE', colorsRgba['BLUE'], true)
                }
            }
        }
    }

    leapSelectionCompleted(actor) {
        let walkGrid = actor.getGameWalkGrid();
        visualPath.clearVisualPath();

        if (walkGrid.isActive) {
            let tileSelector = walkGrid.gridTileSelector;
            actor.setStatusKey(ENUMS.ActorStatus.SELECTING_DESTINATION, 0);
            console.log("LEAP SELECTED")

            actor.setStatusKey(ENUMS.ActorStatus.TRAVEL_MODE, ENUMS.TravelMode.TRAVEL_MODE_LEAP);
            let tile = walkGrid.getTileAtPosition(tileSelector.getPos())
            let distance = MATH.distanceBetween(tile.getPos(), actor.getSpatialPosition());
            actor.actorText.say("Leap")
            walkGrid.dynamicWalker.attachFrameLeapTransitionFx(actor)
            let onArrive = function(pos) {
                walkGrid.dynamicWalker.attachFrameLeapTransitionFx(actor)
           //     walkGrid.dynamicWalker.isLeaping = false;
                actor.setStatusKey(ENUMS.ActorStatus.IS_LEAPING, false)
                console.log("LEAP COMPLETED")
                actor.actorText.say("Distance "+MATH.numberToDigits(distance, 1, 1)+"m")
                walkGrid.setGridCenter(actor.getSpatialPosition());
                actor.setStatusKey(ENUMS.ActorStatus.TRAVEL_MODE, ENUMS.TravelMode.TRAVEL_MODE_WALK);
            }

            let lastPos

            let onFrameUpdate = function(pos) {
                // walkGrid.dynamicWalker.isLeaping = true;
                actor.setStatusKey(ENUMS.ActorStatus.IS_LEAPING, true)
                walkGrid.dynamicWalker.attachFrameLeapEffect(actor)
            }

            this.spatialTransition.initSpatialTransition(actor.getSpatialPosition(), tile.getPos(), 1+distance*0.2, onArrive, distance*0.3, null, onFrameUpdate)

            tileSelector.moveAlongX(0);
            tileSelector.moveAlongZ(0);
            walkGrid.deactivateWalkGrid()
        }
    }

}

export {ActorMovement}