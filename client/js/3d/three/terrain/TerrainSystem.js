import {ThreeTerrain} from "./ThreeTerrain.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {Ocean} from "../water/Ocean.js";
import {VegetationSystem} from "./vegetation/VegetationSystem.js";

let tempVec = new Vector3();
let threeTerrain = new ThreeTerrain();
let vegetationSystem = new VegetationSystem();

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

let activateTerrainSystem = function() {
    ThreeAPI.addPrerenderCallback(threeTerrain.updateThreeTerrainGeometry)
    client.terrainReady();
}

class TerrainSystem {
    constructor() {
        this.sysReady = false;
        this.vegReady = false;
        this.plantsReady = false;
    };

    initTerrainSystem = function(callback) {
        threeTerrain.loadData(callback);
    };

    testReady = function() {
        if (this.sysReady) {
            console.log("Terrain data ready")
            activateTerrainSystem();
            vegetationSystem.activateVegetationSystem(threeTerrain.call.getLodCenter())
        }
    }

    getTerrainHeight() {
        return threeTerrain.call.getTerrainScale().y;
    }

    getTerrainHeightAndNormal = function(pos, normalStore, groundData) {
        return threeTerrain.call.getHeightAndNormal(pos, normalStore, groundData);
    };

    getTerrainGroundDataAtPos = function(pos, dataStore) {
        return threeTerrain.call.getTerrainData(pos, dataStore);
    }

    shadeTerrainGround = function(pos, size, channelIndex, operation, intensity) {
        threeTerrain.call.shadeTerrainDataCanvas(pos, size, channelIndex, operation, intensity);
    }

    registerLodUpdateCB = function(pos, callback) {
        threeTerrain.call.subscribeToLodUpdate(pos, callback);
    }

    clearLodUpdates = function(callback) {
        threeTerrain.call.removeLodUpdateCB(callback);
    }

    rebuildGround() {
        vegetationSystem.processGroundDataUpdate()
    }

}

export {TerrainSystem}