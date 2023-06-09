"use strict";

define([
        'PipelineAPI',
        '3d/effects/vegetation/VegetationSector',
        '3d/effects/vegetation/PatchPool',
    '3d/effects/vegetation/VegetationPatch'
 //   'EffectAPI'
    ],
    function(
        PipelineAPI,
        VegetationSector,
        PatchPool,
        VegetationPatch
    //    EffectAPI
    ) {


        var EffectAPI;

        var tempVec = new THREE.Vector3();
        var tempVec2 = new THREE.Vector3();

        var VegetationSystem = function(sysIndex, FxAPI, vegData, vegConf) {

            EffectAPI = FxAPI;

            this.systemIndex = sysIndex;
            
            this.lastX = -100000;
            this.lastZ = -100000;

            this.vegData = vegData;
            
            this.lastChecked = 0;

            this.config = vegConf;

            this.indexOffset = 0;

            this.sectorPool = [];
            this.patchGrid = [];

            this.activePatches = [];
            this.patchPool = new PatchPool(this);
            this.generateVegetationGrid()


        };
        
        VegetationSystem.prototype.setVegSysDebug = function(bool) {

            for (var i = 0; i < this.sectorPool.length; i++) {
                this.sectorPool[i].setVegSectorDebug(bool);
            }

            for (i = 0; i < this.activePatches.length; i++) {
                this.activePatches[i].applyPatchDebug(bool);
            }
            
            
        };
        

        VegetationSystem.prototype.conf = function() {
            return this.config[this.systemIndex]
        };
        
        VegetationSystem.prototype.createPatch = function() {
            return new VegetationPatch(this.systemIndex, this.config, EffectAPI, this.vegData)
        };


        VegetationSystem.prototype.generateVegetationGrid = function() {

            this.indexOffset = Math.floor(this.conf().rowsNColumns*0.5);
            
            for (var i = 0; i < this.conf().rowsNColumns * this.conf().rowsNColumns; i++) {
                this.patchPool.generatePatch(this);
            }

            for (var i = 0; i < this.conf().rowsNColumns; i++) {
                this.patchGrid[i] = [];
                for (var j = 0; j < this.conf().rowsNColumns; j++) {
                    this.patchGrid[i][j] = null;
                    var patch = new VegetationSector(EffectAPI, this.systemIndex, this.indexOffset, i, j, this.config);
                    this.sectorPool.push(patch);
                }
            }
        };

        

        VegetationSystem.prototype.updateSectorPositions = function() {
            for (var i = 0; i < this.sectorPool.length; i++) {
                this.sectorPool[i].positionSectorAroundCenter(this.lastX - this.indexOffset, this.lastZ - this.indexOffset);
            }
        };

        VegetationSystem.prototype.positionBeneathCamera = function(camera) {

            tempVec.x = 0;
            tempVec.y = 0;
            tempVec.z = -this.conf().vegetationSectorSize*this.conf().rowsNColumns*0.4;

            tempVec.applyQuaternion(camera.quaternion);

        //    tempVec2.subVectors(tempVec, camera.position);

        //    tempVec2.multiplyScalar(this.conf().vegetationSectorSize * 0.02);

            tempVec2.addVectors(tempVec,  camera.position);

            var posX = Math.floor(tempVec2.x / this.conf().vegetationSectorSize);
            var posZ = Math.floor(tempVec2.z / this.conf().vegetationSectorSize);
            
            if (this.lastX !== posX || this.lastZ !== posZ) {
                this.lastX = posX;
                this.lastZ = posZ;
                this.updateSectorPositions();
            }
        };

        VegetationSystem.prototype.getPatch = function() {

            if (!this.patchPool.length) {
                return new VegetationPatch(this.systemIndex, this.config, EffectAPI, this.vegData);
            } else {
                return this.patchPool.pop()
            }

        };
        
        VegetationSystem.prototype.updateVegetationSystem = function(systemTime, camera) {

            if (!camera) return;
            
            this.positionBeneathCamera(camera);

            this.sectorPool[this.lastChecked % this.sectorPool.length].checkVisibility(this.activePatches, this.patchPool);


            this.lastChecked++;

            for (var i = 0; i < this.activePatches.length; i++) {
                this.activePatches[i].checkSectorVisibility(this.sectorPool, this.activePatches, this.patchPool);
            }

        };

        VegetationSystem.prototype.cleanupVegetationSystem = function() {

            for (var i = 0; i < this.sectorPool.length; i++) {
                this.sectorPool[i].disableVegetationSector();
                this.sectorPool[i].isVisible = false;
            }

            for (var i = 0; i < this.activePatches.length; i++) {
                this.activePatches[i].clearPatch();
            }

        };

        return VegetationSystem;

    });