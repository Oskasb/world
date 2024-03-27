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

let aroundTests = 4;
function checkAroundPoint(sPoint) {
    for (let i = 0; i < aroundTests; i++) {
        let dir = MATH.calcFraction(0, aroundTests, i)*MATH.TWO_PI;
        tempVec.x = Math.sin(dir)*1.0;
        tempVec.z = Math.cos(dir)*1.0;
        tempVec.add(sPoint.getPos());
        let y = ThreeAPI.terrainAt(tempVec);
        if (Math.abs(y - sPoint.getPos().y) > 1) {
            return false;
        }
    }
    return true;
}

function findSpawnPosition(sPoint) {
    let fraction = sPoint.index / sPoint.maxPoints;
    sPoint.obj3d.position.x = Math.floor(worldSize*(MATH.sillyRandom(sPoint.index + sPoint.retries + sPoint.worldLevel + fraction)-0.5));
    sPoint.obj3d.position.z = Math.floor(worldSize*(MATH.sillyRandom(sPoint.index + sPoint.retries + sPoint.worldLevel + 1 + fraction)-0.5));
    let y = ThreeAPI.terrainAt(sPoint.obj3d.position, tempNormal, sPoint.groundHeightData);
    if (sPoint.groundHeightData[1] > 0.01) {
        if (y > 0.5 && y < sPoint.yMax) {

            if (tempNormal.y > 0.8) {
                sPoint.obj3d.position.y = y;
                let okAround = checkAroundPoint(sPoint)
                if (okAround) {
                    let diffFactor = MATH.calcFraction(0.01, 1, sPoint.groundHeightData[1]);
                    let diffSpan = sPoint.lvlMax - sPoint.lvlMin;
                    let encLevel = sPoint.lvlMin + Math.round(diffSpan*diffFactor);
                    sPoint.encounterLevel = encLevel;
                    ThreeAPI.groundAt(sPoint.getPos(), sPoint.terrainData)
                    sPoint.activateSpawnPoint()
                    return;
                }

            }
        }
    }

    sPoint.retries++;
    retry(sPoint);
}

function retry(sPoint) {
    if (Math.random() < 0.1) {
        setTimeout(function() {
        //    console.log("retries", sPoint.retries);
            findSpawnPosition(sPoint);
        }, 1);
    } else {
        findSpawnPosition(sPoint);
    }

}

class DynamicSpawnPoint {
    constructor() {
        this.id = null;
        this.obj3d = new Object3D();
        this.obj3d.scale.multiplyScalar(0.01);
        this.retries = 0;
        this.groundHeightData = [0, 0, 0, 0];
        this.terrainData = {};
        this.encounterLevel = 1;
        this.lodActive = false;
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

        let clearEncounter = function() {
            if (encounterConfig !== null) {
                poolReturn(encounterConfig);
                encounterConfig = null;
            }

            if (proceduralEncounter) {
                let worldEncounters = GameAPI.worldModels.getEncounterById()
                MATH.splice(worldEncounters, proceduralEncounter);
                proceduralEncounter.deactivateWorldEncounter();
            }
        }

        let deactivate = function() {
            if (this.isActive === false) {
                return;
            }
            this.isActive = false;
            this.lodActive = false
            ThreeAPI.clearTerrainLodUpdateCallback(lodUpdated);
            clearEncounter()

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
            encounter.getHostActor().turnTowardsPos(ThreeAPI.getCamera().position);
        //    console.log("wEnc ready", encounter);
        }

        let proceduralEncounter = null;

        let completedEncounters = GameAPI.gameAdventureSystem.getCompletedEncounters();

        let lodUpdated = function(lodL) {
            if (this.isActive === false) {
                return;
            }
            lodLevel = lodL;

            if (lodLevel === 0 || lodLevel === 1) {

                let encId = "enc_"+this.id

                if (encounterConfig === null) {
                    if (completedEncounters.indexOf(encId) === -1) {
                        encounterConfig = poolFetch('ProceduralEncounterConfig');
                        encounterConfig.generateConfig(this.obj3d.position, this.encounterLevel, this.groundHeightData, this.terrainData)
                        let worldEncounters = GameAPI.worldModels.getEncounterById()
                        proceduralEncounter = new WorldEncounter(encId, encounterConfig.config, onReady)
                        worldEncounters.push(proceduralEncounter);
                    }
                } else {
                    console.log("Not loading completed dynamic encounter..", encId);
                //    skippedEncounters[encId] = encounter[i];
                }

                deactivateVisible();
            } else {

                if (lodLevel > -1 && lodLevel < 4) {
                    activateVisible()
                } else {
                    deactivateVisible()
                }

                if (encounterConfig !== null) {
                    clearEncounter()
                }
            }

        }.bind(this)

        let getLodLevel = function() {
            return lodLevel;
        }

        this.call = {
            deactivate:deactivate,
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
        this.lvlMin = lvlMin;
        this.lvlMax = lvlMax;
        this.id = 'dyn_sp_'+index+'_wl_'+worldLevel;
        findSpawnPosition(this);
    }

    getPos() {
        return this.obj3d.position;
    }

    activateSpawnPoint() {
        this.isActive = true;
        this.lodActive = true;
        ThreeAPI.registerTerrainLodUpdateCallback(this.getPos(), this.call.lodUpdated);
    }

    deactivateSpawnPoint() {
        this.call.lodUpdated(-1);
        this.isActive = false;
    }

    removeSpawnPoint() {
        this.call.deactivate()
    }

}

export {DynamicSpawnPoint}