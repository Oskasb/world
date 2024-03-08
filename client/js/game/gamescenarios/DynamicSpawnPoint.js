import {Object3D} from "../../../libs/three/core/Object3D.js";
import {Vector3} from "../../../libs/three/math/Vector3.js";
import {VisualModelPalette} from "../visuals/VisualModelPalette.js";
import {paletteMap} from "../visuals/Colors.js";
import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";
import {WorldEncounter} from "../encounter/WorldEncounter.js";

let worldSize = 2048;
let tempNormal = new Vector3()
let tempVec = new Vector3()

let paletteKeys = [];
for (let key in paletteMap) {
    paletteKeys.push(key);
}

let aroundTests = 8;
function checkAroundPoint(sPoint) {
    for (let i = 0; i < aroundTests; i++) {
        let dir = MATH.calcFraction(0, aroundTests, i)*MATH.TWO_PI;
        tempVec.x = Math.sin(dir)*1.5;
        tempVec.z = Math.cos(dir)*1.5;
        tempVec.add(sPoint.getPos());
        let y = ThreeAPI.terrainAt(tempVec);
        if (Math.abs(y - sPoint.getPos().y) > 1) {
            return false;
        }
    }
    return true;
}

function findSpawnPosition(sPoint) {
    sPoint.obj3d.position.x = Math.floor(worldSize*(MATH.sillyRandom(sPoint.index + sPoint.retries*0.0011 + sPoint.worldLevel)-0.5));
    sPoint.obj3d.position.z = Math.floor(worldSize*(MATH.sillyRandom(sPoint.index + sPoint.retries*0.0013 + sPoint.worldLevel + 1)-0.5));
    let y = ThreeAPI.terrainAt(sPoint.obj3d.position, tempNormal, sPoint.groundHeightData);

    if (y > 0.5 && y < sPoint.yMax) {

        if (tempNormal.y > 0.8) {
            sPoint.obj3d.position.y = y;
            let okAround = checkAroundPoint(sPoint)
            if (okAround) {

                sPoint.activateSpawnPoint()
                return;
            }

        }
    }
    sPoint.retries++;
    retry(sPoint);
}

function retry(sPoint) {
    if (Math.random() < 0.1) {
        setTimeout(function() {
            console.log("retries", sPoint.retries);
            findSpawnPosition(sPoint);
        }, 100);
    } else {
        findSpawnPosition(sPoint);
    }

}

class DynamicSpawnPoint {
    constructor() {
        this.obj3d = new Object3D();
        this.obj3d.scale.multiplyScalar(0.01);
        this.retries = 0;
        this.groundHeightData = [0, 0, 0, 0];
        this.terrainData = {};
        let isVisible = false;
        let lodLevel = -1;
        let instance = null;
        let encounterConfig = null;

        let palette = new VisualModelPalette()

        let update = function() {

            this.obj3d.rotateY(GameAPI.getFrame().avgTpf);
            if (instance) {
                instance.spatial.obj3d.copy(this.obj3d);
                instance.spatial.obj3d.position.y += 2;
                instance.spatial.stickToObj3D(instance.spatial.obj3d);
            }
        }.bind(this)

        let addInstance = function(ins) {
            if (isVisible === false) {
                ins.decommissionInstancedModel();
            } else {
                instance = ins;

                let selection = MATH.getRandomArrayEntry(paletteKeys);
                palette.applyPaletteSelection(selection, instance)
                instance.call.viewObstructing(false)
            }

        }

        let activateVisible = function() {
            if (isVisible === false) {
                isVisible = true;
                GameAPI.registerGameUpdateCallback(update)
                client.dynamicMain.requestAssetInstance('asset_indicator_spawn', addInstance)
            }
        }

        let deactivateVisible = function() {
            if (isVisible === true) {
                isVisible = false;
                if (instance !== null) {
                    instance.decommissionInstancedModel();
                }

                instance = null;
                GameAPI.unregisterGameUpdateCallback(update)
            }
        }

        let onReady = function(encounter) {
            encounter.activateWorldEncounter()
            console.log("wEnc ready", encounter);
        }

        let proceduralEncounter = null;

        let lodUpdated = function(lodL) {
            lodLevel = lodL;

            if (lodLevel === 0) {
                if (encounterConfig === null) {
                    encounterConfig = poolFetch('ProceduralEncouterConfig');
                    encounterConfig.generateConfig(this.obj3d.position, this.groundHeightData, this.terrainData)
                    let worldEncounters = GameAPI.worldModels.getEncounterById()
                    proceduralEncounter = new WorldEncounter("proc_enc_"+this.index, encounterConfig.config, onReady)
                    worldEncounters.push(proceduralEncounter);
                }
                deactivateVisible();

            } else {

                if (lodLevel > -1 && lodLevel < 4) {
                    activateVisible()
                } else {
                    deactivateVisible()
                }

                if (encounterConfig !== null) {
                    poolReturn(encounterConfig);
                    encounterConfig = null;
                    if (proceduralEncounter) {
                        let worldEncounters = GameAPI.worldModels.getEncounterById()
                        MATH.splice(worldEncounters, proceduralEncounter);
                        proceduralEncounter.deactivateWorldEncounter();
                    }
                }
            }

        }.bind(this)

        let getLodLevel = function() {
            return lodLevel;
        }

        this.call = {
            getLodLevel:getLodLevel,
            lodUpdated:lodUpdated
        }

    }


    initDynamicSpawnPoint(index, maxPoints, worldLevel, yMax, lvlMin, lvlMax) {
        this.isActive = false;
        this.retries = 0;
        this.index = index;
        this.maxPoints = maxPoints;
        this.worldLevel = worldLevel;
        this.yMax = yMax;
        findSpawnPosition(this);
    }

    getPos() {
        return this.obj3d.position;
    }

    activateSpawnPoint() {
        this.isActive = true;
        ThreeAPI.registerTerrainLodUpdateCallback(this.getPos(), this.call.lodUpdated);
        ThreeAPI.groundAt(this.getPos(), this.terrainData)
    }

    deactivateSpawnPoint() {
        this.isActive = false;
        this.call.lodUpdated(-1);
        ThreeAPI.clearTerrainLodUpdateCallback(this.call.lodUpdated)
    }

}

export {DynamicSpawnPoint}