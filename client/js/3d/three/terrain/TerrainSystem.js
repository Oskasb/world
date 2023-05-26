import {ThreeTerrain} from "./ThreeTerrain.js";
import {TerrainArea} from "./TerrainArea.js";
import * as TerrainFunctions from "./TerrainFunctions.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";

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
        this.terrainAreas = [];
    };

    initTerrainSystem = function(callback) {
        threeTerrain.loadData(callback);

    };

    generateTerrainArea = function() {
        this.terrainAreas.push(new TerrainArea())
    };

    getTerrainHeightAndNormal = function(pos, normalStore) {
        return threeTerrain.call.getHeightAndNormal(pos, normalStore);
    };

    getTerrainAreaAtPos = function(pos) {

        for (let i = 0; i < this.terrainAreas.length; i++) {
            if (this.terrainAreas[i].positionIsWithin(pos)) {
                return this.terrainAreas[i];
            }
        }
    };


    activateTerrainSystem = function() {
        ThreeAPI.addPrerenderCallback(threeTerrain.updateTerrainGeometry)
    }

}

export {TerrainSystem}