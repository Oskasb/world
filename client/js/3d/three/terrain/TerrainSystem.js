import {ThreeTerrain} from "./ThreeTerrain.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {Ocean} from "../water/Ocean.js";

let tempVec = new Vector3();
let threeTerrain = new ThreeTerrain();

let scatter = 0;

let gridSpacing = 2000;
let gridWidth = 2;
let minX = 1000;
let minZ = 1000;
let spawnCount = 0;
let row = 0;
let col = 0;
let ocean = new Ocean();

let gridPosX = function() {
    row = MATH.moduloPositive(spawnCount, gridWidth);
    return minX + row*gridSpacing + Math.random()*scatter
};

let gridPosZ = function() {
    col = Math.floor(spawnCount / gridWidth);
    return minZ + col*gridSpacing+ Math.random()*scatter
};

class TerrainSystem {
    constructor() {

    };

    initTerrainSystem = function(callback) {
        threeTerrain.loadData(callback);

    };

    getTerrainHeightAndNormal = function(pos, normalStore) {
        return threeTerrain.call.getHeightAndNormal(pos, normalStore);
    };

    getTerrainGroundDataAtPos = function(pos, dataStore) {
        return threeTerrain.call.getTerrainData(pos, dataStore);
    }

    shadeTerrainGround = function(pos, size) {
        threeTerrain.call.shadeTerrainDataCanvas(pos, size);
    }

    activateTerrainSystem = function() {
        ThreeAPI.addPrerenderCallback(threeTerrain.updateThreeTerrainGeometry)
    }

}

export {TerrainSystem}