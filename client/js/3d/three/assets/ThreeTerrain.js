import {PipelineObject} from "../../../application/load/PipelineObject.js";
import {TerrainMaterial} from "./TerrainMaterial.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";
import * as TerrainFunctions from "./TerrainFunctions.js";


        var terrainList = {};
        var terrainIndex = {};

        var calcVec = new Vector3();
        var terrainMaterial;

var transformModel = function(trf, model) {
    model.position.x = trf.pos[0];
    model.position.y = trf.pos[1];
    model.position.z = trf.pos[2];
    model.rotation.x = trf.rot[0]*Math.PI;
    model.rotation.y = trf.rot[1]*Math.PI;
    model.rotation.z = trf.rot[2]*Math.PI;
    model.scale.x =    trf.scale[0];
    model.scale.y =    trf.scale[1];
    model.scale.z =    trf.scale[2];
};

var setMaterialRepeat = function(materialId, txMap, modelId) {

    var materials = terrainList[modelId].materials;

    for (var i = 0; i < materials.length; i++) {
        if (materials[i].id === materialId) {
            txMap.repeat.x = materials[i].repeat[0];
            txMap.repeat.y = materials[i].repeat[1];
        }
    }
};

var getTerrainMaterial = function(terrainId) {
    return terrainMaterial.getMaterialById(terrainId);
};

var createTerrain = function(callback, applies, array1d) {

    var material = getTerrainMaterial(applies.three_terrain);

    var opts = {
        after: null,
        easing: THREE.Terrain.EaseInOut,
        heightmap: THREE.Terrain.DiamondSquare,
        material: material,
        maxHeight: applies.max_height,
        minHeight: applies.min_height,
        optimization: THREE.Terrain.NONE,
        frequency: applies.frequency,
        steps: applies.steps,
        stretch: true,
        turbulent: false,
        useBufferGeometry: false,
        xSegments: applies.terrain_segments,
        xSize: applies.terrain_size,
        ySegments: applies.terrain_segments,
        ySize: applies.terrain_size
    };

    var terrain;

    if (array1d) {
        if (array1d.length === 5) {
            opts.xSegments = 3;
            opts.ySegments = 3;
            terrain = new THREE.Terrain(opts);

            var vertexBuffer = new THREE.BufferAttribute( array1d[0] ,3 );
            terrain.children[0].geometry = new THREE.BufferGeometry();
            terrain.children[0].geometry.addAttribute('position', vertexBuffer);
            terrain.children[0].geometry.addAttribute('normal', new THREE.BufferAttribute( array1d[1] ,3 ));
            terrain.children[0].geometry.addAttribute('color', new THREE.BufferAttribute( array1d[2] ,3 ));
            terrain.children[0].geometry.addAttribute('uv', new THREE.BufferAttribute( array1d[3] ,2 ))


            array1d = array1d[4];

        } else {
            terrain = new THREE.Terrain(opts);
            THREE.Terrain.fromArray1D(terrain.children[0].geometry.vertices, array1d);

            terrain.children[0].geometry.computeFaceNormals();
            terrain.children[0].geometry.computeVertexNormals();
            terrain.children[0].geometry = new THREE.BufferGeometry().fromGeometry( terrain.children[0].geometry );
        }

    } else {
        terrain = new THREE.Terrain(opts);
    }

    terrain.children[0].needsUpdate = true;
    terrain.children[0].position.x += applies.terrain_size*0.5;
    terrain.children[0].position.y -= applies.terrain_size*0.5;

    terrain.size = applies.terrain_size;
    terrain.segments = applies.terrain_segments;
    terrain.array1d = array1d;
    terrain.height = applies.max_height - applies.min_height;
    terrain.vegetation = applies.vegetation_system;

    callback(terrain);
};

let checkPositionWithin = function(pos, terrainModel, parentObj) {

    if (!parentObj.parent) return;


    var pPosx = parentObj.parent.position.x;
    var pPosz = parentObj.parent.position.z;
    var size = terrainModel.size;

    if (parentObj.parent.parent) {
        pPosx += parentObj.parent.parent.position.x;
        pPosz += parentObj.parent.parent.position.z;
    }
    pPosx -= size;
    pPosz -= size;

    if (pPosx <= pos.x && pPosx + size > pos.x) {
        if (pPosz <= pos.z && pPosz + size > pos.z) {
            return true;
        }
    }
    return false;
};

let getThreeTerrainByPosition = function(pos) {

    for (var key in terrainIndex) {
        if (checkPositionWithin(pos, terrainIndex[key].model, terrainIndex[key].parent)) {
            return terrainIndex[key];
        }
    }
};
let getThreeTerrainHeightAt = function(terrain, pos, normalStore) {

    return TerrainFunctions.getHeightAt(pos, terrain.array1d, terrain.size, terrain.segments, normalStore);
};

        class ThreeTerrain {
            constructor() {

            }

        
        loadData = function(TAPI) {

            terrainMaterial = new TerrainMaterial(TAPI);

            
            var terrainListLoaded = function(scr, data) {
                console.log("TERRAINS", scr, data)
                for (var i = 0; i < data.length; i++){
                    terrainList[data[i].id] = data[i];
                    terrainMaterial.addTerrainMaterial(data[i].id, data[i].textures, data[i].shader);
                    console.log("terrainListLoaded", terrainMaterial)
                }
            };

            console.log("TERRAINS", "THREE", terrainMaterial)

            new PipelineObject("ASSETS", "TERRAIN", terrainListLoaded);
        };




        addTerrainToIndex = function(terrainModel, parent) {
        //    console.log("Add to Terrain index:", terrainModel, parent );
            terrainIndex[terrainModel.uuid] = {model:terrainModel, parent:parent};

        };

        loadTerrain = function(applies, array1d, rootObject, ThreeSetup, partsReady) {

            var setup = ThreeSetup;
            var modelId = applies.three_terrain;

                var attachModel = function(model) {

                    setup.addToScene(model);
                    rootObject.add(model);
                    ThreeTerrain.addTerrainToIndex(model, rootObject);
                    transformModel(terrainList[modelId].transform, model);

                };

                createTerrain(attachModel, applies, array1d);

            return rootObject;
        };







        removeTerrainFromIndex = function(terrain) {
            delete terrainIndex[terrain.model.uuid]
        };




        terrainVegetationIdAt = function(pos, normalStore) {

            var terrain = ThreeTerrain.getThreeHeightAt(pos, normalStore);

            if (terrain) {
                return terrain.vegetation;
            }
        };

        getThreeHeightAt = function(pos, normalStore) {

            var terrainStore = getThreeTerrainByPosition(pos);

            if (terrainStore) {
                calcVec.subVectors(pos, terrainStore.parent.parent.position);
            //    calcVec.x -= terrainStore.model.size / 2;
            //    calcVec.z -= terrainStore.model.size / 2;
                pos.y = getThreeTerrainHeightAt(terrainStore.model, calcVec, normalStore);

                return terrainStore.model;
            } else {
            //    console.log("Not on terrain")
            }
            
        };

    }

export {ThreeTerrain}