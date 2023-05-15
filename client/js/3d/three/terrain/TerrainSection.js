"use strict";

define([
        'worker/terrain/TerrainFeature'
    ],
    function(
        TerrainFeature
    ) {

        var tempVec1 = new THREE.Vector3();
        var tempVec2 = new THREE.Vector3();

        var TerrainSection = function(area, origin, sideSize) {
            this.area = area;
            this.origin = new THREE.Vector3().copy(origin);
            this.extents = new THREE.Vector3(sideSize, sideSize, sideSize);
            this.center = new THREE.Vector3().copy(this.extents).multiplyScalar(0.5);
            this.center.addVectors(this.center, this.origin);

            this.containsShore = false;
            this.containsGround = false;
            this.containsOceanShallow = false;
            this.containsOcean = true;


            this.terrainFeatures = [];

            this.wasVisible = false;
        };

        TerrainSection.prototype.genereateSectionFeatures = function(gridSide) {

            this.detectContains(12);


            var size = (this.extents.x/gridSide);

            if (this.containsGround) {
                for (var i = 0; i < gridSide; i++) {
                    for (var j = 0; j < gridSide; j++) {

                        tempVec1.x = this.origin.x + i * size;
                        tempVec1.z = this.origin.z + j * size;
                        tempVec1.y = this.area.getHeightAndNormalForPos(tempVec1);

                        if (tempVec1.y > 0) {
                            var feature = new TerrainFeature(this.area, tempVec1, size);
                            feature.generateFeatureGroundElements(Math.floor(Math.random()*3 * Math.random() * 3 * Math.random()*1.5));
                            this.terrainFeatures.push(feature);
                        }
                    }
                }
            }

            if (this.containsShore || this.containsOceanShallow) {
                for (var i = 0; i < gridSide; i++) {
                    for (var j = 0; j < gridSide; j++) {

                        tempVec1.x = this.origin.x + i * size;
                        tempVec1.z = this.origin.z + j * size;
                        tempVec1.y = this.area.getHeightAndNormalForPos(tempVec1);

                        if (tempVec1.y < 4) {
                            var feature = new TerrainFeature(this.area, tempVec1, size);
                            feature.generateFeatureShoreElements(16);
                            this.terrainFeatures.push(feature);
                        }
                    }
                }
            }

        };

        TerrainSection.prototype.detectContains = function(gridSide) {

            var size = (this.extents.x/gridSide);

            var highest = this.origin.y - this.extents.y*1000;
            var lowest = this.origin.y + this.extents.y*1000;

            for (var i = 0; i < gridSide; i++) {
                for (var j = 0; j < gridSide; j++) {

                    tempVec1.x = this.origin.x + i * size;
                    tempVec1.z = this.origin.z + j * size;
                    tempVec1.y = this.area.getHeightAndNormalForPos(tempVec1);

                    if (tempVec1.y < lowest) {
                        lowest = tempVec1.y;
                    }

                    if (tempVec1.y > highest) {
                        highest = tempVec1.y;
                    }
                }
            }

            if (highest > 0) {
                this.containsGround = true;
            }

            if (highest > -5 && lowest < 5) {
                this.containsShore = true;
            }

            if (lowest < 0 && lowest > -10) {
                this.containsOceanShallow = true;
            }

            if (lowest > 0) {
                this.containsOcean = false;
            }

        };


        TerrainSection.prototype.updateSectionVisibility = function(tpf) {

            this.isVisible = WorldAPI.visibilityTest(this.center, this.extents.x);

            if (!this.isVisible) return;

            if (this.wasVisible === this.isVisible) {
                return;
            }

            this.applyTerrainSectionVisibility(tpf, this.isVisible);
        };

        TerrainSection.prototype.applyTerrainSectionVisibility = function(tpf, isVisible) {

            for (var i = 0; i < this.terrainFeatures.length; i++) {
                this.terrainFeatures[i].updateFeatureVisibility(tpf, isVisible);
            }
            this.wasVisible = isVisible;
        };

        TerrainSection.prototype.updateTerrainSection = function(tpf) {

            this.updateSectionVisibility(tpf);

            if (this.isVisible) {
                for (var i = 0; i < this.terrainFeatures.length; i++) {
                    this.terrainFeatures[i].updateTerrainFeature(tpf, this.isVisible)
                }
            }

        };

        return TerrainSection;

    });

