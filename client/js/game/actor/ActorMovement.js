import {SpatialTransition} from "../piece_functions/SpatialTransition.js";
import {VisualPath} from "../visuals/VisualPath.js";

let colorsRgba = {
    BLUE:{r:0.015, g:0.05, b:0.2, a:1}
}

let visualPath = new VisualPath()
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
        let tileSelector = walkGrid.gridTileSelector;
        actor.setStatusKey(ENUMS.ActorStatus.SELECTING_DESTINATION, 1);
        if (!walkGrid.isActive) {
            actor.activateWalkGrid(1+ actor.getStatus(ENUMS.ActorStatus.MOVEMENT_SPEED) * 2 )
            console.log("MOVE ACTION - activate")
        } else {
            if (tileSelector.hasValue()) {
                actor.prepareTilePath(tileSelector.getPos());
                actor.turnTowardsPos(tileSelector.getPos() , GameAPI.getFrame().avgTpf * tileSelector.extendedDistance * 0.3);
            }
        }
    }

    tileSelectionCompleted(actor) {
        let walkGrid = actor.getGameWalkGrid();
        let tileSelector = walkGrid.gridTileSelector;
        if (walkGrid.isActive) {
            actor.setStatusKey(ENUMS.ActorStatus.SELECTING_DESTINATION, 0);
            let tileSelector = walkGrid.gridTileSelector;
            if (tileSelector.hasValue()) {
            //    console.log("MOVE ACTION - Complete")
                actor.actorText.say("Path Selected")
                actor.prepareTilePath(tileSelector.getPos());
            //    actor.moveActorOnGridTo(tileSelector.getPos(), walkGrid.call.deactivate)
                walkGrid.applySelectedPath(this.call.pathingUpdate, this.call.pathingCompleted)
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