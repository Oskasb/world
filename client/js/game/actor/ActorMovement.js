import {SpatialTransition} from "../piece_functions/SpatialTransition.js";
import {VisualPath} from "../visuals/VisualPath.js";
import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";

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
   //         GuiAPI.screenText("SHORT")
            return;
        }

        let tileSelector = walkGrid.gridTileSelector;

        actor.setStatusKey(ENUMS.ActorStatus.SELECTING_DESTINATION, 1);
        if (!walkGrid.isActive) {
    //        GuiAPI.screenText("GRID ACTIVATE")
            actor.activateWalkGrid(1+ actor.getStatus(ENUMS.ActorStatus.MOVEMENT_SPEED) * 4 )
     //       console.log("MOVE ACTION - activate")
    //        actor.actorText.say("Grid Stick")
        } else {

            if (tileSelector.hasValue()) {

                    if (tileSelector.extendedDistance > 0.8) {

                        actor.prepareTilePath(tileSelector.getPos());
            //            evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:actor.getHeadPosition(), to:walkGrid.getGridCenter(), color:'YELLOW'});
                    } else {

                        walkGrid.clearGridTilePath()
                    }

                    actor.turnTowardsPos(tileSelector.getPos() , GameAPI.getFrame().avgTpf * tileSelector.extendedDistance * 0.3);

             //       evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:actor.getSpatialPosition(), color:'CYAN', size:0.5})
            //        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:actor.getSpatialPosition(), to:tileSelector.getPos(), color:'CYAN'});
                    if (tileCount !== walkGrid.getActivePathTiles().length) {
                    //    actor.actorText.say("Path length: "+walkGrid.getActivePathTiles().length)
                    //    GuiAPI.screenText("TILE COUNT CHANGE")
                        tileCount = walkGrid.getActivePathTiles().length
                    }

           //     evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:actor.getHeadPosition(), to:walkGrid.getGridCenter(), color:'YELLOW'});

            //    actor.turnTowardsPos(tileSelector.getPos() , GameAPI.getFrame().avgTpf * tileSelector.extendedDistance * 0.3);
            } else {

                if (walkGrid.getActivePathTiles().length > 1) {
           //         GuiAPI.screenText("CANCEL PATH")
            //        actor.actorText.say("Cancel Active Path")
                    walkGrid.getActiveTilePath().cutTilePath();
                } else if (walkGrid.getActivePathTiles().length === 1) {
                 //   GuiAPI.screenText("SHORT PATH")
                //    actor.actorText.say("Single Tile Path")
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
        //        console.log("MOVE ACTION - Complete, tiles: ", walkGrid.getActiveTilePath().getRemainingTiles())
       //         actor.actorText.say("Move "+walkGrid.getActivePathTiles().length+" tiles")

                actor.prepareTilePath(tileSelector.getPos());
                //    actor.moveActorOnGridTo(tileSelector.getPos(), walkGrid.call.deactivate)
                walkGrid.applySelectedPath(this.call.pathingUpdate, this.call.pathingCompleted)

            } else {


            //    walkGrid.clearGridTilePath()
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
    //    actor.getGameWalkGrid().dynamicWalker.attachFrameLeapEffect(actor)

        actor.setStatusKey(ENUMS.ActorStatus.SELECTING_DESTINATION, 1);

        if (!walkGrid.isActive) {
            actor.activateWalkGrid(5);
    //        console.log("LEAP ACTION - activate")
    //        actor.actorText.say("Destination")
        } else {

            if (tileSelector.hasValue()) {
       //         console.log("LEAP ACTION - update")
                walkGrid.setGridCenter(tileSelector.getPos())
                if (tileSelector.hasValue()) {
                    actor.turnTowardsPos(tileSelector.getPos() , GameAPI.getFrame().avgTpf * tileSelector.extendedDistance * 0.1);
                    let tile = walkGrid.getTileAtPosition(tileSelector.getPos());
                    actor.setDestination(tile.getPos());
                } else {
                    actor.setStatusKey(ENUMS.ActorStatus.SELECTING_DESTINATION, 0);
                    actor.setDestination(actor.getSpatialPosition(ThreeAPI.tempVec3));
                }
            }
        }
    }

    leapSelectionCompleted(actor) {
        let walkGrid = actor.getGameWalkGrid();
        visualPath.clearVisualPath();

        let transition = poolFetch('SpatialTransition');
        actor.setStatusKey(ENUMS.ActorStatus.SELECTING_DESTINATION, 0);
        if (walkGrid.isActive) {
            let tileSelector = walkGrid.gridTileSelector;
    //        console.log("LEAP SELECTED")

            actor.setStatusKey(ENUMS.ActorStatus.TRAVEL_MODE, ENUMS.TravelMode.TRAVEL_MODE_PASSIVE);
            let tile = walkGrid.getTileAtPosition(tileSelector.getPos())
            let distance = MATH.distanceBetween(tile.getPos(), actor.getSpatialPosition());
    //        actor.actorText.say("Leap")
        //    walkGrid.dynamicWalker.attachFrameLeapTransitionFx(actor)
            let onArrive = function(pos, spatTransition) {
                let fromVec = spatTransition.fromVec3;
                fromVec.set(0, 0, 0);
                poolReturn(spatTransition);
           //     actor.setSpatialPosition(pos);
                actor.setDestination(actor.getSpatialPosition());
                actor.setSpatialVelocity(fromVec);
           //     walkGrid.dynamicWalker.attachFrameLeapTransitionFx(actor)
           //     walkGrid.dynamicWalker.isLeaping = false;
                actor.setStatusKey(ENUMS.ActorStatus.IS_LEAPING, false)
        //        console.log("LEAP COMPLETED", actor)
        //        actor.actorText.say("Distance "+MATH.numberToDigits(distance, 1, 1)+"m")
                walkGrid.setGridCenter(actor.getSpatialPosition());
                actor.setStatusKey(ENUMS.ActorStatus.TRAVEL_MODE, ENUMS.TravelMode.TRAVEL_MODE_WALK);
            }

            let lastPos

            let onFrameUpdate = function(pos, vel) {
                actor.setSpatialPosition(pos);
            //    actor.setSpatialVelocity(vel);
            }

            let fromVec = transition.fromVec3
            actor.getSpatialPosition(fromVec)
            let toVec = actor.getDestination();
            transition.initSpatialTransition(fromVec, toVec, 0.2+MATH.curveSqrt(distance*4)*0.15, onArrive, distance*0.3, 'curveEdge', onFrameUpdate)

            tileSelector.moveAlongX(0);
            tileSelector.moveAlongZ(0);
            walkGrid.setGridCenter(tile.getPos());
            walkGrid.deactivateWalkGrid()
        }
    }

}

export {ActorMovement}