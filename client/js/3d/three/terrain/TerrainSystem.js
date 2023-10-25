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
    ThreeAPI.addPostrenderCallback(threeTerrain.updateThreeTerrainGeometry)
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

    getTerrain() {
        return threeTerrain;
    }

    testReady = function() {
        if (this.sysReady) {

            let shadeCompleted = function() {
                activateTerrainSystem();
                vegetationSystem.activateVegetationSystem(threeTerrain.call.getLodCenter())

                setTimeout(function() {
                    evt.dispatch(ENUMS.Event.NOTIFY_LOAD_COMPLETED, {})
                }, 500)
            }

            let shadeProgCB = function(prog) {

                if (prog.remaining === 0) {
                    evt.dispatch(ENUMS.Event.NOTIFY_LOAD_PROGRESS, prog)
                    threeTerrain.saveGroundShadeTexture();
                    console.log("Terrain Ground Shade Done")
                    shadeCompleted();
                } else if (prog.done % 20 === 0) {
                    evt.dispatch(ENUMS.Event.NOTIFY_LOAD_PROGRESS, prog)
                    //console.log(prog.progress)
                }
            }


            let txCallback = function(image) {
                if (image) {
                    evt.dispatch(ENUMS.Event.NOTIFY_LOAD_PROGRESS, {msg:"Ground Shade Loaded"})
                    threeTerrain.setGroundShadeFromImage(image);
                    shadeCompleted();
                } else {
                    evt.dispatch(ENUMS.Event.NOTIFY_LOAD_PROGRESS, {msg:"Generate Ground Shade"})
                    threeTerrain.buildGroundShadeTexture(shadeProgCB);
                }
            }

            threeTerrain.fetchGroundShadeTexture(txCallback)



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