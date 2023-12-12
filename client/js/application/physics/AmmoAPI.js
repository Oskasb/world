import {AmmoFunctions} from "./AmmoFunctions.js";

"use strict";

let ammoFunctions;
let world;

let STATE = {
    ACTIVE : 1,
    ISLAND_SLEEPING : 2,
    WANTS_DEACTIVATION : 3,
    DISABLE_DEACTIVATION : 4,
    DISABLE_SIMULATION : 5
}

let status = {
    bodyCount:0
};

let initApi = function(onReady) {
        window.AMMO.then(function(ammo) {
        //    AMMO = Ammo
        //    console.log("Ammo Ready", ammo);
            ammoFunctions = new AmmoFunctions(ammo);
            onReady()
        });
};

class AmmoAPI {

    constructor(onReady) {
        initApi(onReady);
    }

    initPhysics = function() {
        world = ammoFunctions.createPhysicalWorld();
    };

    getYGravity = function() {
        return ammoFunctions.getYGravity();
    };


    buildPhysicalTerrain = function(data, size, posx, posz, min_height, max_height) {
        var body = ammoFunctions.createPhysicalTerrain(world, data, size, posx, posz, min_height, max_height);
        return body;
    };

    registerGeoBuffer = function(id, buffer) {
        ammoFunctions.setGeometryBuffer(id, buffer);
    };

    setupRigidBody = function(obj3d, shapeName, mass, friction, pos, rot, scale, assetId, convex, bodyReadyCB) {

        let onReady = function(body, bdCfg) {
/*
            if (bdCfg.joints) {
                ammoFunctions.attachBodyBySliderJoints(world, body, bdCfg)
            }
*/
            bodyReadyCB(body);
        };

        ammoFunctions.createRigidBody(obj3d, shapeName, mass, friction, pos, rot, scale, assetId, convex, onReady);

    };


    requestBodyDeactivation = function(body) {
        ammoFunctions.relaxBodySimulation(body);
    };

    requestBodyActivation = function(body) {
        ammoFunctions.enableBodySimulation(body);
    };

    includeBody = function(body) {

        if (!world) return;

        if (!body) {
            console.log("Cant add !body", body);
            return;
        }

    //    if (bodies.indexOf(body) === -1) {
            world.addRigidBody(body);
    //    }

        ammoFunctions.enableBodySimulation(body);
    };

    excludeBody = function(body) {

        if (!body) {
            console.log("No body", bi, body);
            return;
        }

        ammoFunctions.disableBodySimulation(body);
        world.removeRigidBody(body);
    };


    updatePhysicsSimulation = function(dt) {
        ammoFunctions.updatePhysicalWorld(world, dt)
    };

    applyForceAndTorqueToBody = function(forceVec3, body, torqueVec) {
        ammoFunctions.forceAndTorqueToBody(forceVec3, body, torqueVec)
    };

    applyForceAtPointToBody = function(forceVec3, pointVec, body) {
        ammoFunctions.forceAtPointToBody(forceVec3, pointVec, body)
    };


    applyForceToActor = function(forceVec3, actor, randomize) {
        ammoFunctions.applyForceToBodyWithMass(forceVec3, actor.getPhysicsBody(), actor.physicalPiece.getPhysicsPieceMass(), randomize)
    };

    relaxSimulatingBody = function(body) {
        ammoFunctions.relaxBodySimulation(body);
    };

    changeBodyDamping = function(body, dampingV, dampingA) {
        ammoFunctions.applyBodyDamping(body, dampingV, dampingA);
    };

    setBodyPosition = function(body, posVec) {

        ammoFunctions.setBodyPosition(body, posVec);

    };

    triggerPhysicallyActive = function(body) {
        return ammoFunctions.enableBodySimulation(body);
        //  actor.getPhysicsBody().activate();
    };

    isPhysicallyActive = function(body) {
        return ammoFunctions.getBodyActiveState(body);
    };

    raycastPhysicsWorld = function(position, direction, hitPositionStore, hitNormalStore) {
        let hit = ammoFunctions.physicsRayRange(world, position, direction, hitPositionStore, hitNormalStore);
        if (hit) {
            return hit;
        }
    };

    getAuxTransform() {
        return ammoFunctions.getAuxTransform();
    }

    getAuxVector3() {
        return ammoFunctions.getAuxVector3();
    }





}

export {AmmoAPI}