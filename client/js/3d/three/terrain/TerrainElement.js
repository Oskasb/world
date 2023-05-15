"use strict";

define([

    ],
    function(

    ) {



        var i;
        var elemMap = {};
        elemMap[ENUMS.TerrainFeature.WOODS] = "tree_leafy_1";
        elemMap[ENUMS.TerrainFeature.STEEP_SLOPE] = "wall_rock_1";
        elemMap[ENUMS.TerrainFeature.FLAT_GROUND] = "tree_leafy_2";


        var tempVec1 = new THREE.Vector3();
        var tempVec2 = new THREE.Vector3();
        var tempObj3D = new THREE.Object3D();

        var TerrainElement = function(area, origin, sideSize) {

            this.area = area;
            this.origin = new THREE.Vector3().copy(origin);
            this.extents = new THREE.Vector3(sideSize, sideSize, sideSize);
            this.center = new THREE.Vector3().copy(this.extents).multiplyScalar(0.5);
            this.center.addVectors(this.center, this.origin);

            this.terrainElements = [];
            this.elementType = 0;
            this.scale = 1;

            this.renderables = [];
        };

        TerrainElement.prototype.addRenderable = function(ren) {
            this.renderables.push(ren);
        };

        TerrainElement.prototype.testTerrainElementsForType = function(elements, type) {
            for (var i = 0; i < elements.length; i++) {
                if (elements[i].elementType === type) {
                    return true;
                }
            }
        };


        TerrainElement.prototype.determineTerrainElementType = function(otherElements) {

        //    if (Math.random() < 0.15) return;

            tempVec1.x = this.center.x + (Math.random()-0.5)*this.extents.x * 0.5;
            tempVec1.z = this.center.z + (Math.random()-0.5)*this.extents.x * 0.5;
            tempVec1.y = this.area.getHeightAndNormalForPos(tempVec1, tempVec2);

            tempObj3D.position.x = 0;
            tempObj3D.position.z = 0;
            tempObj3D.position.y = 0;

            tempObj3D.quaternion.set(0, 0, 0, 1);
            tempObj3D.lookAt(tempVec2);
            tempObj3D.rotateX(Math.PI * 0.5);

            tempObj3D.rotateY(Math.PI * Math.random());

            if (tempVec1.y > 0) {

                if (tempVec1.y > 1 && tempVec2.y > 0.82) {

                    if (!this.testTerrainElementsForType(otherElements, ENUMS.TerrainFeature.WOODS)) {
                        this.scale = Math.floor(3*(Math.random()*Math.random()))+3;
                        tempVec1.y += 5.0 * this.scale + Math.random();
                        this.elementType = ENUMS.TerrainFeature.WOODS;

                    } else {

        //                if (Math.random() < 0.25) return;

                        this.scale =  1.5 + Math.floor(3*(Math.random()));
                        tempVec1.y += 4.0 * this.scale + Math.random() + Math.random();
                        this.elementType = ENUMS.TerrainFeature.WOODS;
                    }
                } else {
                    /*
                    if (tempVec2.y > 0.70) {
                        this.scale = 0.5 * Math.floor(3*(Math.random()))+0.5;
                        tempVec1.y += 2.5 * this.scale;
                        this.elementType = ENUMS.TerrainFeature.STEEP_SLOPE;
                    } else {
                        this.scale = Math.floor(3*(Math.random()))*0.3 +0.1;
                        tempVec1.y += 2 * this.scale;
                        this.elementType = ENUMS.TerrainFeature.STEEP_SLOPE;
                    }
                    */
                }

            } else {
                return
            }

            return WorldAPI.buildDynamicRenderable(elemMap[this.elementType], tempVec1, tempObj3D.quaternion, this.scale);

        //    this.visualizeTerrainElement(tempVec1, tempObj3D.quaternion);
        };


        TerrainElement.prototype.updateTerrainElement = function(tpf, visible) {

                for (i = 0; i < this.renderables.length; i++) {
                    this.renderables[i].tickRenderable();
                }
        };


        TerrainElement.prototype.updateTerrainElementVisibility = function(tpf, visible) {

                for (i = 0; i < this.renderables.length; i++) {
                    this.renderables[i].applyRenderableVisibility(visible);
                }

        };


        return TerrainElement;

    });

