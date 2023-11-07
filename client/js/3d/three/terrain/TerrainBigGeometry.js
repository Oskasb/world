import {PlaneGeometry} from "../../../../libs/three/geometries/PlaneGeometry.js";
import {Mesh} from "../../../../libs/three/objects/Mesh.js";
import {MeshBasicMaterial} from "../../../../libs/three/materials/MeshBasicMaterial.js";
import {DoubleSide} from "../../../../libs/three/constants.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";

let bigWorld = null;
let bigOcean = null;
let lodCenter = null;
let originalMat = null;

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

let terrainParams = {}

let groundInstances = [];
let oceanInstances = [];

let globalUpdateFrame = 0;
let setupHeightmapData = function(originalModelMat) {
    terrainMaterial = originalModelMat;
    let terrainmapTx = terrainMaterial.terrainmap;
    let terrainData = terrainmapTx.source.data;
    terrainWidth = terrainData.width;
    terrainHeight = terrainData.height;

    let terrainCanvas = document.createElement('canvas');
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

let centerSize = 100;
let lodLayers = 4;
let gridOffsets = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]

let updateBigGeo = function(tpf) {
    let posX = Math.floor(lodCenter.x)
    let posZ = Math.floor(lodCenter.z)
//    bigOcean.getSpatial().setPosXYZ(posX, -3.0, posZ);
    oceanInstances[0].getSpatial().setPosXYZ(posX, -3.0, posZ);
    groundInstances[0].getSpatial().setPosXYZ(posX, 0.0, posZ);
    let index = 1;
    for (let l = 0; l < lodLayers; l++) {
        let lodLayer = l;

        for (let i = 0; i < gridOffsets.length; i++) {
            let lodScale = lodLayer*lodLayer+1;
        //    let tileIndex = index+lodLayer*
            let ground = groundInstances[index]
            let ocean = oceanInstances[index]
            ocean.getSpatial().setPosXYZ(posX + centerSize*gridOffsets[i][0]*lodScale, -3.0, posZ + centerSize*gridOffsets[i][1]*lodScale);
            ground.getSpatial().setPosXYZ(posX + centerSize*gridOffsets[i][0]*lodScale, 0.0, posZ + centerSize*gridOffsets[i][1]*lodScale);

            ocean.setAttributev4('texelRowSelect',{x:1, y:1, z:lodScale, w:lodScale*2})
            ground.setAttributev4('texelRowSelect',{x:1, y:1, z:lodScale, w:lodScale*2})
            index++
        }
    }

    if (terrainUpdate) {
        terrainMaterial.heightmap.needsUpdate = true;
        heightmap = heightmapContext.getImageData(0, 0, width, height).data;
        terrainUpdate = false;
    }

}

let materialModel = function(model) {
    originalMat = model.originalModel.material.mat;
    setupHeightmapData(originalMat)
    bigWorld = model;
    console.log("big world model:", model)

}

let oceanModel = function(model) {
    oceanMaterial = model.originalModel.material.mat;
}

class TerrainBigGeometry {
    constructor() {
        this.call = {
            updateBigGeo:updateBigGeo
        }

    }


    getHeightmapData() {
        return heightmap;
    }

    getHeightmapCanvas() {
        return heightmapContext;
    }

    getGroundData() {
        if (groundUpdate) {
            //    terrainmap = terrainContext.getImageData(0, 0, terrainWidth, terrainHeight).data;
            groundUpdate = false;
        }
        return terrainmap;
    }

    updateGroundCanvasTexture() {
        //    console.log(terrainMaterial)
        terrainMaterial.uniforms.terrainmap.value = terrainMaterial.terrainmap;
        terrainMaterial.terrainmap.needsUpdate = true;
        terrainMaterial.uniforms.terrainmap.needsUpdate = true;
        terrainMaterial.uniformsNeedUpdate = true;
        terrainMaterial.needsUpdate = true;
        groundUpdate = true;
    }

    updateHeightmapCanvasTexture() {
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
        // gridMeshAssetId = dims['grid_mesh'];
        let txWidth = dims['tx_width'];
        let groundTxWidth = dims['ground_tx_width'];
        let mesh_segments = dims['mesh_segments'];
        let tiles = (txWidth / (mesh_segments+1));
        console.log("Constructs Big Terrain", txWidth, mesh_segments, tiles);

        let terrainOrigin = MATH.vec3FromArray(null, transform['pos']);

        let terrainScale = MATH.vec3FromArray(null, transform['scale']);

        let segmentScale = new Vector3();
        segmentScale.copy(terrainScale);
        segmentScale.multiplyScalar(1/tiles);
        segmentScale.y = terrainScale.y * 0.02;
        let geometrySize = segmentScale.x
        let vertsPerSegAxis = txWidth/tiles;

        terrainParams.tx_width = txWidth;
        terrainParams.groundTxWidth = groundTxWidth;
        terrainParams.tiles = tiles;

        let updateBigGeo = this.call.updateBigGeo;

        let groundCB = function(model) {
            if (groundInstances.length === 0) {
                materialModel(model)
                ThreeAPI.addPrerenderCallback(updateBigGeo)
            }
            groundInstances.push(model);
            model.setAttributev4('texelRowSelect',{x:1, y:1, z:1, w:1})
        }

        let oceanCB = function(model) {
            if (oceanInstances.length === 0) {
                oceanModel(model)
            }
            oceanInstances.push(model);
            client.dynamicMain.requestAssetInstance("asset_ground_big", groundCB)
        }

        client.dynamicMain.requestAssetInstance("asset_ocean_big", oceanCB)

        for (let i = 0; i < 8*lodLayers; i++) {
            client.dynamicMain.requestAssetInstance("asset_ocean_big", oceanCB)
        }

    }






}

export {TerrainBigGeometry}