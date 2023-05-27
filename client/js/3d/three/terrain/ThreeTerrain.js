import {ConfigData} from "../../../application/utils/ConfigData.js";
import {TerrainMaterial} from "./TerrainMaterial.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {Object3D} from "../../../../libs/three/core/Object3D.js";
import {TerrainGeometry} from "./TerrainGeometry.js";
import * as TerrainFunctions from "./TerrainFunctions.js";


let terrainList = {};
let terrainIndex = {};
let terrainGeometries = [];
let calcVec = new Vector3();
let posVec = new Vector3();
let normVec = new Vector3();
let terrainMaterial;
let gridMeshAssetId = 'thisLoadsFromConfig';
let gridConfig = {};
let geoBeneathPlayer = null;
let activeTerrainGeometries = [];

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
let getThreeTerrainHeightAt = function(terrainGeo, pos, normalStore) {
    return TerrainFunctions.getHeightAt(pos, terrainGeo.getHeightmapData(), terrainGeo.tx_width, terrainGeo.tx_width - 1, normalStore);
};

let constructGeometries = function(heightMapData, transform) {
    let dims = heightMapData['dimensions'];
    gridMeshAssetId = dims['grid_mesh'];
    let txWidth = dims['tx_width'];
    let mesh_segments = dims['mesh_segments'];
    let tiles = (txWidth / (mesh_segments+1));
    console.log("Constructs HM Geos", gridMeshAssetId, txWidth, mesh_segments, tiles);

    let terrainOrigin = new Vector3();
    MATH.vec3FromArray(terrainOrigin, transform['pos']);
    let terrainScale = new Vector3();
    MATH.vec3FromArray(terrainScale, transform['scale']);

    let segmentScale = new Vector3();
    segmentScale.copy(terrainScale);
    segmentScale.multiplyScalar(1/tiles);
    segmentScale.y = terrainScale.y * 0.02;
    let geometrySize = segmentScale.x
    let vertsPerSegAxis = txWidth/tiles;
    let segsPerPlaneInstanceAxis = vertsPerSegAxis-1;

    let x0 = -terrainScale.x * 0.5;
    let z0 = -terrainScale.z * 0.5;

    for (let i = 0; i < tiles; i++) {
        terrainGeometries[i] = [];
        for (let j = 0; j < tiles; j++) {
            let obj3d = new Object3D();
            obj3d.position.x = x0 + segmentScale.x * i + segmentScale.x*0.5;
            obj3d.position.z = z0 + segmentScale.z * j + segmentScale.z*0.5;
            obj3d.position.add(terrainOrigin);
            obj3d.scale.copy(segmentScale);
            obj3d.scale.multiplyScalar(0.005);
            terrainGeometries[i][j] = new TerrainGeometry(obj3d, geometrySize, i , j, gridMeshAssetId, vertsPerSegAxis, tiles, txWidth);
        }
    }
    geoBeneathPlayer = terrainGeometries[0][0];
    geoBeneathPlayer.call.activateGeo();
    let heightmapData = geoBeneathPlayer.getHeightmapData();
    geoBeneathPlayer.call.deactivateGeo();

  //  activeTerrainGeometries.push(geoBeneathPlayer);
};

let getTerrainGeoAtPos = function(posVec3) {

    for (let i = 0; i < terrainGeometries.length; i++) {
        let row = terrainGeometries[i][0];
        if (row.posX + row.size*0.5 > posVec3.x) {
            for (let j = 0; j < terrainGeometries[i].length; j++) {
                let geo = terrainGeometries[i][j];
                if (geo.posZ + row.size*0.5 > posVec3.z) {
                    return geo;
                }
            }
        }
    }
}

let activatingGeos = [];
let activateTerrainGeos = function(x, y, range) {

    let sections = range*2+1;
    for (let i = 0; i < sections; i++) {
        if (x - range < 0 || x + range+i > terrainGeometries.length) {

        } else {

            for (let j = 0; j < sections; j++) {

                if (y - range < 0 || y + range+j > terrainGeometries[i].length) {

                } else {
                    activatingGeos.push(terrainGeometries[x-range+i][y-range+j]);
                }
            }
        }
    }

    while (activeTerrainGeometries.length) {
        let preActiveGeo = activeTerrainGeometries.pop();
        if (activatingGeos.indexOf(preActiveGeo) === -1) {
        //    if (preActiveGeo.isActive) {
                preActiveGeo.call.deactivateGeo();
         //   }
        }
    }

    while (activatingGeos.length) {
        let postActiveGeo = activatingGeos.pop()
         //   if (postActiveGeo.isActive === false) {
                postActiveGeo.call.activateGeo();
        //    }
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:postActiveGeo.obj3d.position, color:'YELLOW', size:0.2})
            activeTerrainGeometries.push(postActiveGeo);
        }

}

let getHeightAndNormal = function(pos, normal) {
    return getThreeTerrainHeightAt(geoBeneathPlayer, pos, normal)
}

class ThreeTerrain {
    constructor() {

        this.call = {
            getHeightAndNormal:getHeightAndNormal
        }
    }

    loadData = function(matLoadedCB) {

        let terrainId = 'main_world'
        terrainMaterial = new TerrainMaterial(ThreeAPI);

        let terrainListLoaded = function(data) {
            console.log("TERRAINS", data);
                terrainList[terrainId] = data;
            //    terrainMaterial.addTerrainMaterial(terrainId, data['textures'], data['shader']);
            //    console.log("terrainListLoaded", data, terrainMaterial, terrainMaterial.getMaterialById(terrainId));
                gridConfig = data['grid']
                constructGeometries(data['height_map'], data['transform']);
                matLoadedCB();

        };

        let configData = new ConfigData("ASSETS", "TERRAIN", "terrain_config", 'data_key', 'config')
        configData.addUpdateCallback(terrainListLoaded);
        configData.parseConfig( terrainId, terrainListLoaded)
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




    updateTerrainGeometry = function() {

        let debugDrawNearby = function(index) {
            calcVec.set(0.5 * Math.sin(GameAPI.getGameTime()), 0 , 0.5 * Math.cos(GameAPI.getGameTime()));
            calcVec.multiplyScalar(Math.sin(0.3 * GameAPI.getGameTime()+index) + 1.0)
            posVec.add(calcVec);
            posVec.y = getHeightAndNormal(posVec, normVec);
            normVec.add(posVec);
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:posVec, color:'GREEN', size:0.3});
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:posVec, to:normVec, color:'ORANGE'});
        }

        if (GameAPI.gameMain.getPlayerCharacter()) {
            let playerPos = GameAPI.getMainCharPiece().getPos();
            let playerGeo = getTerrainGeoAtPos(playerPos);

            evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:playerGeo.obj3d.position, color:'GREEN', size:0.3})

            if (playerGeo !== geoBeneathPlayer) {
                activateTerrainGeos(playerGeo.gridX, playerGeo.gridY, gridConfig.range)
                geoBeneathPlayer = playerGeo;
            }

            posVec.copy(playerPos);
            posVec.y = getHeightAndNormal(playerPos, normVec);
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:posVec, color:'GREEN', size:0.3});
            normVec.add(posVec);
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:posVec, to:normVec, color:'AQUA'});

            for (let i = 0; i < 4; i++) {
                debugDrawNearby(i);
            }
        }
    }
}

export {ThreeTerrain}