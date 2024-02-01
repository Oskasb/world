import {SpatialTransition} from "../piece_functions/SpatialTransition.js";
import {VisualPath} from "../visuals/VisualPath.js";
import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";
import {processEncounterGridTilePath} from "../gameworld/ScenarioUtils.js";
import {Vector3} from "../../../libs/three/Three.js";
import {detectFreeSpaceAbovePoint, rayTest} from "../../application/utils/PhysicsUtils.js";
import {colorMapFx} from "../visuals/Colors.js";

let colorsRgba = {
    BLUE:{r:0.015, g:0.05, b:0.2, a:1}
}

let visualPath = new VisualPath()
let tileCount = 0;
let tempVec = new Vector3();
let tempVec2 = new Vector3()
let tempNormal = new Vector3()


let probeResult = {
    halted:false,
    blocked:false,
    requiresLeap:false,
    hitNormal:new Vector3(),
    from:new Vector3(),
    to:new Vector3(),
    translation:new Vector3(),
    destination:new Vector3()
}

function applyTileSelection(actor, tileSelector, walkGrid) {
    if (actor.getStatus(ENUMS.ActorStatus.IN_COMBAT)) {
        processEncounterGridTilePath(walkGrid.getActiveTilePath(), GameAPI.getActiveEncounterGrid())
        let mayExit = actor.getStatus(ENUMS.ActorStatus.EXIT_ENCOUNTER)
        if (mayExit) {
            actor.prepareTilePath(tileSelector.getPos());
        } else {
            let encounterTile = GameAPI.getActiveEncounterGrid().getTileAtPosition(tileSelector.getPos());
            actor.prepareTilePath(encounterTile.getPos());
        }
    } else {
        actor.prepareTilePath(tileSelector.getPos());
    }
}

class ActorMovement {
    constructor() {

        this.spatialTransition = new SpatialTransition();

        this.visualArc = null;

         let pathingUpdate = function() {

         }

        let pathingCompleted = function() {
            // console.log("Pathing Completed")
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
            actor.activateWalkGrid(1+ actor.getStatus(ENUMS.ActorStatus.MOVEMENT_SPEED) * 4 )
        } else {

            if (tileSelector.hasValue()) {

                    if (tileSelector.extendedDistance > 0.8) {

                        applyTileSelection(actor, tileSelector, walkGrid)
                        //            evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:actor.getHeadPosition(), to:walkGrid.getGridCenter(), color:'YELLOW'});
                    } else {
                        walkGrid.clearGridTilePath()
                    }

                    actor.turnTowardsPos(tileSelector.getPos() , GameAPI.getFrame().avgTpf * tileSelector.extendedDistance * 0.3);

                    if (tileCount !== walkGrid.getActivePathTiles().length) {
                        tileCount = walkGrid.getActivePathTiles().length
                    }

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
                applyTileSelection(actor, tileSelector, walkGrid)


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

    probeMovementPhysics(actor, inputAmount) {
        let pos = actor.getSpatialPosition()
        let moveSpeed = actor.getStatus(ENUMS.ActorStatus.MOVEMENT_SPEED)
        probeResult.translation.copy(actor.lookDirection);
        probeResult.translation.multiplyScalar(inputAmount * moveSpeed)
    //    let quat = actor.getSpatialQuaternion();
    //    probeResult.translation.applyQuaternion(quat);
        probeResult.from.copy(pos)
        probeResult.from.y += 0.5;
        probeResult.to.addVectors(probeResult.from, probeResult.translation);
        let hit = rayTest(probeResult.from, probeResult.to, probeResult.destination, tempNormal, false)
        if (!hit) {
            probeResult.destination.copy(probeResult.to)
            probeResult.halted = false;
        } else {
            actor.actorText.say("f____")
            probeResult.halted = true;
        }

        let groundHeight = ThreeAPI.terrainAt(probeResult.destination, tempNormal);
        probeResult.destination.y = probeResult.from.y + 1.5;
        probeResult.to.copy(probeResult.destination);
        probeResult.to.y = groundHeight + 0.3;
        hit = rayTest(probeResult.destination, probeResult.to, probeResult.destination, tempNormal, false)

        if (!hit) {
            probeResult.destination.y = groundHeight+0.3;
        } else {
            actor.actorText.say('__d__')
        }

        probeResult.to.copy(probeResult.destination)
        probeResult.to.y += 1.7;

        hit = rayTest(probeResult.destination, probeResult.to, probeResult.destination, tempNormal, true)
        if (hit) {
            actor.actorText.say('____u')
            probeResult.blocked = true;
        } else {
            probeResult.blocked = false;
        }

        return probeResult;

    }

    runControlActive(actor) {

        let turn = actor.getControl(ENUMS.Controls.CONTROL_RUN_X)
        let forward = actor.getControl(ENUMS.Controls.CONTROL_RUN_Z)

        tempVec2.set(turn, 0, forward);
        let inputAmount = tempVec2.length();
        if (inputAmount === 0) return;

        if (this.visualArc === null) {
            this.visualArc = poolFetch('VisualEngagementArc')
            this.visualArc.on(null, actor, null);
        }


            tempVec2.applyQuaternion(ThreeAPI.getCamera().quaternion);
            tempVec2.y = 0;
            let alignLength = tempVec2.length();
            tempVec2.multiplyScalar(-inputAmount / alignLength);

        let pos = actor.getSpatialPosition()
        tempVec2.add(pos);
        actor.turnTowardsPos(tempVec2, GameAPI.getFrame().avgTpf * -turn);

           let probeRes = this.probeMovementPhysics(actor, forward);

        this.visualArc.from.copy(pos);

        if (probeRes.blocked) {
            this.visualArc.rgba = colorMapFx['HOSTILE']
        } else if (probeRes.halted) {
            this.visualArc.rgba = colorMapFx['NEUTRAL']
        } else {
            this.visualArc.rgba = colorMapFx['FRIENDLY']
        }

        tempVec.addVectors(pos, tempVec2);
        let groundHeight = ThreeAPI.terrainAt(tempVec);
        tempVec.y = groundHeight;

        let hit = detectFreeSpaceAbovePoint(tempVec, 1.7, tempVec, tempNormal, 2, true);


        if (hit) {
            if (hit.fraction !== 1) {
                //    console.log("Tile physical contact ", hit)
                let rigidBodyPointer = hit.ptr;
            }

            //       this.obj3d.position.copy(contactPoint);
            //       this.groundNormal.copy(normalHit);
        }

        this.visualArc.to.copy(probeRes.destination);
    //    this.visualArc.to.y = targetElevation;


        actor.setStatusKey(ENUMS.ActorStatus.SELECTING_DESTINATION, 1);
        //    if (tileSelector.extendedDistance > 0.8) {

        actor.setDestination(this.visualArc.to)

        probeRes = this.probeMovementPhysics(actor, GameAPI.getFrame().avgTpf * forward);

        actor.setSpatialPosition(probeRes.destination)
        //    }


    }

    runControlCompleted(actor) {
    //    actor.setControlKey(ENUMS.Controls.CONTROL_RUN_X, 0)
    //    actor.setControlKey(ENUMS.Controls.CONTROL_RUN_Z, 0)
        actor.setControlKey(ENUMS.ActorStatus.CONTROL_RUN_ACTION, 0);
        actor.setStatusKey(ENUMS.ActorStatus.SELECTING_DESTINATION, 0);
        actor.setDestination(actor.getSpatialPosition())

        if (this.visualArc) {
            this.visualArc.off();
            poolReturn(this.visualArc);
            this.visualArc = null;
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
            actor.setDestination(actor.getSpatialPosition(ThreeAPI.tempVec3));
    //        console.log("LEAP ACTION - activate")
    //        actor.actorText.say("Destination")
        } else {

            if (tileSelector.hasValue()) {
       //         console.log("LEAP ACTION - update")
                walkGrid.setGridCenter(tileSelector.getPos())
                if (tileSelector.hasValue()) {
                    actor.turnTowardsPos(tileSelector.getPos() , GameAPI.getFrame().avgTpf * tileSelector.extendedDistance * 0.1);
                    let tile = walkGrid.getTileAtPosition(tileSelector.getPos());
                    if (tile.walkable === true) {
                        actor.setDestination(tile.getPos());
                    } else {
                    //    actor.setStatusKey(ENUMS.ActorStatus.SELECTING_DESTINATION, 0);
                     //   actor.setDestination(actor.getSpatialPosition(ThreeAPI.tempVec3));
                    }

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

                let inCombat = actor.getStatus(ENUMS.ActorStatus.IN_COMBAT)
                if (inCombat) {
                    actor.setStatusKey(ENUMS.ActorStatus.TRAVEL_MODE, ENUMS.TravelMode.TRAVEL_MODE_BATTLE);
                } else {
                    actor.setStatusKey(ENUMS.ActorStatus.TRAVEL_MODE, ENUMS.TravelMode.TRAVEL_MODE_LEAP);
                }


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