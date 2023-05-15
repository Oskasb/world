import {TerrainArea} from "./TerrainArea.js";
import {TerrainFunctions} from "./TerrainFunctions.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";

let tempVec = new Vector3();

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
        this.terrainFunctions = new TerrainFunctions();
        this.terrainAreas = [];
    };

    initTerrainSystem = function() {};

    generateTerrainArea = function() {
        this.terrainAreas.push(new TerrainArea(this.terrainFunctions))
    };

    getTerrainHeightAndNormal = function(pos, normalStore) {

        for (let i = 0; i < this.terrainAreas.length; i++) {
            if (this.terrainAreas[i].positionIsWithin(pos)) {
                return this.terrainAreas[i].getHeightAndNormalForPos(pos, normalStore)
            }
        }
    };

    getTerrainAreaAtPos = function(pos) {

        for (let i = 0; i < this.terrainAreas.length; i++) {
            if (this.terrainAreas[i].positionIsWithin(pos)) {
                return this.terrainAreas[i];
            }
        }
    };

}

export {TerrainSystem}