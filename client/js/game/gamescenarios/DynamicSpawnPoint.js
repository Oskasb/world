import {Object3D} from "../../../libs/three/core/Object3D.js";
import {Vector3} from "../../../libs/three/math/Vector3.js";
import {VisualModelPalette} from "../visuals/VisualModelPalette.js";
import {paletteMap} from "../visuals/Colors.js";
import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";
import {WorldEncounter} from "../encounter/WorldEncounter.js";
import {detachConfig} from "../../application/utils/ConfigUtils.js";
import {ENUMS} from "../../application/ENUMS.js";

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

function findSpawnPosition(sPoint, onFoundCB) {
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
                    onFoundCB(sPoint)
                    return;
                }
            }
        }
    }

    sPoint.retries++;
    retry(sPoint, onFoundCB);
}

function retry(sPoint, cb) {

    if (Math.random() < 0.05) {
    //    setTimeout(function() {
        //    console.log("retries", sPoint.retries);
            findSpawnPosition(sPoint, cb);
  //      }, 1);
    } else {
        findSpawnPosition(sPoint, cb);
    }

}


let sPointReady = function(sPoint) {
 //   if (sPoint.isActive) {
//        ThreeAPI.registerTerrainLodUpdateCallback(sPoint.getPos(), sPoint.call.lodUpdated);
 //   }
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

        let loadedConfig = null;

        let palette = new VisualModelPalette()

        let update = function() {

            let cPos = ThreeAPI.getCameraCursor().getLookAroundPoint();

            let distance = MATH.distanceBetween(cPos, this.getPos());

            if (distance > 200) {
                deactivateVisible();
                return;
            }

            tempVec.copy(cPos);
            tempVec.y += 2;
        //    for (let i = 0; i < activeActors.length; i++) {
                evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:this.obj3d.position, to:tempVec, color:'PURPLE'});
        //    }

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

            if (proceduralEncounter !== null) {
                let worldEncounters = GameAPI.worldModels.getEncounterById()
                MATH.splice(worldEncounters, proceduralEncounter);
                proceduralEncounter.deactivateWorldEncounter();
                proceduralEncounter = null;
            }
        }

        let deactivate = function() {
            ThreeAPI.clearTerrainLodUpdateCallback(lodUpdated);
            this.call.lodUpdated(-1)
            this.isActive = false;
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
            if (isVisible !== true) {
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

            lodLevel = lodL;

            if (lodLevel === 0 || lodLevel === 1) {

                let encId = this.id

                if (encounterConfig === null) {
                    if (completedEncounters.indexOf(encId) === -1) {
                        encounterConfig = poolFetch('ProceduralEncounterConfig');
                        if (loadedConfig === null) {
                            encounterConfig.generateConfig(this.obj3d.position, this.encounterLevel, this.groundHeightData, this.terrainData)
                        } else {
                            encounterConfig.setConfig(loadedConfig);
                        }

                        let worldEncounters = GameAPI.worldModels.getEncounterById();
                        let config = encounterConfig.config;
                        config.edit_id = this.id;
                        proceduralEncounter = new WorldEncounter(encId, config, onReady)
                        worldEncounters.push(proceduralEncounter);
                    } else {
                        console.log("Not loading completed dynamic encounter..", encId);
                        //    skippedEncounters[encId] = encounter[i];
                    }
                }

                deactivateVisible();
            } else {

                if (lodLevel > -1 && lodLevel < 3) {
                    activateVisible()
                } else {
                    deactivateVisible()
                }

                if (proceduralEncounter !== null) {
                    clearEncounter()
                }
            }

        }.bind(this)

        let getLodLevel = function() {
            return lodLevel;
        }


        let setLoadedConfig = function(conf) {
            loadedConfig = conf;
        }



        this.call = {

            deactivate:deactivate,
            getLodLevel:getLodLevel,
            lodUpdated:lodUpdated,
            setLoadedConfig:setLoadedConfig
        }

    }


    initDynamicSpawnPoint(index, maxPoints, worldLevel, yMax, lvlMin, lvlMax) {
        this.call.setLoadedConfig(null);
        this.dynamic = true;
        this.isActive = false;
        this.retries = 0;
        this.index = index;
        this.maxPoints = maxPoints;
        this.worldLevel = worldLevel;
        this.yMax = yMax;
        this.lvlMin = lvlMin;
        this.lvlMax = lvlMax;
        this.id = 'dyn_sp_'+index+'_wl_'+worldLevel;
        findSpawnPosition(this, sPointReady);
    }

    applyConfig(weConf) {

        if (this.dynamic === true) {
            this.call.lodUpdated(-1);
            this.dynamic = false;
        }

        this.removeSpawnPoint();

        MATH.vec3FromArray(this.getPos(), weConf.pos);
        ThreeAPI.groundAt(this.getPos(), this.terrainData)
        this.call.setLoadedConfig(weConf);
        this.isActive = false;
        this.id = weConf.edit_id;
        this.encounterLevel = weConf.level;
        this.activateSpawnPoint()

    }

    getPos() {
        return this.obj3d.position;
    }

    activateSpawnPoint() {
        this.isActive = true;
        this.lodActive = true;
        ThreeAPI.registerTerrainLodUpdateCallback(this.getPos(), this.call.lodUpdated);
    }

    removeSpawnPoint() {
        this.call.deactivate()
    }

}

export {DynamicSpawnPoint}