import {ConfigData} from "../../../application/utils/ConfigData.js";
import {TerrainMaterial} from "./TerrainMaterial.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {Object3D} from "../../../../libs/three/core/Object3D.js";
import {TerrainGeometry} from "./TerrainGeometry.js";
import {TerrainFunctions} from "./TerrainFunctions.js";


let terrainList = {};
let terrainIndex = {};
let terrainGeometries = [];
let calcVec = new Vector3();
let terrainMaterial;

let transformModel = function(trf, model) {
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

let setMaterialRepeat = function(materialId, txMap, modelId) {

    let materials = terrainList[modelId].materials;

    for (let i = 0; i < materials.length; i++) {
        if (materials[i].id === materialId) {
            txMap.repeat.x = materials[i].repeat[0];
            txMap.repeat.y = materials[i].repeat[1];
        }
    }
};

let getTerrainMaterial = function(terrainId) {
    return terrainMaterial.getMaterialById(terrainId);
};

let createTerrain = function(callback, applies, array1d) {

    let material = getTerrainMaterial(applies.three_terrain);

    let opts = {
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

    let terrain;

    if (array1d) {
        if (array1d.length === 5) {
            opts.xSegments = 3;
            opts.ySegments = 3;
            terrain = new THREE.Terrain(opts);
            let vertexBuffer = new THREE.BufferAttribute( array1d[0] ,3 );
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

    let pPosx = parentObj.parent.position.x;
    let pPosz = parentObj.parent.position.z;
    let size = terrainModel.size;

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

    for (let key in terrainIndex) {
        if (checkPositionWithin(pos, terrainIndex[key].model, terrainIndex[key].parent)) {
            return terrainIndex[key];
        }
    }
};
let getThreeTerrainHeightAt = function(terrain, pos, normalStore) {
    return TerrainFunctions.getHeightAt(pos, terrain.array1d, terrain.size, terrain.segments, normalStore);
};

let constructGeometries = function(heightMapData, transform) {
    let dims = heightMapData['dimensions'];
    let gridMeshAssetId = dims['grid_mesh'];
    let txWidth = dims['tx_width'];
    let mesh_segments = dims['mesh_segments'];
    let segs = txWidth / (mesh_segments+1);
    console.log("Constructs HM Geos", gridMeshAssetId, txWidth, mesh_segments, segs);

    let terrainOrigin = new Vector3();
    MATH.vec3FromArray(terrainOrigin, transform['pos']);
    let terrainScale = new Vector3();
    MATH.vec3FromArray(terrainScale, transform['scale']);

    let segmentScale = new Vector3();
    segmentScale.copy(terrainScale);
    segmentScale.multiplyScalar(1/segs);

    let vertsPerSegAxis = txWidth/segs;
    let segsPerPlaneInstanceAxis = vertsPerSegAxis-1;

    let x0 = -terrainScale.x * 0.5;
    let z0 = -terrainScale.z * 0.5;

    for (let i = 0; i < segs; i++) {
        terrainGeometries[i] = [];
        for (let j = 0; j < segs; j++) {
            let obj3d = new Object3D();
            obj3d.position.x = x0 + segmentScale.x * i;
            obj3d.position.z = z0 + segmentScale.z * j;
            obj3d.position.add(terrainOrigin);
            obj3d.scale.copy(segmentScale);
            obj3d.scale.multiplyScalar(0.005);
            let terrainGeo = new TerrainGeometry(obj3d, i , j);
            terrainGeometries[i][j] = terrainGeo;
            terrainGeo.attachGeometryInstance(gridMeshAssetId)

        }
    }

    let originalModel =terrainGeometries[0][0].instance.originalModel

    console.log(originalModel.material)

};

class ThreeTerrain {
    constructor() {

    }

    loadData = function(matLoadedCB) {

        let terrainId = 'main_world'

        terrainMaterial = new TerrainMaterial(ThreeAPI);

        let terrainListLoaded = function(data) {
            console.log("TERRAINS", data);
                terrainList[terrainId] = data;
                terrainMaterial.addTerrainMaterial(terrainId, data['textures'], data['shader']);
                console.log("terrainListLoaded", data, terrainMaterial);
                constructGeometries(data['height_map'], data['transform']);
                matLoadedCB();

        };

    //    console.log("TERRAINS", "THREE", terrainMaterial)

        let configData = new ConfigData("ASSETS", "TERRAIN", "terrain_config", 'data_key', 'config')

    //    let configData =  new ConfigData("GAME", "GAME_ABILITIES",  'ability_config', 'data_key', 'config')
        configData.addUpdateCallback(terrainListLoaded);
        configData.parseConfig( terrainId, terrainListLoaded)

//        new PipelineObject("ASSETS", "TERRAIN", terrainListLoaded);
    };

    addTerrainToIndex = function(terrainModel, parent) {
            console.log("Add to Terrain index:", terrainModel, parent );
        terrainIndex[terrainModel.uuid] = {model:terrainModel, parent:parent};
    };

    loadTerrain = function(applies, array1d, rootObject, ThreeSetup, partsReady) {

        let setup = ThreeSetup;
        let modelId = applies.three_terrain;

        let attachModel = function(model) {

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

        let terrain = ThreeTerrain.getThreeHeightAt(pos, normalStore);

        if (terrain) {
            return terrain.vegetation;
        }
    };

    getThreeHeightAt = function(pos, normalStore) {

        let terrainStore = getThreeTerrainByPosition(pos);

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