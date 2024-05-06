import {ConfigData} from "../../../application/utils/ConfigData.js";
import {TerrainMaterial} from "./TerrainMaterial.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {Object3D} from "../../../../libs/three/core/Object3D.js";
import {TerrainGeometry} from "./TerrainGeometry.js";
import { TerrainBigGeometry} from "./TerrainBigGeometry.js";
import {DynamicLodGrid} from "../../../application/utils/DynamicLodGrid.js";
import * as TerrainFunctions from "./TerrainFunctions.js";
import * as CursorUtils from "../../camera/CursorUtils.js";
import {poolReturn} from "../../../application/utils/PoolUtils.js";
import { ImageLoader } from "../../../../libs/three/loaders/ImageLoader.js";
import {applyGroundCanvasEdit, fitHeightToAABB} from "./TerrainFunctions.js";
import {getTerrainBodyPointer, rayTest, testProbeFitsAtPos} from "../../../application/utils/PhysicsUtils.js";
import {ENUMS} from "../../../application/ENUMS.js";

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
let activeTerrainGeometries = [];
let terrainScale = new Vector3();
let terrainOrigin = new Vector3();
let updateFrame = 0;
let visibleGeoTiles = [];
let postVisibleGeoTiles = [];
let dynamicLodGrid = null;
let shadeCompleted = false;
let terrainBigGeometry = new TerrainBigGeometry();

let tempVec1 = new Vector3();
let tempVec2 = new Vector3()

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

let alignThreeTerrainDataToAABB = function(aabb) {
    let params = terrainBigGeometry.getTerrainParams()
    let updateRect =  TerrainFunctions.fitHeightToAABB(aabb, terrainBigGeometry.getHeightmapCanvas(), params.tx_width, params.tx_width - 1, params.minHeight, params.maxHeight);
    terrainBigGeometry.updateHeightmapCanvasTexture(updateRect);
}




function applyTerrainEdit(edit, ) {
    console.log("applyTerrainEdit", edit);

    let params = terrainBigGeometry.getTerrainParams()
    if (edit.operation === "GROUND") {
        let updateRect = TerrainFunctions.applyGroundCanvasEdit(edit, terrainBigGeometry.getGroundCanvas(), params.tx_width*2, params.tx_width*2 - 1);
        terrainBigGeometry.updateGroundCanvasTexture(updateRect);
    } else {
        let updateRect = TerrainFunctions.applyTerrainCanvasEdit(edit, terrainBigGeometry.getHeightmapCanvas(), params.tx_width, params.tx_width - 1, params.minHeight, params.maxHeight);
        terrainBigGeometry.updateHeightmapCanvasTexture(updateRect);
    }

}

let imprintEdit = {
    biome:[115, 0, 165],
    operation : "GROUND"
}



function queueImprint(x, y, z, i) {

    setTimeout(function() {
        imprintEdit.radius = 1.0;
        imprintEdit.sharpness = 0.65;
        imprintEdit.noise = 1;
        imprintEdit.strength = 5;
        imprintEdit.pos.x = x // -0.5;
        imprintEdit.pos.y = y;
        imprintEdit.pos.z = z +1 //0.5;
        imprintEdit.radius = 0.25 + Math.round(MATH.sillyRandom(i*0.01)*3) * 1;
        imprintEdit.operation = 'GROUND';
        applyTerrainEdit(imprintEdit);
        imprintEdit.sharpness = 0.99;
        imprintEdit.noise = 0;
        imprintEdit.strength = 0;
        imprintEdit.operation = 'FLATTEN';
        applyTerrainEdit(imprintEdit);
        shadeThreeTerrainDataAt(imprintEdit.pos, imprintEdit.radius*1.6, 2, 'lighten', 0.1+0.4/imprintEdit.radius)
    }, i * 50)

}

function testCirclePoint(frac, vec3, height) {

    calcVec.copy(vec3)

    calcVec.x = Math.sin(frac) * 0.75 + vec3.x;
    calcVec.z = Math.cos(frac) * 0.75 + vec3.z;

    let groundY = ThreeAPI.terrainAt(calcVec);
    calcVec.y = groundY + 0.05;

    tempVec2.copy(calcVec);
    tempVec2.y += height

    let hit = rayTest(tempVec2, calcVec, calcVec, tempVec2)
    if (hit) {
        if (hit.ptr !== getTerrainBodyPointer()) {
            tempVec1.copy(calcVec);
            return hit
        }
    }
}

function imprintGroundInAABB(aabb) {

    let min = aabb.min;
    let max = aabb.max;

    let diffX = Math.ceil(max.x+3 - (min.x-2));
    let diffZ = Math.ceil(max.z+3 - (min.z-2));
    let height = 2 // max.y - min.y;

    imprintEdit.pos = tempVec1;
    imprintEdit.radius = 1.0;
    imprintEdit.sharpness = 0.65;
    imprintEdit.noise = 1;
    imprintEdit.strength = 10;
    let print = 0;

    for (let i = 0; i < diffX; i++) {
        for (let j = 0; j < diffZ; j++) {

            tempVec1.x = min.x + i - 1;
            tempVec1.z = min.z + j - 1;
            let groundY = ThreeAPI.terrainAt(tempVec1);
            tempVec1.y = groundY + 0.01;
            tempVec2.copy(tempVec1);
            tempVec2.y += height

            let hit = rayTest(tempVec2, tempVec1, tempVec1, tempVec2, true)
            if (hit && hit.ptr !== getTerrainBodyPointer()) {
                print++;
                queueImprint(tempVec1.x, tempVec1.y, tempVec1.z, print)
            } else {

                for (let l = 0; l < 6; l++) {

                    let hit = testCirclePoint(tempVec1, i / l, height);
                    if (hit) {
                        l = 7;
                        queueImprint(tempVec1.x, tempVec1.y, tempVec1.z, print, true)
                    }
                }

            }
        }
    }

}

let constructGeometries = function(heightMapData, transform, groundConfig, sectionInfoCfg) {
    let dims = heightMapData['dimensions'];
    let txWidth = dims['tx_width'];
    let groundTxWidth = dims['ground_tx_width'];
    let mesh_segments = dims['mesh_segments'];
//let lodTiles = dims['lod_tiles'];
    let tiles = (txWidth / (mesh_segments+1));
 //   console.log("Constructs HM Geos", gridMeshAssetId, txWidth, mesh_segments, tiles);

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



let getTerrainGeosAtTile = function(tile, storeList) {

    tile.getTileExtents(tempVec1, tempVec2);

    for (let i = 0; i < terrainGeometries.length; i++) {
        let row = terrainGeometries[i][0];
        let geoCenterX = row.posX + row.size*0.5
        if (geoCenterX > tempVec1.x && geoCenterX < tempVec2.x) {
            for (let j = 0; j < terrainGeometries[i].length; j++) {
                let geo = terrainGeometries[i][j];
                let geoCenterZ = geo.posZ + geo.size*0.5
                if (geoCenterZ > tempVec1.z && geoCenterZ < tempVec2.z) {
                    storeList.push(geo);
                }
            }
        }
    }
}

let getHeightAndNormal = function(pos, normal, groundData) {
    return getThreeTerrainHeightAt(pos, normal, groundData)
}

let getTerrainData = function(pos, dataStore) {
    return getThreeTerrainDataAt(pos, dataStore)
}

let shadeTerrainDataCanvas = function(pos, size, channelIndex, operation, intensity) {
    shadeThreeTerrainDataAt(pos, size, channelIndex, operation, intensity)
}

let alignDataCanvasToAABB = function(aabb) {
    alignThreeTerrainDataToAABB(aabb)
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

let hideTiles = [];

let drawTilesByLodGrid = function(frame) {

   // if (frame%5 === 0) {
        for (let i = 0; i < visibleGeoTiles.length; i++) {
        //    for (let j = 0; j < terrainGeometries[i].length;j++) {
                let geo = visibleGeoTiles[i];
               if (geo.updateFrame !== frame) {
            //        if (geo.levelOfDetail === -1) {
                        hideTiles.push(geo);
                    }
          //      }
          //  }
    //    }
    }
        while (hideTiles.length) {
            let geo = hideTiles.pop();
            geo.updateVisibility(-1,  -1)
        //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:terrainCenter, to:geo.getOrigin(), color:'CYAN', drawFrames:20});
            MATH.splice(visibleGeoTiles, geo)
        }


        return;
    for (let i = 0; i < terrainGeometries.length; i++) {
        for (let j = 0; j < terrainGeometries[i].length;j++) {
        let geo = terrainGeometries[i][j];
        if (geo.updateFrame !== frame) {
            if (geo.levelOfDetail !== -1) {
                console.log("not hidden tile found")
                geo.updateVisibility(-1,  frame)
                hideTiles.push(geo);
            //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:terrainCenter, to:geo.getOrigin(), color:'YELLOW', drawFrames:20});
            }
            //      }
        }
            }
    }

}

let updateLodList = [];


function tileUpdateCB(tile, centerTileUpdated) {
    if (!updateLodList[tile.index]) {
        updateLodList[tile.index] = [];
    }
    let lodList = updateLodList[tile.index]

    if (centerTileUpdated) {
        MATH.emptyArray(lodList);
        getTerrainGeosAtTile(tile, lodList)
    }

    for (let i = 0; i < lodList.length; i++) {
        let geo = lodList[i];
        geo.updateVisibility(tile.lodLevel,  updateFrame)
        if (tile.lodLevel !== -1) {
            if (visibleGeoTiles.indexOf(geo) === -1) {
                visibleGeoTiles.push(geo);
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

function getTerrainBigGeo() {
    return terrainBigGeometry;
}

function clearTerrainGeometries() {
    for (let i = 0; i < terrainGeometries.length; i++) {
        for (let j = 0; j < terrainGeometries[i].length;j++) {
            terrainGeometries[i][j].applyLodLevelChange(-1);
            terrainGeometries[i][j].clearTerrainGeometry();
        }
    }
}

let terrainData;
let terrainId = 'main_world'

let populateTerrainGeometries = function() {
    console.log("populateTerrainGeometries..", terrainData)
    constructGeometries(terrainData['height_map'], terrainData['transform'], terrainData['ground'], terrainData['section_info']);

    let data = terrainData;
    terrainList[terrainId] = data;
    gridConfig = data['grid']

    dynamicLodGrid.activateLodGrid({lodLevels:data['section_info']['lod_levels'].length, tile_range:gridConfig['tile_range'], tile_spacing:gridConfig['tile_spacing'], hide_tiles:gridConfig['hide_tiles'], center_offset:true, debug:false})

}


class ThreeTerrain {
    constructor() {

        this.call = {
            getTerrainBigGeo:getTerrainBigGeo,
            getTerrainGeos:getTerrainGeos,
            getLodCenter:getLodCenter,
            getHeightAndNormal:getHeightAndNormal,
            getTerrainData:getTerrainData,
            shadeTerrainDataCanvas:shadeTerrainDataCanvas,
            alignDataCanvasToAABB:alignDataCanvasToAABB,
            imprintGroundInAABB:imprintGroundInAABB,
            subscribeToLodUpdate:subscribeToLodUpdate,
            removeLodUpdateCB:removeLodUpdateCB,
            getTerrainScale:getTerrainScale,
            clearTerrainGeometries:clearTerrainGeometries,
            populateTerrainGeometries:populateTerrainGeometries,
            applyTerrainEdit:applyTerrainEdit
        }


    }

    loadData = function(matLoadedCB) {

        terrainMaterial = new TerrainMaterial(ThreeAPI);
        dynamicLodGrid = new DynamicLodGrid();

        let terrainListLoaded = function(data) {
        //    console.log("TERRAINS", data);
            terrainList[terrainId] = data;
            //    terrainMaterial.addTerrainMaterial(terrainId, data['textures'], data['shader']);
            //    console.log("terrainListLoaded", data, terrainMaterial, terrainMaterial.getMaterialById(terrainId));
            gridConfig = data['grid']
            terrainData = data;

        //    populateTerrainGeometries = function() {
        //        console.log("populateTerrainGeometries")
            //    constructGeometries(data['height_map'], data['transform'], data['ground'], data['section_info']);
        //    }

            terrainBigGeometry.initBigTerrainGeometry(terrainCenter, data['height_map'], data['transform'], data['ground'], data['section_info']);

            dynamicLodGrid.activateLodGrid({lodLevels:data['section_info']['lod_levels'].length, tile_range:gridConfig['tile_range'], tile_spacing:gridConfig['tile_spacing'], hide_tiles:gridConfig['hide_tiles'], center_offset:true, debug:false})


            matLoadedCB();
        }


        let configData = new ConfigData("ASSETS", "TERRAIN", "terrain_config", 'data_key', 'config')
        configData.addUpdateCallback(terrainListLoaded);
        configData.parseConfig( terrainId, terrainListLoaded)

    };

    shadeIsCompleted() {
        return shadeCompleted;
    }

    setGroundShadeFromImage(image) {
        let context = terrainBigGeometry.getHeightmapCanvas()
        context.globalCompositeOperation = "copy";
    //    console.log(image)
        context.drawImage(image, 0, 0, context.canvas.width, context.canvas.height);
        shadeCompleted = true;
        terrainBigGeometry.updateHeightmapCanvasTexture()
    }

    saveGroundShadeTexture() {
        let context = terrainBigGeometry.getHeightmapCanvas()
        console.log("CTX: ", context.canvas)
   //     let png = context.canvas.toDataURL( 'image/png' );
   //     window.open(png);

        function download() {
            let link = document.createElement('a');
            let worldLevel =  GameAPI.getPlayer().getStatus(ENUMS.PlayerStatus.PLAYER_WORLD_LEVEL)
            link.download = 'heightmap_w01_'+worldLevel+'.png';
        //    link.download = 'ground_shade_tx.png';
            link.href = context.canvas.toDataURL( 'image/png' )
            link.click();
        }

        download();

    //    console.log("shade tx png:", [png]);
    }

    saveGroundDataTexture() {
        let context = terrainBigGeometry.getGroundCanvas()
        console.log("CTX: ", context.canvas)
        //     let png = context.canvas.toDataURL( 'image/png' );
        //     window.open(png);

        function download() {
            let link = document.createElement('a');
            let worldLevel =  GameAPI.getPlayer().getStatus(ENUMS.PlayerStatus.PLAYER_WORLD_LEVEL)
            link.download = 'terrainmap_w01_'+worldLevel+'.png';
            link.href = context.canvas.toDataURL( 'image/png' )
            link.click();
        }

        download();
    }

    fetchGroundShadeTexture(txCallback) {

        let imageLoader = new ImageLoader();

        let worldLevel =  GameAPI.getPlayer().getStatus(ENUMS.PlayerStatus.PLAYER_WORLD_LEVEL)
        let file = 'heightmap_w01_'+worldLevel+'.png';

        let url = './client/assets/images/textures/'+file
        let onLoad = function(img, data) {
            txCallback(img)
        }

        let onProgress = function(prog) {
            console.log('onProgress: ',prog)
        }

        let onError = function(err) {
            console.log('onError: ', err)
            txCallback(false)
        }

        imageLoader.load(url, onLoad, onProgress, onError)

    }
    buildGroundShadeTexture(progressCB) {
        shadeCompleted = false;
        let context = terrainBigGeometry.getHeightmapCanvas();
        context.globalCompositeOperation = 'multiply';
        context.fillStyle = 'rgb(255, 255, 0)';
    //    context.globalCompositeOperation = 'lighten';
    //    context.fillStyle = 'rgb(0, 0, 255)';
        context.fillRect(0, 0, 2048, 2048);

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

        let distance = MATH.distanceBetween(ThreeAPI.getCameraCursor().getLookAroundPoint(), ThreeAPI.getCamera().position)

        let tileRange = dynamicLodGrid.config['tile_range']
        let tileSize = dynamicLodGrid.config['tile_spacing']
        let tileFraction = MATH.calcFraction(0, tileSize, distance);

        let halfSize = dynamicLodGrid.maxDistance*(0.5 - 0.5/tileRange);
        lodCenter.set(0, 0, -1)
        lodCenter.applyQuaternion(ThreeAPI.getCamera().quaternion);
        lodCenter.y = 0;
        lodCenter.normalize();
        terrainCenter.copy(lodCenter);
        terrainCenter.multiplyScalar(distance*0.5);
        lodCenter.multiplyScalar(halfSize - tileSize*0.5)
       // lodCenter.x += tileSize*0.5;
      //  lodCenter.z += tileSize*0.5;
    //    terrainCenter.multiplyScalar(0.5);
        lodCenter.add(ThreeAPI.getCamera().position)
        terrainCenter.add(ThreeAPI.getCamera().position)
    //    lodCenter.subVectors(ThreeAPI.getCamera().position, ThreeAPI.getCameraCursor().getLookAroundPoint() );
    //    lodCenter.multiplyScalar(2.5)
    //    lodCenter.copy(ThreeAPI.getCamera().position);
        dynamicLodGrid.updateDynamicLodGrid(lodCenter, tileUpdateCB, 0, 1.5);
    //    terrainCenter.copy(ThreeAPI.getCameraCursor().getLookAroundPoint())
    //    CursorUtils.processTerrainLodCenter(lodCenter, terrainCenter)
        drawTilesByLodGrid(updateFrame)
    }

    getLodGrid() {
        return dynamicLodGrid;
    }
}

export {ThreeTerrain}