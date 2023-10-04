import {ConfigData} from "../../../application/utils/ConfigData.js";
import {TerrainMaterial} from "./TerrainMaterial.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {Object3D} from "../../../../libs/three/core/Object3D.js";
import {TerrainGeometry} from "./TerrainGeometry.js";
import * as TerrainFunctions from "./TerrainFunctions.js";
import * as CursorUtils from "../../camera/CursorUtils.js";

let scrubIndex = 0;

let terrainList = {};
let terrainIndex = {};
let terrainGeometries = [];
let lodCenter = new Vector3();
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

let getThreeTerrainHeightAt = function(terrainGeo, pos, normalStore, groundData) {
    if (!terrainGeo) {
        if (normalStore) {
            normalStore.set(0, 1, 0);
        }
        return pos.y
    }

    return TerrainFunctions.getHeightAt(pos, terrainGeo.getHeightmapData(), terrainGeo.tx_width, terrainGeo.tx_width - 1, normalStore, terrainScale, terrainOrigin, groundData);
};

let getThreeTerrainDataAt = function(terrainGeo, pos, dataStore) {
    return TerrainFunctions.getGroundDataAt(pos, terrainGeo.getGroundData(), terrainGeo.groundTxWidth, terrainGeo.groundTxWidth - 1, dataStore);
}

let shadeThreeTerrainDataAt = function(terrainGeo, pos, size, channelIndex, operation, intensity) {
    TerrainFunctions.shadeGroundCanvasAt(pos, terrainGeo.getHeightmapCanvas(), terrainGeo.tx_width, terrainGeo.tx_width - 1, size, channelIndex, operation, intensity);
    terrainGeo.updateHeightmapCanvasTexture();
}

let constructGeometries = function(heightMapData, transform, groundConfig, sectionInfoCfg) {
    let dims = heightMapData['dimensions'];
    gridMeshAssetId = dims['grid_mesh'];
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
            let geo = new TerrainGeometry(obj3d, geometrySize, i , j, gridMeshAssetId, vertsPerSegAxis, tiles, txWidth, groundTxWidth, groundConfig, sectionInfoCfg);
            terrainGeometries[i][j] = geo;
        }
    }
    geoBeneathPlayer = terrainGeometries[2][2];
    geoBeneathPlayer.call.initTerrainMaterials();
   // geoBeneathPlayer.call.activateGeo(0);
   // geoBeneathPlayer.call.deactivateGeo();

    frameGridExtentsChecks[0] = geoBeneathPlayer.gridX - gridConfig.range;
    frameGridExtentsChecks[1] = geoBeneathPlayer.gridY - gridConfig.range;
    frameGridExtentsChecks[2] = geoBeneathPlayer.gridX + gridConfig.range;
    frameGridExtentsChecks[3] = geoBeneathPlayer.gridY + gridConfig.range;
    lastFrameGridExtentsChecks[0] = frameGridExtentsChecks[0];
    lastFrameGridExtentsChecks[1] = frameGridExtentsChecks[1];
    lastFrameGridExtentsChecks[2] = frameGridExtentsChecks[2];
    lastFrameGridExtentsChecks[3] = frameGridExtentsChecks[3];
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
            if (preActiveGeo.isActive) {
                preActiveGeo.call.deactivateGeo();
            }
        }
    }

    while (activatingGeos.length) {
        let postActiveGeo = activatingGeos.pop()
        if (postActiveGeo.isActive === false) {
            postActiveGeo.call.activateGeo(0);
        }
    //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:postActiveGeo.obj3d.position, color:'YELLOW', size:0.2})
        activeTerrainGeometries.push(postActiveGeo);
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

let neighbors = [[-1,-1], [-1, 0], [-1, 1], [0, 0], [0, -1], [0, 1], [1,-1], [1, 0], [1, 1]];

let updateGridGeoByXY = function (gridX, gridY) {
    if (terrainGeometries[gridX]) {
        if (terrainGeometries[gridX][gridY]) {
            updateGeo(terrainGeometries[gridX][gridY])
        }
    }
}

let updateNeighbors = function(geoTile) {
    geoTile.neighborsUpdatedFrame = updateFrame;
    let playerGeoGridX = geoBeneathPlayer.gridX;
    let playerGeoGridY = geoBeneathPlayer.gridY;
    let updatedTileX = geoTile.gridX;
    let updatedTileY = geoTile.gridY;
    let nextX = updatedTileX;
    let nextY = updatedTileY;
    let gridDistX = updatedTileX - playerGeoGridX;
    let gridDistY = updatedTileY - playerGeoGridY;
    let gridDeltaX = updatedTileX

    if (Math.abs(gridDistX) > 28 || Math.abs(gridDistY) > 28) {
        return;
    }


        let isCorner = (Math.abs(gridDistX) - Math.abs(gridDistY)) === 0;
        nextX = updatedTileX + MATH.clamp(gridDistX, -1, 1);
        nextY = updatedTileY + MATH.clamp(gridDistY, -1, 1);
        if (isCorner) {
        //    updateGridGeoByXY(nextX, updatedTileY)
        //    updateGridGeoByXY(updatedTileX, nextY)
            updateGridGeoByXY(nextX, nextY)
        }
            updateGridGeoByXY(nextX, updatedTileY)
            updateGridGeoByXY(updatedTileX, nextY)

}

let geoTileUpdateCallback = function(geoTile) {
    // find the edges of terrain expanding from player (closest to camera?) geo and check for changes to the edge
    let updatedTileX = geoTile.gridX;
    let updatedTileY = geoTile.gridY;
    let nextX = updatedTileX;
    let nextY = updatedTileY;
    let isVisible = geoTile.isVisible;
    let wasVisible = geoTile.wasVisible;
    let playerGeoGridX = geoBeneathPlayer.gridX;
    let playerGeoGridY = geoBeneathPlayer.gridY;

    if (updatedTileX < frameGridExtentsChecks[0]) {
        frameGridExtentsChecks[0] = updatedTileX;
    }
    if (updatedTileY < frameGridExtentsChecks[1]) {
        frameGridExtentsChecks[1] = updatedTileY;
    }
    if (updatedTileX > frameGridExtentsChecks[2]) {
        frameGridExtentsChecks[2] = updatedTileX;
    }
    if (updatedTileY > frameGridExtentsChecks[3]) {
        frameGridExtentsChecks[3] = updatedTileY;
    }

    //   evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:GameAPI.getMainCharPiece().getPos(), to:geoTile.obj3d.position, color:'ORANGE'});
    if (geoTile === geoBeneathPlayer) {
        for (let i = 0; i < neighbors.length; i++) {
            let neighborXY = neighbors[i];
            nextX = updatedTileX + neighborXY[0];
            nextY = updatedTileY + neighborXY[1];
            updateGridGeoByXY(nextX, nextY)
        }
    } else if (isVisible || wasVisible) {
        if (geoTile.neighborsUpdatedFrame !== updateFrame) {
            updateNeighbors(geoTile)
        }
    }
}

let updateGeo = function(geoTile) {
    geoTile.updateTerrainGeometry(visibleGeoTiles, geoBeneathPlayer, geoTileUpdateCallback, updateFrame)
}

let lastFrameGridExtentsChecks = [-1, 0, 0, 0]; // xMin, yMin, xMax, yMax
let frameGridExtentsChecks = [0, 0, 0, 0];

let drawNearbyTerrain = function() {
    let playerGeoGridX = geoBeneathPlayer.gridX;
    let playerGeoGridY = geoBeneathPlayer.gridY;
    let centerRange = gridConfig.range+1;
    // always visible gridP -> pgg+cr
    // needs check -> pgg+cr+n

    frameGridExtentsChecks[0] = playerGeoGridX;
    frameGridExtentsChecks[1] = playerGeoGridY;
    frameGridExtentsChecks[2] = playerGeoGridX;
    frameGridExtentsChecks[3] = playerGeoGridY;

    //  if (lastFrameGridExtentsChecks[0] === -1) {
    lastFrameGridExtentsChecks[0] = playerGeoGridX;
    lastFrameGridExtentsChecks[1] = playerGeoGridY;
    lastFrameGridExtentsChecks[2] = playerGeoGridX;
    lastFrameGridExtentsChecks[3] = playerGeoGridY;
    //  }

    updateGeo(geoBeneathPlayer)


    lastFrameGridExtentsChecks[0] = frameGridExtentsChecks[0];
    lastFrameGridExtentsChecks[1] = frameGridExtentsChecks[1];
    lastFrameGridExtentsChecks[2] = frameGridExtentsChecks[2];
    lastFrameGridExtentsChecks[3] = frameGridExtentsChecks[3];

}

let scrubTerrainForError = function() {
    let countX = terrainGeometries.length;
    let countY = terrainGeometries[0].length;
    let gridY = scrubIndex % countY;
    let gridX = Math.floor(scrubIndex / countY) % countX;
//    console.log("Scrub terrain:", gridX, gridY)
    let geoTile = terrainGeometries[gridX][gridY];
    let wasVis = geoTile.isVisible;
    geoTile.updateTerrainGeometry(visibleGeoTiles, geoBeneathPlayer, geoTileUpdateCallback, updateFrame+0.5)
    let isVis = geoTile.isVisible;


   // if (isVis !== wasVis) {
        if (isVis) {
            geoTile.detachGeometryInstance();
            geoTile.attachGeometryInstance(null, geoTile.levelOfDetail);
        } else {
            geoTile.detachGeometryInstance();
        }
        // console.log("Scrub found failed tile visibility check",  wasVis, isVis, geoTile);
   // }

    scrubIndex++;
}

let getHeightAndNormal = function(pos, normal, groundData) {
    return getThreeTerrainHeightAt(geoBeneathPlayer, pos, normal, groundData)
}

let getTerrainData = function(pos, dataStore) {
    return getThreeTerrainDataAt(geoBeneathPlayer, pos, dataStore)
}

let shadeTerrainDataCanvas = function(pos, size, channelIndex, operation, intensity) {
    shadeThreeTerrainDataAt(geoBeneathPlayer, pos, size, channelIndex, operation, intensity)
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

function getLodCenter() {
    return lodCenter;
}

function getTerrainScale() {
    return terrainScale;
}

class ThreeTerrain {
    constructor() {

        this.call = {
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

    buildGroundShadeTexture() {
        for (let i = 0; i < terrainGeometries.length; i++) {
            for (let j = 0; j < terrainGeometries[i].length; j++) {
                let geo = terrainGeometries[i][j];
                geo.terrainSectionInfo.applyLodLevel(1, 6)
                geo.terrainElementModels.applyLevelOfDetail(1, geo.terrainSectionInfo);
                geo.terrainSectionInfo.applyLodLevel(-1, 6)
                geo.terrainElementModels.applyLevelOfDetail(-1, geo.terrainSectionInfo);
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

        CursorUtils.processTerrainLodCenter(lodCenter)
    //    if (GameAPI.gameMain.getPlayerCharacter()) {



            let playerGeo = getTerrainGeoAtPos(lodCenter);


            if (playerGeo !== geoBeneathPlayer) {
            //    activateTerrainGeos(playerGeo.gridX, playerGeo.gridY, gridConfig.range)
                geoBeneathPlayer = playerGeo;
            }
            drawNearbyTerrain();

            while (visibleGeoTiles.length) {
                let tile = visibleGeoTiles.pop();
                tile.updateTerrainGeometry(visibleGeoTiles, geoBeneathPlayer, geoTileUpdateCallback, updateFrame)
                if (tile.isVisible) {
                    postVisibleGeoTiles.push(tile);
                }
            }

            while (postVisibleGeoTiles.length) {
                let tile = postVisibleGeoTiles.pop();
                visibleGeoTiles.push(tile);
            }

    //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, {min:playerGeo.boundingBox.min, max:playerGeo.boundingBox.max, color:'GREEN'})


        /*
        if (visibleGeoTiles.length !== visibleCount) {
            console.log("Change visible geoTile count to:", visibleGeoTiles.length, "change:", visibleGeoTiles.length-visibleCount);
        }
        */

        }



   // }
}

export {ThreeTerrain}