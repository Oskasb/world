import {ConfigData} from "../../../application/utils/ConfigData.js";
import {Object3D} from "../../../../libs/three/core/Object3D.js";

let tempObj = new Object3D();

class TerrainElementModel {
    constructor(terrainGeo) {
        this.terrainGeometry = terrainGeo;
        this.levelOfDetail = 7;
        this.lodMap = null;
        this.lodLevelInstances = [];
        this.instances = [];
    }

    loadData = function(terrainTreesId) {
        let terrainListLoaded = function(data) {
            this.lodMap = data['lod_map'];
            this.applyConfig();
            for (let i = 0; i < this.lodMap.length; i++) {
                this.lodLevelInstances[i] = [];
            }
        }.bind(this);

        let configData = new ConfigData("TERRAIN", "GROUND_ELEMENTS", "ground_elements", 'data_key', 'config')
        configData.addUpdateCallback(terrainListLoaded);
        configData.parseConfig( terrainTreesId, terrainListLoaded)
    };

    updateElementModels(terrainSectionInfo, fromLod, toLod, maxLod) {

        for (let i = 0; i < this.lodLevelInstances.length; i++) {
            if (this.lodMap[i].length) {
                if (fromLod < toLod) {
                    for (let i = fromLod; i < toLod; i++) {
                        this.clearLodLevel(i);
                    }
                } else {
                    for (let i = toLod; i < maxLod; i++) {
                        this.populateLodLevel(terrainSectionInfo, i);
                    }


                }
            }
        }
    }

    applyConfig() {
        this.applyLevelOfDetail(-1);
    }

    populateLodLevel(terrainSectionInfo, lodLevel) {
        let lodInstances = this.lodLevelInstances[lodLevel];
        if (lodInstances.length) {
            return;
        }
   //     console.log("Populate lod level. ", lodLevel)
        let addLodInstance = function(instance) {
            lodInstances.push(instance);
        }.bind(this);

        let lodAssets = this.lodMap[lodLevel]
        let groundElems = terrainSectionInfo.getLodLevelGroundElements(lodLevel);

        if (!groundElems) return;

        for (let i = 0; i < groundElems.length  ; i++) {
            for (let j = 0; j < lodAssets.length  ;j++) {
                if (groundElems[i].groundData.y > 0.9) {
                    groundElems[i].setupElementModel(lodAssets[j], addLodInstance)
                }
            }
        }

    }

    clearLodLevel(lodLevel) {
        let lodInstances = this.lodLevelInstances[lodLevel];
        while (lodInstances.length) {
       //     console.log("Clear lod level. ", lodLevel)
            let model = lodInstances.pop();
            model.decommissionInstancedModel();
        }
    }

    applyLevelOfDetail(lodLevel, terrainSectionInfo) {


        if (this.levelOfDetail === lodLevel || this.lodMap.length === 0) {
            return;
        }

        if (lodLevel === -1) {
            for (let i = 0; i < this.lodLevelInstances.length; i++) {
                this.clearLodLevel(i);
            }
            // console.log("clear trees")
        } else {
            // console.log("Update trees lod level. ", lodLevel)
        //    if (lodLevel === 0) {

            if (this.levelOfDetail === -1) {
                this.levelOfDetail = this.lodMap.length
            }
                this.updateElementModels(terrainSectionInfo, MATH.clamp(this.levelOfDetail, 0, this.lodMap.length), lodLevel,  this.lodMap.length);
        //    }

        }
        this.levelOfDetail = lodLevel;
    }
}

export { TerrainElementModel }