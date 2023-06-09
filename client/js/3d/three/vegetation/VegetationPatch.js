"use strict";

define([
        'PipelineAPI'
        //   'EffectAPI'
    ],
    function(
        PipelineAPI
        //    EffectAPI
    ) {


        var EffectAPI;
        var zeroVec = new THREE.Vector3();
        var tempVec = new THREE.Vector3();
        var tempVec2 = new THREE.Vector3();
        var tempVec3 = new THREE.Vector3();

        var debug = false;

        var plantData = {
            "id":"test_plant"
        };


        var VegetationPatch = function(sysIndex, config, FxAPI, vegData) {

            this.skipCount = 0;

            this.config = config;
            this.enabled = false;
            this.systemIndex = sysIndex;

            this.vegData = vegData;

            this.plantWeights = [];

            this.indexX = 'none';
            this.indexZ = 'none';

            this.spawnedPlants = [];

            EffectAPI = FxAPI;

            this.debugging = false;
         //
        };


        VegetationPatch.prototype.size = function() {
            return this.conf().vegetationSectorSize;
        };

        VegetationPatch.prototype.conf = function() {
            return this.config[this.systemIndex]
        };



        VegetationPatch.prototype.enablePatch = function(ix, iz, x, z) {

            if (this.enabled) {
                console.log("PATCH ALREADY TAKEN!");
                return;
            }

            this.enabled = true;


        //
            this.indexX = ix;
            this.indexZ = iz;

            this.posX = x;
            this.posZ = z;

            if (EffectAPI.vegDebug()) {
                this.debugShow();
            }

        };

        VegetationPatch.prototype.despawnVegetation = function() {
            this.clearPatch();
        };

        VegetationPatch.prototype.getFramePlantCount = function() {
            return (this.conf().plantCount - this.skipCount) / this.conf().spawnFrames;
        };

        VegetationPatch.prototype.disablePatch = function(activePatches, patchPool) {

                this.despawnVegetation();

                this.skipCount = 0;
                var patch = activePatches.splice(activePatches.indexOf(this), 1)[0];
                patchPool.push(patch);

                if (!this.enabled) {
                    console.log("Already disabled...");
                    return;
                }

                this.enabled = false;
                this.indexX = 'none';
                this.indexZ = 'none';


            if (this.debugging) {
                this.debugRemove();
            }

        };


        VegetationPatch.prototype.getPlants = function(sysId) {
            return this.vegData[sysId][this.systemIndex].vegetation_effects;
        };



        var checkSlope = function(normal, min, max) {
            return min <= 1 - normal.y && max > 1 - normal.y
        };

        var checkElevation = function(pos, min, max) {
            return min <= pos.y && max > pos.y
        };

        VegetationPatch.prototype.plantIdBySystemAndNormal = function(sysId, pos, normal) {

            var plants = this.getPlants(sysId);

            var totalWeight = 0;

            for (var i = 0; i < plants.length; i++) {
                if (checkSlope(normal, plants[i].slope.min, plants[i].slope.max) && checkElevation(pos, plants[i].elevation.min, plants[i].elevation.max)) {
                    this.plantWeights[i] = 1;
                    totalWeight++
                } else {
                    this.plantWeights[i] = 0;
                }
            }

            if (!totalWeight) return null;

            var seed = totalWeight * Math.random();

            for (i = 0; i < plants.length; i++) {
                if (this.plantWeights[i] * (i+1) > seed) {
                    return plants[i].id
                }
            }
            console.log("Bad plant by normal lookup");

        };


        VegetationPatch.prototype.spawnVegetation = function(pos) {

            tempVec2.x = 0;
            tempVec2.y = 0;
            tempVec2.z = 0;

            /*
            if (!pos.x) {
                console.log("Looking for missing pos.x ??");
                return;
            }
*/
            
            var area = WorldAPI.getTerrainSystem().getTerrainAreaAtPos(pos);

            if (!area) {
                this.skipCount ++;
            //    console.log("No vegSysId for position, is outside world");
                return;
            }

            pos.y = area.getHeightAndNormalForPos(pos, tempVec3);

            var vegSysId = area.getTerrainVegetationSystemId();

            var plantId = this.plantIdBySystemAndNormal(vegSysId, pos, tempVec3);

            if (!plantId) {
                this.skipCount ++;
            //    console.log("No plant found for system");
                return;
            }

            var effect = EffectAPI.requestPassiveEffect(plantId, pos, tempVec2, null);
            if (effect) {
                this.spawnedPlants.push(effect);
            } else {
                console.log("Effect pool prolly ran out")
            }

        };


        VegetationPatch.prototype.doPlants = function(count) {


            for (var i = 0; i < count; i++) {

                tempVec.x = this.posX + this.size() * (Math.random() - 0.0);
                tempVec.y = 0;
                tempVec.z = this.posZ + this.size() * (Math.random() - 0.0);
                this.spawnVegetation(tempVec)
            }
        };

        VegetationPatch.prototype.checkSectorVisibility = function(sectorPool, activePatches, patchPool) {

            for (var i = 0; i < sectorPool.length; i++) {
                if (sectorPool[i].indexX == this.indexX && sectorPool[i].indexZ == this.indexZ) {
                    if (this.spawnedPlants.length < this.conf().plantCount) {
                        this.doPlants(this.getFramePlantCount());
                    }
                    return                     
                }
            }

            this.disablePatch(activePatches, patchPool);
        };


        VegetationPatch.prototype.debugShow = function() {

            this.parentObject3d = this.parentObject3d || ThreeAPI.createRootObject();

            this.debugBoll = this.debugBoll || ThreeAPI.loadModel(1.5);
            ThreeAPI.addChildToObject3D(this.debugBoll, this.parentObject3d);

            this.parentObject3d.position.x = this.posX + Math.random()*4 - 2;
            this.parentObject3d.position.y = 0;
            this.parentObject3d.position.z = this.posZ+ Math.random()*4 - 2;

            ThreeAPI.setYbyTerrainHeightAt(this.parentObject3d.position);

            this.debugging = true;
            ThreeAPI.addToScene(this.parentObject3d);
        };


        VegetationPatch.prototype.debugRemove = function() {
            ThreeAPI.disposeModel(this.parentObject3d);
            this.debugging = false;
        };

        VegetationPatch.prototype.applyPatchDebug = function(bool) {
            if (bool) {
                this.debugShow();
            } else {
                this.debugRemove();
            }
        };

        VegetationPatch.prototype.clearPatch = function() {
            while (this.spawnedPlants.length) {
                EffectAPI.returnPassiveEffect(this.spawnedPlants.pop());
            }
        };

        return VegetationPatch;

    });