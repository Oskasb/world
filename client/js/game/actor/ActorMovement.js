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
            actor.activateWalkGrid(1+ actor.getStatus(ENUMS.ActorStatus.MOVEMENT_SPEED) * 2 )
            console.log("MOVE ACTION - activate")
            actor.actorText.say("Grid Activate")
        } else {

            if (tileSelector.hasValue()) {

                    if (tileSelector.extendedDistance > 0.8) {
                        actor.prepareTilePath(tileSelector.getPos());
                    } else {
                        walkGrid.clearGridTilePath()
                    }

                    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:actor.getPos(), color:'CYAN', size:0.5})
                    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:actor.getPos(), to:tileSelector.getPos(), color:'CYAN'});
                    if (tileCount !== walkGrid.getActivePathTiles().length) {
                        actor.actorText.say("Path length: "+walkGrid.getActivePathTiles().length)
                        tileCount = walkGrid.getActivePathTiles().length
                    }

                actor.turnTowardsPos(tileSelector.getPos() , GameAPI.getFrame().avgTpf * tileSelector.extendedDistance * 0.3);
            } else {

                if (walkGrid.getActivePathTiles().length) {
                    actor.actorText.say("Cancel Active Path")
                    walkGrid.getActiveTilePath().cutTilePath();
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
                actor.actorText.say("Path Selected")

                actor.prepareTilePath(tileSelector.getPos());
                //    actor.moveActorOnGridTo(tileSelector.getPos(), walkGrid.call.deactivate)
                walkGrid.applySelectedPath(this.call.pathingUpdate, this.call.pathingCompleted)
            } else {
                    actor.actorText.say("No Path")
                    //   actor.prepareTilePath(tileSelector.getPos());
                    //    actor.moveActorOnGridTo(tileSelector.getPos(), walkGrid.call.deactivate)
                    //   walkGrid.applySelectedPath(this.call.pathingUpdate, this.call.pathingCompleted)
                    walkGrid.clearGridTilePath()
            //        walkGrid.call.deactivate();

            }


            tileSelector.moveAlongX(0);
            tileSelector.moveAlongZ(0);
        }
    }

    leapSelectionActive(actor) {
        let walkGrid = actor.getGameWalkGrid();
        let tileSelector = walkGrid.gridTileSelector;
        actor.getGameWalkGrid().dynamicWalker.isLeaping = true;
        actor.getGameWalkGrid().dynamicWalker.attachFrameLeapEffect(actor.actorObj3d)

        actor.setStatusKey(ENUMS.ActorStatus.SELECTING_DESTINATION, 1);

        if (!walkGrid.isActive) {
            actor.activateWalkGrid(7);
            walkGrid.dynamicWalker.isLeaping = true;
            console.log("LEAP ACTION - activate")
            actor.actorText.say("Destination")
        } else {

            if (tileSelector.hasValue()) {
                console.log("LEAP ACTION - update")

                walkGrid.updateGridCenter(tileSelector.getPos())
                if (tileSelector.hasValue()) {
                    actor.turnTowardsPos(tileSelector.getPos() , GameAPI.getFrame().avgTpf * tileSelector.extendedDistance * 0.1);
                }
                let tileUpdate = walkGrid.updateWalkGrid()
                if (tileUpdate) {
                    visualPath.clearVisualPath();
                    let tile = walkGrid.getTileAtPosition(tileSelector.getPos())
                    let distance = MATH.distanceBetween(tile.getPos(), actor.getPos());
                    visualPath.drawVisualPath(actor.getPos(), tile.getPos(), distance*2, 'BLUE', colorsRgba['BLUE'], true)
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
            let distance = MATH.distanceBetween(tile.getPos(), actor.getPos());
            actor.actorText.say("Leap")
            walkGrid.dynamicWalker.attachFrameLeapTransitionFx(actor.actorObj3d)
            let onArrive = function(pos) {
                walkGrid.dynamicWalker.attachFrameLeapTransitionFx(actor.actorObj3d)
                walkGrid.dynamicWalker.isLeaping = false;
                console.log("LEAP COMPLETED")
                actor.actorText.say("Distance "+MATH.numberToDigits(distance, 1, 1)+"m")
                walkGrid.updateGridCenter(pos);
                actor.setStatusKey(ENUMS.ActorStatus.TRAVEL_MODE, ENUMS.TravelMode.TRAVEL_MODE_WALK);
            }

            let lastPos

            let onFrameUpdate = function(pos) {
                walkGrid.dynamicWalker.isLeaping = true;
                walkGrid.dynamicWalker.attachFrameLeapEffect(actor.actorObj3d)
            }

            this.spatialTransition.initSpatialTransition(actor.getPos(), tile.getPos(), 1+distance*0.2, onArrive, distance*0.3, null, onFrameUpdate)

            tileSelector.moveAlongX(0);
            tileSelector.moveAlongZ(0);
            walkGrid.deactivateWalkGrid()
        }
    }

}

export {ActorMovement}