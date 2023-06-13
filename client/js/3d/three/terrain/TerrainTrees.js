import {ConfigData} from "../../../application/utils/ConfigData.js";
import {Object3D} from "../../../../libs/three/core/Object3D.js";

let tempObj = new Object3D();

class TerrainTrees {
    constructor(terrainGeo) {
        this.terrainGeometry = terrainGeo;
        this.levelOfDetail = -1;
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

        let configData = new ConfigData("VEGETATION", "TERRAIN_TREES", "terrain_trees_config", 'data_key', 'config')
        configData.addUpdateCallback(terrainListLoaded);
        configData.parseConfig( terrainTreesId, terrainListLoaded)
    };

    updateTrees(fromLod, toLod, maxLod) {

        for (let i = 0; i < this.lodLevelInstances.length; i++) {
            if (this.lodMap[i].length) {

                if (fromLod > toLod) {

                    for (let i = fromLod; i < toLod; i++) {
                        this.clearLodLevel(i);
                    }

                } else {

                    for (let i = toLod; i < maxLod; i++) {
                        this.populateLodLevel(i);
                    }

                }
            }
        }
    }

    applyConfig() {
        this.applyLevelOfDetail(-1);
    }

    populateLodLevel(lodLevel) {
        let lodInstances = this.lodLevelInstances[lodLevel];
        if (lodInstances.length) {
            return;
        }
   //     console.log("Populate lod level. ", lodLevel)
        let addLodInstance = function(instance) {

            instance.spatial.obj3d.position.copy(this.terrainGeometry.obj3d.position);

            let tGeo = this.terrainGeometry;
        //    tempObj.position.z += 10;

        //    tempObj.scale.set(0.5, 0.5, 0.5);
            lodInstances.push(instance);
        //    setTimeout(function () {
            //    instance.setActive(ENUMS.InstanceState.ACTIVE_VISIBLE);
                tempObj.position.copy(instance.spatial.obj3d.position)
                tempObj.position.y = ThreeAPI.terrainAt(instance.spatial.obj3d.position, ThreeAPI.tempVec3c);
                ThreeAPI.tempVec3c.add(tempObj.position);
                tempObj.lookAt(ThreeAPI.tempVec3c);
                tempObj.scale.set(1, 1, 1);
                instance.spatial.stickToObj3D(tempObj);
         //   }, 100)

        //    instance.spatial.stickToObj3D(tempObj);
            ThreeAPI.getScene().remove(instance.spatial.obj3d)
        }.bind(this);

        let lodAssets = this.lodMap[lodLevel]

        for (let i = 0; i < lodAssets.length  ; i++) {
            client.dynamicMain.requestAssetInstance(lodAssets[i], addLodInstance)
        }


    }

    clearLodLevel(lodLevel) {
        let lodInstances = this.lodLevelInstances[lodLevel];
        while (lodInstances.length) {
            console.log("Clear lod level. ", lodLevel)
            let tree = lodInstances.pop();
            tree.decommissionInstancedModel();
        }
    }

    applyLevelOfDetail(lodLevel) {
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
                this.updateTrees(MATH.clamp(this.levelOfDetail, 0, this.lodMap.length), lodLevel,  this.lodMap.length);
        //    }

        }
        this.levelOfDetail = lodLevel;
    }
}

export { TerrainTrees }