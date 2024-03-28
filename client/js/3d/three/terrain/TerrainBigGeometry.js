import {PlaneGeometry} from "../../../../libs/three/geometries/PlaneGeometry.js";
import {Mesh} from "../../../../libs/three/objects/Mesh.js";
import {MeshBasicMaterial} from "../../../../libs/three/materials/MeshBasicMaterial.js";
import {DoubleSide} from "../../../../libs/three/constants.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {borrowBox, cubeTestVisibility, aaBoxTestVisibility} from "../../../application/utils/ModelUtils.js";
import {getPhysicalWorld} from "../../../application/utils/PhysicsUtils.js";
import {applyGroundCanvasEdit} from "./TerrainFunctions.js";
import {loadSavedBuffer, saveDataTexture} from "../../../application/utils/ConfigUtils.js";
import {ENUMS} from "../../../application/ENUMS.js";

let bigWorld = null;
let bigOcean = null;
let lodCenter = null;
let originalMat = null;

let terrainAmmoBody = null;

let groundUpdate = false;
let terrainMaterial = null;
let oceanMaterial = null
let heightmap = null;
let terrainmap = null;
let heightGrid = [];
let width = null;
let height = null;
let terrainWidth = null;
let terrainHeight = null;
let maxLodLevel = 6;
let terrainContext = null;
let heightmapContext = null;
let terrainUpdate = false;
let terrainConfig = null;

let terrainParams = {}
let terrainCanvas;
let groundInstances = [];
let oceanInstances = [];

let globalUpdateFrame = 0;

let groundUpdateRect = {}
let heightUpdateRect = {}

let worldLevels = {}

let setupHeightmapData = function(originalModelMat) {
    terrainMaterial = originalModelMat;
    let terrainmapTx = terrainMaterial.terrainmap;
    let terrainData = terrainmapTx.source.data;
    terrainWidth = terrainData.width;
    terrainHeight = terrainData.height;

    terrainCanvas = document.createElement('canvas');
    terrainContext = terrainCanvas.getContext('2d',  { willReadFrequently: true })
    terrainContext.getContextAttributes().willReadFrequently = true;
//    console.log(terrainContext, terrainContext.getContextAttributes())
    terrainCanvas.width = terrainWidth;
    terrainCanvas.height = terrainHeight;
    terrainContext.drawImage(terrainData, 0, 0, terrainWidth, terrainHeight);
//    terrainContext.fillStyle = "rgb(255, 0, 0)";
    terrainContext.globalCompositeOperation = "lighter";
//    terrainContext.fillRect(0, 0, terrainWidth, terrainHeight);

    terrainmap = terrainContext.getImageData(0, 0, terrainWidth, terrainHeight).data;

    let terrainMapCanvasTx = new THREE.CanvasTexture(terrainCanvas)
    terrainMapCanvasTx.generateMipmaps = false;
    terrainMapCanvasTx.flipY = false;
    terrainMaterial.terrainmap = terrainMapCanvasTx;
    terrainMaterial.uniforms.terrainmap.value = terrainMapCanvasTx;

    let heightmapTx = terrainMaterial.heightmap;
    let imgData = heightmapTx.source.data
    width = imgData.width;
    height = imgData.height;
//    console.log(terrainMaterial, heightmapTx, heightmapTx.source.data, imgData , this);

    let heightCanvas = document.createElement('canvas');
    heightmapContext = heightCanvas.getContext('2d', { willReadFrequently: true } )

    heightCanvas.width = width;
    heightCanvas.height = height;

    heightmapContext.drawImage(imgData, 0, 0, width, height);

    heightmap = heightmapContext.getImageData(0, 0, width, height).data;


    let heightMapCanvasTx = new THREE.CanvasTexture(heightCanvas)
    heightMapCanvasTx.generateMipmaps = false;
    heightMapCanvasTx.flipY = false;
    terrainMaterial.heightmap = heightMapCanvasTx;
    terrainMaterial.uniforms.heightmap.value = heightMapCanvasTx;
    terrainMaterial.heightmap.needsUpdate = true;
    terrainMaterial.uniforms.needsUpdate = true;
    terrainMaterial.uniformsNeedUpdate = true;
    terrainMaterial.needsUpdate = true;
    //  heightMapCanvasTx.fillStyle = createGradient(canvasContext, size, tx+0, tz+0);
    heightmapContext.fillStyle = "rgba(255, 255, 0, 1)";
    heightmapContext.globalCompositeOperation = "darken";
    heightmapContext.fillRect(0, 0, 2048, 2048);

//    heightmapContext.fillStyle = "rgba(9, 0, 0, 1)";
    heightmapContext.globalCompositeOperation = "lighter";
//    heightmapContext.fillRect(0, 0, 2048, 2048);

    terrainMaterial.uniforms.heightmaptiles.value.x = 1;
    terrainMaterial.uniforms.heightmaptiles.value.y = 1;
    terrainMaterial.uniforms.heightmaptiles.value.z = 2048;
    terrainMaterial.needsUpdate = true;


    oceanMaterial.heightmap = heightMapCanvasTx;
    oceanMaterial.uniforms.heightmap.value = heightMapCanvasTx;
    oceanMaterial.heightmap.needsUpdate = true;
    oceanMaterial.uniforms.needsUpdate = true;
    oceanMaterial.uniformsNeedUpdate = true;
    oceanMaterial.needsUpdate = true;

    oceanMaterial.uniforms.heightmaptiles.value.x = 1;
    oceanMaterial.uniforms.heightmaptiles.value.y = 1;
    oceanMaterial.uniforms.heightmaptiles.value.z = 2048;
    oceanMaterial.needsUpdate = true;

    registerWorldLevel("20");
    addWorldLevelMaterial("20", terrainMaterial)
    MATH.clearUpdateRect(groundUpdateRect);
    MATH.clearUpdateRect(heightUpdateRect);
    /*
        setTimeout(function() {
            terrainmap = terrainContext.getImageData(0, 0, terrainWidth, terrainHeight).data;
            console.log(terrainmap)
        }, 3000)
    */
    //  console.log(terrainMaterial, [heightmap], [terrainmap])
}


let bigWorldOuter = null;

//  bigWorldOuter.setAttributev4('texelRowSelect',{x:1, y:1, z:groundInstances.length, w:groundInstances.length*2})

let centerSize = 50;
let lodLayers = 5;
let oceanLayers = 5;
let gridOffsets = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]
let layerScale = [1, 3, 9, 27, 81, 243]
let tempPoint = new Vector3();

let activeGround = [];
let activeOcean = [];
let availableGround = [];
let availableOcean = [];


let rgbaR = [];

function setupAmmoTerrainBody(canvasData, config) {
 //   console.log("Setup Terrain Body", [canvasData], config)
    if (terrainAmmoBody !== null) {
        AmmoAPI.excludeBody(terrainAmmoBody);
        terrainAmmoBody = null;
    }

    for (let i = 0; i < canvasData.length / 4; i++) {
        let txR = i*4;
        rgbaR[i] = (canvasData[txR]+1) * (100/256);
    }

    let heightfieldData = new Float32Array( rgbaR );

    let w = config.dimensions['tx_width'];

    terrainAmmoBody = AmmoAPI.buildPhysicalTerrain(rgbaR, w, 0, 0, -3, 97);
    getPhysicalWorld().registerTerrainBody(terrainAmmoBody)

}

let addGroundSection = function(lodScale, x, z, index) {

    if (activeGround[index]) {
        console.log("Old not removed!")
        return;
    }

    let groundCB = function(ground) {
        activeGround[index] = ground;
        positionSectionInstance(ground, lodScale, x, 0.0, z);
    }

    client.dynamicMain.requestAssetInstance("asset_ground_big", groundCB)

}

let addOceanSection = function(lodScale, x, z, index) {

    if (activeOcean[index]) {
        console.log("Old not removed!")
        return;
    }

    let oceanCB = function(ocean) {
        activeOcean[index] = ocean;
        positionSectionInstance(ocean, lodScale, x, -3.0, z);
    }

    client.dynamicMain.requestAssetInstance("asset_ocean_big", oceanCB)

}

let attachSection = function(lodScale, x, z, index) {

    if (availableGround.length === 0) {
        addGroundSection(lodScale, x, z, index)
    } else {
        let ground = availableGround.pop();
        activeGround[index] = ground;
        positionSectionInstance(ground, lodScale, x, 0.0, z);
    }
/*
    if (availableOcean.length === 0) {
        addOceanSection(lodScale, x, z, index)
    } else {
        let ocean = availableOcean.pop();
        activeOcean[index] = ocean;
        positionSectionInstance(ocean, lodScale, x, -3.0, z);
    }
*/
}

let positionSectionInstance = function(instance, lodScale, x, y, z) {
    instance.getSpatial().setPosXYZ(x, y, z);
    instance.setAttributev4('texelRowSelect',{x:1, y:1, z:lodScale, w:lodScale})
}

let detachSection = function(index) {
//    availableGround.push(activeGround[index])
//    availableOcean.push(activeOcean[index])
    activeGround[index].decommissionInstancedModel()
  //  activeOcean[index].decommissionInstancedModel()

    positionSectionInstance(activeGround[index], 0, 9880, 4 + 2*index, 530)
  //  positionSectionInstance(activeOcean[index],  0, 9890, 4 + 2*index, 530)
    activeGround[index] = null;
  //  activeOcean[index] = null;
}

let uploadSlices = 64;

function sliceLoaded(sliceId, sliceInfo, data) {
    console.log("Slice Loaded", sliceInfo, data);
    let pixelsPerSliceX = 2048/uploadSlices;
    let pixelsPerSliceY = 2048/uploadSlices
    heightmapContext.globalCompositeOperation = 'source-over';
    let iData = new ImageData(data, pixelsPerSliceX, pixelsPerSliceY);
    heightmapContext.putImageData(iData, sliceInfo.x, sliceInfo.y);

    heightUpdateRect.minX = sliceInfo.x;
    heightUpdateRect.minY = sliceInfo.y;
    heightUpdateRect.maxX = sliceInfo.x+pixelsPerSliceX;
    heightUpdateRect.maxY = sliceInfo.y+pixelsPerSliceY;
    ThreeAPI.canvasTextureSubUpdate(terrainMaterial.heightmap, heightmapContext, heightUpdateRect)
}

function setupBufferListeners() {
    let pixelsPerSliceX = 2048/uploadSlices;
    let pixelsPerSliceY = 2048/uploadSlices;
  //  for (let l = 0; l < 20; l++) {
    let l = 20;
        for (let i = 0; i < uploadSlices; i++) {
            for (let j = 0; j < uploadSlices; j++) {
                let xMin = pixelsPerSliceX*i;
                let yMin = pixelsPerSliceY*j;
                let sliceId = "height_"+l+"_"+xMin+"_"+yMin;
                let callback = function(data) {
                    let sliceInfo = {
                        sliceId:sliceId,
                        wl:l,
                        x:xMin,
                        y:yMin
                    }
                    sliceLoaded(sliceId, sliceInfo, data)
                }
                loadSavedBuffer(sliceId, callback)
            }
        }
  //  }
}

function uploadUpdateRect(updateRect, ctx, maxWidth, maxHeight) {
    let pixelsPerSliceX = maxWidth/uploadSlices;
    let pixelsPerSliceY = maxHeight/uploadSlices;
    let sliceXmin = Math.floor(updateRect.minX/pixelsPerSliceX)
    let slixeXMax = Math.ceil(updateRect.maxX/pixelsPerSliceX)
    let sliceYmin = Math.floor(updateRect.minY/pixelsPerSliceY)
    let slixeYMax = Math.ceil(updateRect.maxY/pixelsPerSliceY)
    let totalX = slixeXMax-sliceXmin;
    let totalY = slixeYMax-sliceYmin;
    let worldLevel = GameAPI.getPlayer().getStatus(ENUMS.PlayerStatus.PLAYER_WORLD_LEVEL)
    console.log("uploadUpdateRect", totalX, totalY, pixelsPerSliceX, pixelsPerSliceY, sliceXmin, sliceYmin)
    for (let i = 0; i < totalX; i++) {
        for (let j = 0; j < totalY; j++) {
            let xMin = sliceXmin*pixelsPerSliceX + pixelsPerSliceX*i;
            let yMin = sliceYmin*pixelsPerSliceY + pixelsPerSliceY*j;
            let subImage = ctx.getImageData(xMin, yMin, pixelsPerSliceX, pixelsPerSliceY).data;
            console.log("uploadUpdateRect", xMin, yMin, subImage)
            saveDataTexture("images", "height", "height_"+worldLevel+"_"+xMin+"_"+yMin, subImage);
        }
    }

//
}

let physicsUpdateTimeout;
let visibilityList = [];
let visibleCount = 0;
let updateBigGeo = function(tpf) {
    let camY = ThreeAPI.getCamera().position.y;
    let posX = Math.floor(lodCenter.x)
    let posZ = Math.floor(lodCenter.z)
//    bigOcean.getSpatial().setPosXYZ(posX, -3.0, posZ);
  //  oceanInstances[0].getSpatial().setPosXYZ(posX, -3.0, posZ);
  //  oceanInstances[1].getSpatial().setPosXYZ(posX, -3.0, posZ);
    for (let i = 0; i < oceanInstances.length; i++) {
        if (i === 1) {
            oceanInstances[i].getSpatial().setPosXYZ(posX, 0.0, posZ);
        }

    }


    groundInstances[0].getSpatial().setPosXYZ(posX, 0.0, posZ);
    let index = 1;
    visibleCount = 0;

    let elevAdjustedLayers = lodLayers // Math.clamp(1 + Math.floor(MATH.curveSqrt(camY*0.25) / 4), 1, lodLayers)

    for (let l = 0; l < elevAdjustedLayers; l++) {
        let lodLayer = l;

        for (let i = 0; i < gridOffsets.length; i++) {
            let lodScale = layerScale[lodLayer]
        //    let tileIndex = index+lodLayer*

            tempPoint.set(posX + centerSize*gridOffsets[i][0]*lodScale, 0.0, posZ + centerSize*gridOffsets[i][1]*lodScale)
        //    let visible = ThreeAPI.testPosIsVisible(tempPoint);

            let visible = aaBoxTestVisibility(tempPoint, centerSize*lodScale, 100, centerSize*lodScale)
            let borrowedBox = borrowBox();


            if (!visible) {
                if (visibilityList[index] === true) {
                    detachSection(index);
                    visibilityList[index] = false
                }
            //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:lodCenter, to:tempPoint, color:'RED'});
            //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, {min:borrowedBox.min, max:borrowedBox.max, color:'RED'})
            } else {
            //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, {min:borrowedBox.min, max:borrowedBox.max, color:'CYAN'})
            //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:lodCenter, to:tempPoint, color:'GREEN'});
                visibleCount++
                if (visibilityList[index] !== true) {
                    attachSection(lodScale, tempPoint.x, tempPoint.z, index)
                    visibilityList[index] = true;
                } else {
                    positionSectionInstance(activeGround[index], lodScale, tempPoint.x, 0.0, tempPoint.z);
                //    positionSectionInstance(activeOcean[index], lodScale, tempPoint.x, -3.0, tempPoint.z);
                }
            }

            index++
        }
    }

    if (terrainUpdate) {

        if (heightUpdateRect.maxX !== 0) {
            ThreeAPI.canvasTextureSubUpdate(terrainMaterial.heightmap, heightmapContext, heightUpdateRect)
            uploadUpdateRect(heightUpdateRect, heightmapContext, width, height)
            MATH.clearUpdateRect(heightUpdateRect);
        } else {
            terrainMaterial.heightmap.needsUpdate = true;
        }
        heightmap = heightmapContext.getImageData(0, 0, width, height).data;


        terrainUpdate = false;
        clearTimeout(physicsUpdateTimeout);
        physicsUpdateTimeout = setTimeout(function() {
            setupAmmoTerrainBody(heightmap, terrainConfig)
        }, 400)
    }

}

let materialModel = function(model) {
    originalMat = model.originalModel.material.mat;
    setupHeightmapData(originalMat)
    bigWorld = model;
 //   console.log("big world model:", model)

}

let oceanModel = function(model) {
    oceanMaterial = model.originalModel.material.mat;
}

function registerWorldLevel(worldLevel) {
    if (!worldLevels[worldLevel]) {
        worldLevels[worldLevel] = {
            heightCanvas : document.createElement('canvas'),
            terrainCanvas : document.createElement('canvas'),
        };

        worldLevels[worldLevel].heightCanvas.width = width
        worldLevels[worldLevel].heightCanvas.height = height
        worldLevels[worldLevel].terrainCanvas.width = terrainCanvas.width
        worldLevels[worldLevel].terrainCanvas.height = terrainCanvas.height
        worldLevels[worldLevel].heightCtx = worldLevels[worldLevel].heightCanvas.getContext('2d')
        worldLevels[worldLevel].terrainCtx = worldLevels[worldLevel].terrainCanvas.getContext('2d')
    }
}

function fillContextWithImage(ctx, imgData) {
    let width = imgData.width;
    let height = imgData.height;
    ctx.globalCompositeOperation = "source-over"
    ctx.drawImage(imgData, 0, 0, width, height);
}

function addWorldLevelMaterial(worldLevel, material) {
  //  console.log("addWorldLevelMaterial", material)
    let wLevel = worldLevels[worldLevel];
    let heightCtx = wLevel.heightCtx;
    let terrainCtx = wLevel.terrainCtx;

    let newHeightmap = material.heightmap;
    let newTerrainMap = material.terrainmap;

    let heightImageData = newHeightmap.source.data; // source.data is a canvas
    let terrainImageData = newTerrainMap.source.data;
    fillContextWithImage(heightCtx, heightImageData);
    fillContextWithImage(terrainCtx, terrainImageData);
}

function setHeightDataImage(imgData, worldLevel) {
    fillContextWithImage(heightmapContext, imgData)
}

function setTerrainDataImage(imgData, worldLevel) {
    fillContextWithImage(terrainContext, imgData)
}

let groundUpdateTimeout = null;

setupBufferListeners();

class TerrainBigGeometry {
    constructor() {

        this.call = {
            updateBigGeo:updateBigGeo
        }
    }


    applyGroundMaterial(material, worldLevel) {

        if (!worldLevels[worldLevel]) {
            registerWorldLevel(worldLevel)
            addWorldLevelMaterial(worldLevel, material);
            console.log("WorldLevels ", worldLevels);
        }

        let wLevel = worldLevels[worldLevel];
    //    let newHeightmap = material.heightmap;
    //    let newTerrainMap = material.terrainmap;

        let heightImageData = wLevel.heightCanvas;
        let terrainImageData = wLevel.terrainCanvas;
        setHeightDataImage(heightImageData);
        setTerrainDataImage(terrainImageData);
        console.log("applyGroundMaterial", [terrainMaterial, worldLevel, worldLevels]);

        this.updateGroundCanvasTexture()
        this.updateHeightmapCanvasTexture()
        updateBigGeo(0.01);
    }

    getVisibleCount() {
        return visibleCount;
    }

    getHeightmapData() {
        return heightmap;
    }

    getGroundCanvas() {
        return terrainContext;
    }

    getHeightmapCanvas() {
        return heightmapContext;
    }



    getGroundData() {
        if (groundUpdate) {
            terrainmap = terrainContext.getImageData(0, 0, terrainWidth, terrainHeight).data;
            groundUpdate = false;
        }
        return terrainmap;
    }

    updateGroundCanvasTexture(updateRect) {

        if (typeof (updateRect) === 'object') {
            ThreeAPI.canvasTextureSubUpdate(terrainMaterial.terrainmap, terrainContext, updateRect);
        } else {
            terrainMaterial.uniforms.terrainmap.value = terrainMaterial.terrainmap;
            terrainMaterial.terrainmap.needsUpdate = true;
            terrainMaterial.uniforms.terrainmap.needsUpdate = true;
            terrainMaterial.uniformsNeedUpdate = true;
            terrainMaterial.needsUpdate = true;
        }
        clearTimeout(groundUpdateTimeout);
        groundUpdateTimeout = setTimeout(function() {
            groundUpdate = true;
        }, 10);
    }

    getTerrainMaterial() {
        return terrainMaterial;
    }


    updateHeightmapCanvasTexture(updateRect) {

        if (typeof (updateRect) === 'object') {
            if (typeof (updateRect) === 'object') {
                MATH.fitUpdateRect(updateRect, heightUpdateRect);
            }
        }

        //    if (MATH.isEvenNumber(GameAPI.getFrame().frame * 0.25)) {
        terrainUpdate = true;
        //    }
    }


    getTerrainParams() {
        return terrainParams;
    }

    initBigTerrainGeometry(lodC, heightMapData, transform) {
    //    return;
        // "asset_big_loader"
        lodCenter = lodC;
        let dims = heightMapData['dimensions'];
        terrainConfig = heightMapData;
        // gridMeshAssetId = dims['grid_mesh'];
        let txWidth = dims['tx_width'];
        let groundTxWidth = dims['ground_tx_width'];
        let mesh_segments = dims['mesh_segments'];
        lodLayers = dims['lod_layers'] || 2;
   //     console.log("Constructs Big Terrain", txWidth, mesh_segments);


        terrainParams.tx_width = txWidth;
        terrainParams.groundTxWidth = groundTxWidth;
        terrainParams.minHeight = dims.min_height;
        terrainParams.maxHeight = dims.max_height;
    //    terrainParams.tiles = tiles;

        let updateBigGeo = this.call.updateBigGeo;

        let groundCB = function(model) {
            if (groundInstances.length === 0) {
                materialModel(model)
                ThreeAPI.addPrerenderCallback(updateBigGeo)
                model.setAttributev4('texelRowSelect',{x:1, y:1, z:1, w:1})
            }
            groundInstances.push(model);

        }


        let oceanOuterCB = function(model)  {
            model.setAttributev4('texelRowSelect',{x:1, y:1, z:1, w:1})
            oceanInstances.push(model);
        }

        let oceanCB = function(model) {
            if (oceanInstances.length === 0) {
                oceanModel(model)
                model.setAttributev4('texelRowSelect',{x:1, y:1, z:1, w:1})
            }
            oceanInstances.push(model);
            client.dynamicMain.requestAssetInstance("asset_ocean_big_outer", oceanOuterCB)
            client.dynamicMain.requestAssetInstance("asset_ground_big", groundCB)
        }

        client.dynamicMain.requestAssetInstance("asset_ocean_big", oceanCB)

    }






}

export {TerrainBigGeometry}