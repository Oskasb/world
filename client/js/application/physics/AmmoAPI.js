
"use strict";

define(['worker/physics/AmmoFunctions'],

    function(AmmoFunctions) {

        var AMMO = Ammo;

        var ammoFunctions;

        var bodies = [];

        var world;

        var STATE = {
            ACTIVE : 1,
            ISLAND_SLEEPING : 2,
            WANTS_DEACTIVATION : 3,
            DISABLE_DEACTIVATION : 4,
            DISABLE_SIMULATION : 5
        }

        var status = {
            bodyCount:0
        };

        var queSetup = function(onReady) {

            setTimeout(function() {
                initApi(onReady)
            }, 1000)

        }


        var initApi = function(onReady) {
            if (typeof(AMMO) !== 'undefined') {
                AMMO().then(function(ammo) {
                    console.log("Ammo Ready", ammo);
                    ammoFunctions = new AmmoFunctions(ammo);
                    onReady()
                });
            } else {
                queSetup(onReady)
            }
        };


        var AmmoAPI = function(ammoReady) {

            initApi(ammoReady);

        };

        AmmoAPI.prototype.initPhysics = function() {
            world = ammoFunctions.createPhysicalWorld();
        };

        AmmoAPI.prototype.getYGravity = function() {
            return ammoFunctions.getYGravity();
        };

        AmmoAPI.prototype.cleanupPhysics = function(cb) {

            while (bodies.length) {
                this.excludeBody(bodies[0], true)
            }

            world = null;
            ammoFunctions.cleanupPhysicalWorld(cb);
        };

        AmmoAPI.prototype.buildPhysicalTerrain = function(data, size, posx, posz, min_height, max_height) {
            var body = ammoFunctions.createPhysicalTerrain(world, data, size, posx, posz, min_height, max_height);
            bodies.push(body);
            return body;
        };

        AmmoAPI.prototype.registerGeoBuffer = function(id, buffer) {
            ammoFunctions.setGeometryBuffer(id, buffer);
        };

        AmmoAPI.prototype.setupRigidBody = function(bodyConf, dynamicSpatial, cb) {

            var onReady = function(body, bdCfg) {

                if (bdCfg.joints) {
                    ammoFunctions.attachBodyBySliderJoints(world, body, bdCfg)
                }

                cb(dynamicSpatial, body);
            };

            ammoFunctions.createRigidBody(bodyConf, dynamicSpatial, onReady);

        };


        AmmoAPI.prototype.requestBodyDeactivation = function(body) {
            ammoFunctions.relaxBodySimulation(body);
        };

        AmmoAPI.prototype.requestBodyActivation = function(body) {
            ammoFunctions.enableBodySimulation(body);
        };


        AmmoAPI.prototype.includeBody = function(body) {

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


        AmmoAPI.prototype.disableRigidBody = function(body) {
            this.excludeBody(body);
        };


        AmmoAPI.prototype.excludeBody = function(body) {
            var bi = bodies.indexOf(body);
            bodies.splice(bi, 1);

            if (!body) {
                console.log("No body", bi, body);
                return;
            }

            ammoFunctions.disableBodySimulation(body);
        };


        AmmoAPI.prototype.updatePhysicsSimulation = function(dt) {
            ammoFunctions.updatePhysicalWorld(world, dt)
        };

        AmmoAPI.prototype.applyForceAndTorqueToBody = function(forceVec3, body, torqueVec) {
            ammoFunctions.forceAndTorqueToBody(forceVec3, body, torqueVec)
        };

        AmmoAPI.prototype.applyForceAtPointToBody = function(forceVec3, pointVec, body) {
            ammoFunctions.forceAtPointToBody(forceVec3, pointVec, body)
        };


        AmmoAPI.prototype.applyForceToActor = function(forceVec3, actor, randomize) {
            ammoFunctions.applyForceToBodyWithMass(forceVec3, actor.getPhysicsBody(), actor.physicalPiece.getPhysicsPieceMass(), randomize)
        };

        AmmoAPI.prototype.relaxSimulatingBody = function(body) {
            ammoFunctions.relaxBodySimulation(body);
        };

        AmmoAPI.prototype.changeBodyDamping = function(body, dampingV, dampingA) {
            ammoFunctions.applyBodyDamping(body, dampingV, dampingA);
        };

        AmmoAPI.prototype.setBodyPosition = function(body, posVec) {

            ammoFunctions.setBodyPosition(body, posVec);

        };

        AmmoAPI.prototype.triggerPhysicallyActive = function(actor) {
               return ammoFunctions.enableBodySimulation(actor.getPhysicsBody());
            //  actor.getPhysicsBody().activate();
        };

        AmmoAPI.prototype.isPhysicallyActive = function(actor) {
            return ammoFunctions.getBodyActiveState(actor.getPhysicsBody());
        };

        AmmoAPI.prototype.raycastPhysicsWorld = function(position, direction, hitPositionStore, hitNormalStore) {
            var hit = ammoFunctions.physicsRayRange(world, position, direction, hitPositionStore, hitNormalStore);
            if (hit) {
                return hit;
            }
        };

        AmmoAPI.prototype.fetchPhysicsStatus = function() {

           status.bodyCount = bodies.length;
            //    this.status.contactCount = this.world.contacts.length;

            return status;
        };

        return AmmoAPI;

    });