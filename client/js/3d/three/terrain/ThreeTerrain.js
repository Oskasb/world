import {ConfigData} from "../../../application/utils/ConfigData.js";
import {TerrainMaterial} from "./TerrainMaterial.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {Object3D} from "../../../../libs/three/core/Object3D.js";
import {TerrainGeometry} from "./TerrainGeometry.js";
import { TerrainBigGeometry} from "./TerrainBigGeometry.js";
import {DynamicLodGrid} from "../../utils/DynamicLodGrid.js";
import * as TerrainFunctions from "./TerrainFunctions.js";
import * as CursorUtils from "../../camera/CursorUtils.js";
import {poolReturn} from "../../../application/utils/PoolUtils.js";

let scrubIndex = 0;

let terrainList = {};
let terrainIndex = {};
let terrainGeometries = [];
let lodCenter = new Vector3();
let terrainCenter = new Vector3();
let calcVec = new Vector3();
let posVec = new Vector3();
let normVec = new Vector3();
let terrainMaterial;
let gridMeshAssetId = 'thisLoadsFromConfig';
let gridConfig = {};
let geoBeneathPlayer = null;
let activeTerrainGeometries = [];
let terrainScale = new Vector3();
let terrainOrigin = new Vector3();
let updateFrame = 0;
let visibleGeoTiles = [];
let postVisibleGeoTiles = [];
let dynamicLodGrid = null;

let terrainBigGeometry = new TerrainBigGeometry();

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

let getThreeTerrainHeightAt = function(pos, normalStore, groundData) {
    if (!terrainBigGeometry.getHeightmapData()) {
        if (normalStore) {
            normalStore.set(0, 1, 0);
        }
        return pos.y
    }

    let params = terrainBigGeometry.getTerrainParams()

    return TerrainFunctions.getHeightAt(pos, terrainBigGeometry.getHeightmapData(), params.tx_width, params.tx_width - 1, normalStore, terrainScale, terrainOrigin, groundData);
};

let getThreeTerrainDataAt = function(pos, dataStore) {
    let params = terrainBigGeometry.getTerrainParams()
    return TerrainFunctions.getGroundDataAt(pos, terrainBigGeometry.getGroundData(), params.groundTxWidth, params.groundTxWidth - 1, dataStore);
}

let shadeThreeTerrainDataAt = function(pos, size, channelIndex, operation, intensity) {
    let params = terrainBigGeometry.getTerrainParams()
    TerrainFunctions.shadeGroundCanvasAt(pos, terrainBigGeometry.getHeightmapCanvas(), params.tx_width, params.tx_width - 1, size, channelIndex, operation, intensity);
    terrainBigGeometry.updateHeightmapCanvasTexture();
}

let constructGeometries = function(heightMapData, transform, groundConfig, sectionInfoCfg) {
    let dims = heightMapData['dimensions'];
    let txWidth = dims['tx_width'];
    let groundTxWidth = dims['ground_tx_width'];
    let mesh_segments = dims['mesh_segments'];
    let tiles = (txWidth / (mesh_segments+1));
    console.log("Constructs HM Geos", gridMeshAssetId, txWidth, mesh_segments, tiles);


    MATH.vec3FromArray(terrainOrigin, transform['pos']);

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
            obj3d.position.x = x0 + segmentScale.x * i + segmentScale.x*0.5 + terrainScale.x*0.5 / txWidth;
            obj3d.position.z = z0 + segmentScale.z * j + segmentScale.z*0.5 + terrainScale.z*0.5 / txWidth;
            obj3d.position.add(terrainOrigin);
            obj3d.scale.copy(segmentScale);
            obj3d.scale.multiplyScalar(0.005);
            let geo = new TerrainGeometry(obj3d, geometrySize, i , j, vertsPerSegAxis, tiles, txWidth, groundTxWidth, groundConfig, sectionInfoCfg);
            terrainGeometries[i][j] = geo;
        }
    }
    geoBeneathPlayer = terrainGeometries[2][2];
   // geoBeneathPlayer.call.initTerrainMaterials();

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


let color = {};
let debugDrawNearby = function(index) {
    calcVec.set(0.5 * Math.sin(GameAPI.getGameTime()), 0 , 0.5 * Math.cos(GameAPI.getGameTime()));
    calcVec.multiplyScalar( 1.0 + index*0.4)
    posVec.add(calcVec);
    posVec.y = getHeightAndNormal(posVec, normVec);
    normVec.add(posVec);
    ThreeAPI.groundAt(posVec, color);
    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:posVec, color:color, size:0.2});
    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:posVec, to:normVec, color:'ORANGE'});
}


let lastFrameGridExtentsChecks = [-1, 0, 0, 0]; // xMin, yMin, xMax, yMax
let frameGridExtentsChecks = [0, 0, 0, 0];




let getHeightAndNormal = function(pos, normal, groundData) {
    return getThreeTerrainHeightAt(pos, normal, groundData)
}

let getTerrainData = function(pos, dataStore) {
    return getThreeTerrainDataAt(pos, dataStore)
}

let shadeTerrainDataCanvas = function(pos, size, channelIndex, operation, intensity) {
    shadeThreeTerrainDataAt(pos, size, channelIndex, operation, intensity)
}


let subscribeToLodUpdate = function(pos, callback) {
    let geoTile = getTerrainGeoAtPos(pos);
    geoTile.addLodUpdateCallback(callback);
}

let removeLodUpdateCB = function(callback) {
    for (let i = 0; i < terrainGeometries.length; i++) {
        for (let j = 0; j < terrainGeometries[i].length;j++) {
            terrainGeometries[i][j].removeLodUpdateCallback(callback);
        }
    }
}


let drawTilesByLodGrid = function(frame) {

    let tiles = dynamicLodGrid.getTiles();
    for (let i = 0; i < tiles.length; i++) {
        for (let j = 0; j < tiles[i].length;j++) {
            let tile = tiles[i][j];
            let geo = getTerrainGeoAtPos(tile.getPos());
        //    if (geo.levelOfDetail !== tile.lodLevel) {
        //    if (tile.lodLevel !== -1) {
                geo.updateVisibility(tile.lodLevel, frame)
        //    }

        //    }
        }
    }
    if (Math.random() < 0.01) {
        for (let i = 0; i < terrainGeometries.length; i++) {
            for (let j = 0; j < terrainGeometries[i].length;j++) {
                let geo = terrainGeometries[i][j];
                if (geo.updateFrame !== frame) {
                    if (geo.levelOfDetail !== -1) {
                        console.log("not hidden tile found")
                        geo.updateVisibility(-1,  frame)
                    }
                }
            }
        }
    }

}

function getLodCenter() {
    return lodCenter;
}

function getTerrainScale() {
    return terrainScale;
}

let delayedShade = function(geo, prog, progressCB) {
    geo.terrainSectionInfo.applyLodLevel(1, 6)
    geo.terrainElementModels.applyLevelOfDetail(1, geo.terrainSectionInfo);
    geo.terrainSectionInfo.applyLodLevel(-1, 6)
    geo.terrainElementModels.applyLevelOfDetail(-1, geo.terrainSectionInfo);
    prog.done++;
    prog.progress = MATH.calcFraction(0, prog.all, prog.done)
    prog.remaining = prog.all - prog.done;
    prog.msg = "Shade Tile: "+prog.done;

    progressCB(prog);
}

function shadeGeoTile(geo, prog, progressCB) {
    setTimeout(function() {
        delayedShade(geo, prog, progressCB)
    },0)
}

function getTerrainGeos() {
    return terrainGeometries;
}

class ThreeTerrain {
    constructor() {

        this.call = {
            getTerrainGeos:getTerrainGeos,
            getLodCenter:getLodCenter,
            getHeightAndNormal:getHeightAndNormal,
            getTerrainData:getTerrainData,
            shadeTerrainDataCanvas:shadeTerrainDataCanvas,
            subscribeToLodUpdate:subscribeToLodUpdate,
            removeLodUpdateCB:removeLodUpdateCB,
            getTerrainScale:getTerrainScale
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
            constructGeometries(data['height_map'], data['transform'], data['ground'], data['section_info']);
            terrainBigGeometry.initBigTerrainGeometry(terrainCenter, data['height_map'], data['transform'], data['ground'], data['section_info']);
            matLoadedCB();

        };


        dynamicLodGrid = new DynamicLodGrid();
        dynamicLodGrid.activateLodGrid({lod_levels: 4, tile_range:18, tile_spacing:16, hide_tiles:true, center_offset:true, debug:false})

        let configData = new ConfigData("ASSETS", "TERRAIN", "terrain_config", 'data_key', 'config')
        configData.addUpdateCallback(terrainListLoaded);
        configData.parseConfig( terrainId, terrainListLoaded)

    };


    buildGroundShadeTexture(progressCB) {
        let prog = {}
        prog.done = 0;
        prog.progress = 0;
        prog.all = terrainGeometries.length* terrainGeometries[0].length
        prog.msg = prog.all;
        prog.channel = 'pipeline_message';
        for (let i = 0; i < terrainGeometries.length; i++) {
            for (let j = 0; j < terrainGeometries[i].length; j++) {
                let geo = terrainGeometries[i][j];
                shadeGeoTile(geo, prog, progressCB);
            }
        }
    }

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




    updateThreeTerrainGeometry = function() {

        updateFrame = GameAPI.getFrame().frame;

        let visibleCount = visibleGeoTiles.length;

    //    scrubTerrainForError();

        CursorUtils.processTerrainLodCenter(lodCenter, terrainCenter)
    //    if (GameAPI.gameMain.getPlayerCharacter()) {

            let playerGeo = getTerrainGeoAtPos(lodCenter);

            if (playerGeo !== geoBeneathPlayer) {
            //    activateTerrainGeos(playerGeo.gridX, playerGeo.gridY, gridConfig.range)
                geoBeneathPlayer = playerGeo;
            }

            let releasedPoints = dynamicLodGrid.updateDynamicLodGrid(terrainCenter);

            while (releasedPoints.length) {
                let pointVec3 = releasedPoints.pop()
                let geo = getTerrainGeoAtPos(pointVec3);
                geo.updateVisibility(-1, -1)
                poolReturn(pointVec3);
            }

            drawTilesByLodGrid(updateFrame)
    }
}

export {ThreeTerrain}