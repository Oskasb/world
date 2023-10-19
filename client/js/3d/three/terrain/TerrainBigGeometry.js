import {PlaneGeometry} from "../../../../libs/three/geometries/PlaneGeometry.js";
import {Mesh} from "../../../../libs/three/objects/Mesh.js";
import {MeshBasicMaterial} from "../../../../libs/three/materials/MeshBasicMaterial.js";
import {DoubleSide} from "../../../../libs/three/constants.js";

let bigWorld = null;
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

    /*
        setTimeout(function() {
            terrainmap = terrainContext.getImageData(0, 0, terrainWidth, terrainHeight).data;
            console.log(terrainmap)
        }, 3000)
    */
    //  console.log(terrainMaterial, [heightmap], [terrainmap])
}

let updateBigGeo = function(tpf) {
    bigWorld.getSpatial().setPosXYZ(Math.floor(lodCenter.x), 0.0, Math.floor(lodCenter.z));
}

let materialModel = function(model) {
    originalMat = model.originalModel.material.mat
    setupHeightmapData(originalMat)
    bigWorld = model;
    console.log("materialModel", originalMat)
/*
    let plane = new PlaneGeometry(256, 256, 256, 256)

    bigWorld = new Mesh(plane, new MeshBasicMaterial());
    bigWorld.rotateX(MATH.HALF_PI);
    //    bigWorld.scale.multiplyScalar(this.tx_width);
    bigWorld.material.opacity = 0.4;
    bigWorld.material.side = DoubleSide;
    bigWorld.material.transparent = true;
    bigWorld.material.depthTest = false;
    bigWorld.material.depthWrite = false;
    ThreeAPI.addToScene(bigWorld)

 */
}

class TerrainBigGeometry {
    constructor() {
        this.call = {
            updateBigGeo:updateBigGeo
        }

    }



    initBigTerrainGeometry(lodC) {
    //    return;
        // "asset_big_loader"

        client.dynamicMain.requestAssetInstance("asset_grid_256", materialModel)

        lodCenter = lodC;

        ThreeAPI.addPrerenderCallback(this.call.updateBigGeo)
    }






}

export {TerrainBigGeometry}