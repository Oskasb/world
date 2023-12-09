import {AmmoFunctions} from "./AmmoFunctions.js";

"use strict";

let ammoFunctions;
let bodies = [];
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
            console.log("Ammo Ready", ammo);
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

    cleanupPhysics = function(cb) {

        while (bodies.length) {
            this.excludeBody(bodies[0], true)
        }

        world = null;
        ammoFunctions.cleanupPhysicalWorld(cb);
    };

    buildPhysicalTerrain = function(data, size, posx, posz, min_height, max_height) {
        var body = ammoFunctions.createPhysicalTerrain(world, data, size, posx, posz, min_height, max_height);
        bodies.push(body);
        return body;
    };

    registerGeoBuffer = function(id, buffer) {
        ammoFunctions.setGeometryBuffer(id, buffer);
    };

    setupRigidBody = function(bodyConf, dynamicSpatial, cb) {

        var onReady = function(body, bdCfg) {

            if (bdCfg.joints) {
                ammoFunctions.attachBodyBySliderJoints(world, body, bdCfg)
            }

            cb(dynamicSpatial, body);
        };

        ammoFunctions.createRigidBody(bodyConf, dynamicSpatial, onReady);

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
        if (bodies.indexOf(body) === -1) {
            world.addRigidBody(body);
            bodies.push(body);
        }

        ammoFunctions.enableBodySimulation(body);
    };


    disableRigidBody = function(body) {
        this.excludeBody(body);
    };


    excludeBody = function(body) {
        var bi = bodies.indexOf(body);
        bodies.splice(bi, 1);

        if (!body) {
            console.log("No body", bi, body);
            return;
        }

        ammoFunctions.disableBodySimulation(body);
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

    triggerPhysicallyActive = function(actor) {
        return ammoFunctions.enableBodySimulation(actor.getPhysicsBody());
        //  actor.getPhysicsBody().activate();
    };

    isPhysicallyActive = function(actor) {
        return ammoFunctions.getBodyActiveState(actor.getPhysicsBody());
    };

    raycastPhysicsWorld = function(position, direction, hitPositionStore, hitNormalStore) {
        let hit = ammoFunctions.physicsRayRange(world, position, direction, hitPositionStore, hitNormalStore);
        if (hit) {
            return hit;
        }
    };

    fetchPhysicsStatus = function() {

        status.bodyCount = bodies.length;
        //    this.status.contactCount = this.world.contacts.length;

        return status;
    };



}

export {AmmoAPI}