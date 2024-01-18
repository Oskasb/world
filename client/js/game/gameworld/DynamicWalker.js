import {Vector3} from "../../../libs/three/math/Vector3.js";

let tempVec = new Vector3()
let effectEvent = {
    pos:new Vector3(),
    dir:new Vector3(),
    rgba:{r:0.1, g:0.4, b:0.1, a:0.5},
    fromSize:0.2,
    toSize:1.8,
    duration:0.25,
    sprite:[0, 1],
    effectName:'stamp_additive_pool'
}

class DynamicWalker {
    constructor() {

        let actor;

        this.headingVector = new Vector3();
        this.walkPos = new Vector3()

        let updateWalker = function(tpf) {
            this.processTilePathMovement(tpf, actor);
        }.bind(this)

        let walkDynamicPath = function(tilePath, walkGrid) {
            actor = walkGrid.call.getActor();
            this.walkGrid = walkGrid;
            this.walkObj3d = walkGrid.getGridMovementObj3d();
            actor.getSpatialPosition(this.walkPos)
        //    this.walkPos.copy(this.walkObj3d.position);
            this.tilePath = tilePath;
            this.walkObj3d.position.copy(tilePath.pathTiles[0].getPos())
            GameAPI.unregisterGameUpdateCallback(updateWalker);
            GameAPI.registerGameUpdateCallback(updateWalker);
        }.bind(this);

        let clearDynamicPath = function () {
            GameAPI.unregisterGameUpdateCallback(updateWalker);
        }.bind(this)

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

    applyHeadingToGamePiece(actor, obj3d, frameTravelDistance) {
        actor.setStatusKey(ENUMS.ActorStatus.IS_LEAPING, false)
        tempVec.copy(this.headingVector);
        tempVec.multiplyScalar(frameTravelDistance);
        tempVec.add(this.walkPos)
        obj3d.position.set(0, 0, 0);
        obj3d.lookAt(this.headingVector);
        obj3d.position.copy(tempVec);
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:obj3d.position, color:'GREEN', size:0.5})
    }

    attachFrameLeapEffect(actor) {

            effectEvent.pos.copy(actor.getSpatialPosition());
            effectEvent.dir.set(0, 1, 0);
            if (actor.getStatus(ENUMS.ActorStatus.IS_LEAPING) === false) {
                effectEvent.fromSize = 5.2;
                effectEvent.toSize = 0.5;
                effectEvent.duration = 0.2;
                effectEvent.rgba.r=0.1;
                effectEvent.rgba.g=0.7;
                effectEvent.rgba.b=0.3;
                effectEvent.rgba.a=0.6;
                evt.dispatch(ENUMS.Event.SPAWN_EFFECT, effectEvent)
            }
            effectEvent.rgba.r=0.1;
            effectEvent.rgba.g=0.6;
            effectEvent.rgba.b=0.1;
            effectEvent.rgba.a=0.5;
            effectEvent.fromSize = 0.2;
            effectEvent.toSize = 1.0;
            effectEvent.duration = 0.2;
            evt.dispatch(ENUMS.Event.SPAWN_EFFECT, effectEvent)

    }

    attachFrameLeapTransitionFx(actor) {
        effectEvent.pos.copy(actor.getSpatialPosition());
        effectEvent.dir.set(0, 1, 0);
        effectEvent.fromSize = 1.2;
        effectEvent.toSize = 5.5;
        effectEvent.duration = 0.2;
        effectEvent.rgba.r = 0.1;
        effectEvent.rgba.g = 0.7;
        effectEvent.rgba.b = 0.3;
        effectEvent.rgba.a = 0.6;
        evt.dispatch(ENUMS.Event.SPAWN_EFFECT, effectEvent)
    }

    applyHeadingToLeapingGamePiece(actor, obj3d, frameTravelDistance, from, to) {
    //    console.log(from, to);

        tempVec.copy(from);
        tempVec.y = to.y;

        tempVec.x =  obj3d.position.x;
        tempVec.z =  obj3d.position.z;

        let leapDistance = Math.sqrt(MATH.distanceBetween(from, to));

        let fracX = 1;
        let fracZ = 1;

        if (from.x !== to.x) {
            fracX = MATH.calcFraction(from.x, to.x, obj3d.position.x) * 2;
        }
        if (from.z !== to.z) {
            fracZ = MATH.calcFraction(from.z, to.z, obj3d.position.z) * 2;
        }

        let frac = MATH.clamp(Math.min(fracZ, fracX), 0, 1);

    //    console.log(frac);

        tempVec.copy(this.headingVector);
        let leaPMod = 1;
        if (frac > 0 && frac < 1) {
            this.attachFrameLeapEffect(actor)
            actor.setStatusKey(ENUMS.ActorStatus.IS_LEAPING, true)
            leaPMod = leapDistance * MATH.valueFromCurve(frac, MATH.curves["oneZeroOne"])*0.7 + 0.3*leapDistance;
        } else {

            if (actor.getStatus(ENUMS.ActorStatus.IS_LEAPING)) {
                this.attachFrameLeapTransitionFx(actor)
            }

            actor.setStatusKey(ENUMS.ActorStatus.IS_LEAPING, false)
        }
        tempVec.multiplyScalar(frameTravelDistance * leaPMod);
        tempVec.add(this.walkPos)
   //     tempVec.y += Math.sin(frac*MATH.TWO_PI) * 2;

        let startY = from.y;
        let endY = to.y;
        let leapY = MATH.valueFromCurve(frac, MATH.curves["centerHump"]) * leapDistance// Math.sin(frac*MATH.HALF_PI)

        tempVec.y = startY + frac*(endY-startY)  + leapY;
        let groundY = ThreeAPI.terrainAt(tempVec)
        tempVec.y = Math.max(tempVec.y , groundY);
            obj3d.position.set(0, 0, 0);
        obj3d.lookAt(this.headingVector);
        obj3d.position.copy(tempVec);
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:obj3d.position, color:'PURPLE', size:0.9})
    }

    processTilePathMovement(tpf, actor) {
        this.walkPos.copy(this.walkObj3d.position)
        let currentPos = this.walkPos
        actor.setSpatialPosition(currentPos);
        let pathTiles = this.tilePath.getTiles();
        let targetTile = this.tilePath.getEndTile();

        let charSpeed = actor.getStatus(ENUMS.ActorStatus.MOVEMENT_SPEED)
        let frameTravelDistance = charSpeed * tpf // GameAPI.getTurnStatus().turnTime
    //    console.log(pathTiles)
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

        if (targetTile.requiresLeap) {
            this.applyHeadingToLeapingGamePiece(actor, this.walkObj3d, frameTravelDistance, pathTiles[0].getPos(), targetTile.getPos());
        } else {
            this.applyHeadingToGamePiece(actor, this.walkObj3d, frameTravelDistance);
        }


        let currentTile = this.walkGrid.getTileAtPosition(this.walkObj3d.position)

        if (!currentTile) {
            (actor.getSpatialPosition(this.walkObj3d.position))
            currentTile = this.walkGrid.getTileAtPosition(this.walkObj3d.position)
            if (!currentTile) {
                currentTile = pathTiles[0]
                console.log("No currentTile... setting to firstPathTile!")
            }

        }

        if (currentTile.rigidBodyPointer !== null) {
            actor.setStatusKey(ENUMS.ActorStatus.RIGID_BODY_CONTACT, currentTile.rigidBodyPointer)
        } else {
            actor.setStatusKey(ENUMS.ActorStatus.RIGID_BODY_CONTACT, 0)
        }

        MATH.callAll(this.tilePath.pathingUpdateCallbacks, this.tilePath, this.walkObj3d)

        if (pathRemainingDistance <= frameTravelDistance) {

        //    console.log("Path End Tile Reached")
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