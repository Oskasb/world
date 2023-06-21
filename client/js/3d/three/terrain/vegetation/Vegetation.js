import {ExpandingPool} from "../../../../application/utils/ExpandingPool.js";
import {Instantiator} from "../../instancer/Instantiator.js";
import {Plant} from "./Plant.js";
import {VegetationGrid} from "./VegetationGrid.js";
import {ConfigData} from "../../../../application/utils/ConfigData.js";

let configDefault = {
    "sys_key": "VEG_8x8",
    "asset_id":  "asset_vegQuad",
    "pool_size": 6000,
    "render_order": 0
};

let count = 0;

class Vegetation {
    constructor() {

        count++;

        this.init = 0;
        this.areaGrids = [];
        this.config = {};
        this.plantConfigs = {};
        this.instanceAssetKeys = [];
        this.instantiator = new Instantiator();
        this.plantPools = {};

        let populateSector = function(sector, plantCount) {
            this.populateVegetationSector(sector, plantCount)
        }.bind(this);

        let depopulateSector = function(sector) {
            this.depopulateVegetationSector(sector)
        }.bind(this);

        let getPlantConfigs = function(key) {
            return this.plantConfigs[key]
        }.bind(this);

        let updateVegetation = function()  {
            this.updateVegetation();
        }.bind(this)

        this.callbacks = {
            populateSector:populateSector,
            depopulateSector:depopulateSector,
            getPlantConfigs:getPlantConfigs,
            updateVegetation:updateVegetation
        }
    };

    //   this.vegetation.initVegetation("grid_default", new WorkerData('VEGETATION', 'GRID'),  new WorkerData('VEGETATION', 'PLANTS') ,simReady);
    initVegetation(vegReadyCB) {
        let dataId = "plants_default"
        let vegGridData = new ConfigData('VEGETATION', 'GRID')
        let plantsData = new ConfigData('VEGETATION', 'PLANTS')

        let dataInit = 0;
        let plantInit = 0;

        let plantDataReady = function(data) {
            console.log("Plants data",this.init,  data[0].data);
            this.applyPlantConfig(data[0].data);
            if (plantInit === 0) {
                plantInit = 1;
                GameAPI.registerGameUpdateCallback(this.callbacks.updateVegetation);
                vegReadyCB()
            } else {
                this.resetVegetationSectors();
            }
        }.bind(this);

        plantsData.addUpdateCallback(plantDataReady)

        let onDataReady = function(data) {
            console.log("Veg data",this.init, data[0].data);
            this.applyConfig(data[0].data);
            if (dataInit === 0) {
                dataInit = 1;
                this.setupInstantiator();
            }
            this.resetVegetationSectors();
        }.bind(this);

        console.log("init Veg data", vegGridData);
        vegGridData.addUpdateCallback(onDataReady)
        vegGridData.fetchData('grid_default');

        plantsData.fetchData(dataId);

    };

    applyConfig(config) {

        for (let key in config) {
            this.config[key] = config[key];
        }

    };

    applyPlantConfig(config) {

        for (let key in config) {
            this.plantConfigs[key] = config[key];
        }

    };

    setupInstantiator() {

        let addPlant = function(poolKey, callback) {
            callback(poolKey, new Plant(poolKey, plantActivate, plantDectivate))
        };

        this.instantiator.addInstanceSystem(this.config.asset_id, this.config.sys_key, this.config.asset_id, this.config.pool_size, this.config.render_order);

        let treesCfg = this.config.trees;
        if (treesCfg) {
            for (let i = 0; i < treesCfg.length; i++) {
                let assetId = treesCfg[i].asset_id
                this.instanceAssetKeys.push(assetId);
                this.instantiator.addInstanceSystem(assetId, assetId, assetId, treesCfg[i].pool_size, treesCfg[i].render_order);
                this.plantPools[assetId] = new ExpandingPool(assetId, addPlant);
            }
        }

        this.plantPools[this.config.asset_id] = new ExpandingPool(this.config.asset_id, addPlant);

        let plantActivate = function(plant) {
            this.activateVegetationPlant(plant)
        }.bind(this);

        let plantDectivate = function(plant) {
            this.deactivateVegetationPlant(plant)
        }.bind(this);

    };

    buildBufferElement(poolKey, cb) {
        this.instantiator.buildBufferElement(poolKey, cb)
    };

    addVegetationAtPosition(patchConfig, pos, terrainSystem) {

        let area = terrainSystem.getTerrainAreaAtPos(pos);
        let grid = MATH.getFromArrayByKeyValue(this.areaGrids, 'terrainArea', area);
        grid.addPatchToVegetationGrid(patchConfig, pos);

    };

    createPlant(assetId, cb) {

        let getPlant = function(key, plant) {
            cb(plant);
        }.bind(this);

        this.plantPools[assetId].getFromExpandingPool(getPlant)

    };

    vegetateTerrainArea(area) {
        let grid = new VegetationGrid(area, this.callbacks.populateSector, this.callbacks.depopulateSector, this.callbacks.getPlantConfigs, 'plants');
        grid.generateGridSectors(this.config.sector_plants, this.config.grid_range);
        area.call.setVegetationGrid(grid);
    };

    activateVegetationPlant(plant) {
        this.buildBufferElement(plant.poolKey, plant.getElementCallback())
    };

    deactivateVegetationPlant(plant) {
        this.instantiator.recoverBufferElement(plant.poolKey, plant.getPlantElement());
        plant.bufferElement = null;
    };

    populateVegetationSector(sector, plantCount) {
        //    "asset_vegQuad" gets replaced when instancing buffer is fetched.. redundant maybe...
        for (let i = 0; i < plantCount; i++) {
            this.createPlant("asset_vegQuad", sector.getAddPlantCallback());
        }
    };

    depopulateVegetationSector(sector) {
        sector.deactivateSectorPlants();
    };

    updateVegetation() {
    //    for (let i = 0; i < this.areaGrids.length; i++) {
    //        this.areaGrids[i].updateVegetationGrid()
    //    }
        this.instantiator.updateInstantiatorBuffers();
    };

    resetVegetationSectors = function() {

        let rebuild;

        while (this.areaGrids.length) {
            let areaGrid = this.areaGrids.pop();
            areaGrid.disposeGridSectors();
            if (areaGrid.terrainArea) {
                rebuild = areaGrid.terrainArea;
            }

        }

        if (rebuild) {
            this.instantiator.updateInstantiatorBuffers();
            this.vegetateTerrainArea(rebuild)
        }

    };

};

export {Vegetation}