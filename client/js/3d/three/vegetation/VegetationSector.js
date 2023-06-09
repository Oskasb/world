"use strict";

define([
    ],
    function(
    ) {
        
        var calcVec = new THREE.Vector3();

        var outside = 99999999;
        var debug = false;
        
        var EffectAPI;

        var VegetationSector = function(fxApi, sysIndex, indexOffset, row, column, config) {

            EffectAPI = fxApi;
            
            this.systemIndex = sysIndex;
            this.config = config;
            
            this.indexOffset = indexOffset;
            this.isVisible = false;

            this.row = row;
            this.column = column;

            this.indexX = row;
            this.indexZ = column;

            this.posX = 0;
            this.posY = 0;
            this.posZ = 0;

            this.posVec = new THREE.Vector3();

            this.parentObject3d = ThreeAPI.createRootObject();
            this.debugging = false;
            

        //
        };

        VegetationSector.prototype.setVegSectorDebug = function(bool) {

               if (bool) {
                    this.addVegetationDebugBox(this.size())
               } else {
                   this.parentObject3d.remove(this.debugBox)
               }

        };

        VegetationSector.prototype.size = function() {
            return this.conf().vegetationSectorSize;
        };

        VegetationSector.prototype.conf = function() {
            return this.config[this.systemIndex]
        };

        VegetationSector.prototype.addVegetationDebugBox = function(size) {
            this.debugBox = this.debugBox || ThreeAPI.loadDebugBox(size, size*0.5, size);
            ThreeAPI.addChildToObject3D(this.debugBox, this.parentObject3d);
        };


        VegetationSector.prototype.positionSectorAroundCenter = function(indexX, indexZ) {

            this.isVisible = false;

            this.indexX = indexX+this.row;
            this.indexZ = indexZ+this.column;
            this.setSectorPosition(this.indexX * this.size(), this.indexZ * this.size());

        };
        
        VegetationSector.prototype.setSectorPosition = function(x, z) {

            this.posX = x;
            this.posZ = z;

            calcVec.x = this.posX;
            calcVec.y = outside;
            calcVec.z = this.posZ;

            this.posY = WorldAPI.getTerrainSystem().getTerrainHeightAndNormal(calcVec);

            if (this.posY) {
                calcVec.y = this.posY;
                this.parentObject3d.position.copy(calcVec);
            } else {
                this.posY = outside;
            }

            this.posVec.copy(calcVec);

        };


        VegetationSector.prototype.checkForActivePatch = function(activePatches, patchPool) {

            for (var i = 0; i < activePatches.length; i++) {
                if (activePatches[i].posX == this.posX && activePatches[i].posZ == this.posZ) {
                    return activePatches[i];
                }
            }

        };

        VegetationSector.prototype.enableVegetationSector = function(activePatches, patchPool) {

            var activePatch = this.checkForActivePatch(activePatches);

            if (EffectAPI.vegDebug()) {
                this.debugging = true;
                ThreeAPI.addToScene(this.parentObject3d);
            }
        //

            if (activePatch) {
                return;
            }

            var patch = patchPool.shift();

            if (!patch) {
                console.log("bad patch!", patchPool, this.indexX, this.indexZ);
                return;
            } else {
           //     console.log("ENABLE patch!", patchPool.length, this.indexX, this.indexZ);
            }

            activePatches.push(patch);

            patch.enablePatch(this.indexX, this.indexZ, this.posX, this.posZ, this.size());
            
        };

        VegetationSector.prototype.disableVegetationSector = function() {
            if (this.debugging) {
                ThreeAPI.disposeModel(this.parentObject3d);
                this.debugging = false;
            }
        };

        VegetationSector.prototype.checkVisibility = function(activePatches, patchPool) {

            var visible = WorldAPI.getWorldCamera().testPosRadiusVisible( this.posVec , this.size() * 1.8);

            if (visible && !this.isVisible) {
                this.enableVegetationSector(activePatches, patchPool);
            }

            if (!visible && this.isVisible) {
                this.disableVegetationSector();
            }

            this.isVisible = visible;

        };


        return VegetationSector;

    });